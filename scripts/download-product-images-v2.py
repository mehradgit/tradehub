# scripts/download-product-images-v2.py
# ============================================================
# دانلود + بهینه‌سازی تصاویر محصولات — از دیتابیس (MySQL + Prisma)
#
# ویژگی‌ها:
#   - خواندن محصولات از دیتابیس با helper Node (_db-helpers.js)
#   - فقط محصولاتی که فیلد images آن‌ها خالی است ([] یا null یا "")
#   - جستجوی Google / Bing
#   - تشخیص CAPTCHA
#   - Resume (فایل‌های موجود روی دیسک نادیده گرفته می‌شوند)
#   - هدف: ۷ عکس برای هر محصول (حداقل قابل قبول: ۵)
#   - خروجی استاندارد: 1200x1200 / WebP / کیفیت 82 / پس‌زمینه سفید
#   - ذخیره‌ی مسیرها در فیلد images محصول به‌صورت:
#         ["/uploads/products/9999753-01.webp", ...]
#
# اجرا (از ریشه پروژه):
#   python scripts/download-product-images-v2.py
# ============================================================

import os
import re
import io
import json
import time
import subprocess

import requests

from urllib.parse import quote
from PIL import Image, ImageOps

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from webdriver_manager.chrome import ChromeDriverManager


# ============================================================
# مسیرها
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT, "public", "uploads", "products"
)

OUTPUT_URL_PREFIX = "/uploads/products"

DB_HELPER = os.path.join(
    os.path.dirname(__file__), "_db-helpers.js"
)


# ============================================================
# تنظیمات تصاویر
# ============================================================

IMAGES_PER_PRODUCT = 7
IMAGES_MIN_ACCEPTABLE = 5

OUTPUT_SIZE = 1200
WEBP_QUALITY = 82

MIN_SOURCE_WIDTH = 500
MIN_SOURCE_HEIGHT = 500


# ============================================================
# تنظیمات جستجو
# ============================================================

SKIP_FIRST = 1
MAX_SCROLLS = 4
SCROLL_WAIT = 2.2
HEADLESS = False

# google / bing
SEARCH_ENGINE = "google"

DELAY_BETWEEN_PRODUCTS = 5


# ============================================================
# تنظیمات دانلود
# ============================================================

REQUEST_TIMEOUT = 25
MAX_DOWNLOAD_SIZE_MB = 15

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0 Safari/537.36"
)


# ============================================================
# DB helpers
# ============================================================

def _run_node(args, stdin_data=None, timeout=180):
    if not os.path.exists(DB_HELPER):
        raise RuntimeError(f"DB helper پیدا نشد: {DB_HELPER}")

    return subprocess.run(
        ["node", DB_HELPER, *args],
        cwd=PROJECT_ROOT,
        input=stdin_data,
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=timeout,
    )


def _extract_json(text):
    """
    Prisma ممکن است قبل از JSON چند خط لاگ چاپ کند.
    آخرین بلوک JSON معتبر را از متن استخراج می‌کنیم.
    """
    text = (text or "").strip()
    if not text:
        raise ValueError("empty stdout from helper")

    # ۱) تلاش مستقیم
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # ۲) آخرین خطی که با [ یا { شروع می‌شود
    for line in reversed(text.splitlines()):
        stripped = line.strip()
        if stripped[:1] in ("[", "{"):
            try:
                return json.loads(stripped)
            except json.JSONDecodeError:
                continue

    # ۳) پیدا کردن اولین [ تا آخرین ]
    for open_ch, close_ch in (("[", "]"), ("{", "}")):
        start = text.find(open_ch)
        end = text.rfind(close_ch)
        if start != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                continue

    raise ValueError(
        "could not find valid JSON in helper output:\n"
        + text[:400]
    )


def fetch_pending_products():
    """محصولاتی که فیلد images آن‌ها خالی است را برمی‌گرداند."""

    print("🗄️  خواندن محصولات بدون تصویر از دیتابیس...")

    result = _run_node(["list"], timeout=120)

    if result.returncode != 0:
        raise RuntimeError(
            "خطا در کوئری دیتابیس:\n"
            + (result.stderr or "").strip()
        )

    products = _extract_json(result.stdout)

    if not isinstance(products, list):
        raise RuntimeError(
            f"پاسخ غیرمنتظره از helper: {type(products).__name__}"
        )

    return products


def save_product_images(product_id, image_paths):
    """ذخیره‌ی آرایه‌ی مسیرها در فیلد images محصول."""

    if not image_paths:
        return

    payload = json.dumps(
        [{"id": product_id, "images": image_paths}],
        ensure_ascii=False,
    )

    result = _run_node(
        ["update"], stdin_data=payload, timeout=180
    )

    if result.returncode != 0:
        raise RuntimeError(
            "خطا در آپدیت دیتابیس:\n"
            + (result.stderr or "").strip()
        )


# ============================================================
# WebDriver
# ============================================================

def build_driver():
    opts = Options()

    if HEADLESS:
        opts.add_argument("--headless=new")

    opts.add_argument("--start-maximized")
    opts.add_argument("--disable-blink-features=AutomationControlled")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--lang=en-US")
    opts.add_experimental_option("excludeSwitches", ["enable-automation"])
    opts.add_experimental_option("useAutomationExtension", False)

    driver = webdriver.Chrome(
        service=Service(ChromeDriverManager().install()),
        options=opts,
    )

    driver.execute_script(
        """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        """
    )

    return driver


# ============================================================
# CAPTCHA
# ============================================================

def is_captcha_page(driver):
    try:
        url = driver.current_url.lower()
    except Exception:
        return False

    captcha_url_markers = (
        "sorry/index", "/sorry/", "recaptcha", "captcha",
    )

    if any(marker in url for marker in captcha_url_markers):
        return True

    try:
        page_text = (
            driver.find_element(By.TAG_NAME, "body").text.lower()
        )
    except Exception:
        return False

    text_markers = (
        "unusual traffic",
        "our systems have detected",
        "not a robot",
        "recaptcha",
        "verify you are human",
    )

    return any(marker in page_text for marker in text_markers)


def wait_for_captcha_solved(driver, timeout_sec=600):
    print("\n" + "!" * 60)
    print("🛑 CAPTCHA نمایش داده شده!")
    print("   لطفاً CAPTCHA را در مرورگر حل کن.")
    print(f"   حداکثر {timeout_sec // 60} دقیقه منتظر می‌مانم...")
    print("!" * 60 + "\n")

    start = time.time()

    while time.time() - start < timeout_sec:
        time.sleep(3)

        if not is_captcha_page(driver):
            print("✅ CAPTCHA حل شد.\n")
            return True

    print("⏰ زمان CAPTCHA تمام شد.")
    return False


# ============================================================
# Google Images
# ============================================================

def collect_google(driver, query, want=30):
    driver.get("https://www.google.com/imghp?hl=en")

    wait = WebDriverWait(driver, 15)
    box = wait.until(
        EC.presence_of_element_located((By.NAME, "q"))
    )

    box.clear()
    box.send_keys(query)
    box.send_keys(Keys.ENTER)

    time.sleep(3)

    if is_captcha_page(driver):
        if not wait_for_captcha_solved(driver):
            return []

    urls = set()

    for _ in range(MAX_SCROLLS):
        driver.execute_script(
            "window.scrollBy(0, document.body.scrollHeight);"
        )
        time.sleep(SCROLL_WAIT)

        if is_captcha_page(driver):
            if not wait_for_captcha_solved(driver):
                break

        html = driver.page_source

        patterns = (
            r'\["(https?://[^"]+?)",\d+,\d+\]',
            r'"ou":"(https?://[^"]+?)"',
            r'"imgurl":"(https?://[^"]+?)"',
        )

        for pattern in patterns:
            for match in re.findall(pattern, html):
                urls.add(match.replace("\\/", "/"))

        urls = {
            u for u in urls
            if not any(
                bad in u
                for bad in (
                    "gstatic.com",
                    "google.com",
                    "googleusercontent",
                    "ggpht.com",
                    "data:image",
                )
            )
        }

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# Bing Images
# ============================================================

def collect_bing(driver, query, want=30):
    url = (
        "https://www.bing.com/images/search?q="
        + quote(query)
    )

    driver.get(url)
    time.sleep(3)

    urls = set()

    for _ in range(MAX_SCROLLS):
        driver.execute_script(
            "window.scrollBy(0, document.body.scrollHeight);"
        )
        time.sleep(SCROLL_WAIT)

        html = driver.page_source

        for match in re.findall(
            r'"murl":"(https?://[^"]+?)"', html
        ):
            urls.add(match.replace("\\/", "/"))

        for match in re.findall(
            r'mediaurl=([^&"]+)', html
        ):
            urls.add(requests.utils.unquote(match))

        urls = {
            u for u in urls
            if not any(
                bad in u
                for bad in (
                    "bing.com",
                    "bing.net",
                    "microsoft.com",
                    "data:image",
                )
            )
        }

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# بهینه‌سازی
# ============================================================

def optimize_image(image_bytes, output_path):
    image = Image.open(io.BytesIO(image_bytes))

    width, height = image.size
    if width < MIN_SOURCE_WIDTH or height < MIN_SOURCE_HEIGHT:
        raise ValueError(f"image too small: {width}x{height}")

    image = ImageOps.exif_transpose(image)

    if image.mode in ("RGBA", "LA", "P"):
        background = Image.new(
            "RGB", image.size, (255, 255, 255)
        )

        if image.mode == "P":
            image = image.convert("RGBA")

        background.paste(
            image,
            mask=(
                image.getchannel("A")
                if image.mode == "RGBA"
                else None
            ),
        )
        image = background
    else:
        image = image.convert("RGB")

    ratio = min(
        OUTPUT_SIZE / image.width,
        OUTPUT_SIZE / image.height,
    )

    new_width = max(1, int(image.width * ratio))
    new_height = max(1, int(image.height * ratio))

    image = image.resize(
        (new_width, new_height),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new(
        "RGB", (OUTPUT_SIZE, OUTPUT_SIZE), (255, 255, 255)
    )

    left = (OUTPUT_SIZE - new_width) // 2
    top = (OUTPUT_SIZE - new_height) // 2

    canvas.paste(image, (left, top))

    canvas.save(
        output_path,
        "WEBP",
        quality=WEBP_QUALITY,
        method=6,
    )


def download_and_optimize(url, output_path):
    headers = {
        "User-Agent": USER_AGENT,
        "Referer": "https://www.google.com/",
    }

    response = requests.get(
        url, headers=headers, timeout=REQUEST_TIMEOUT
    )
    response.raise_for_status()

    max_bytes = MAX_DOWNLOAD_SIZE_MB * 1024 * 1024
    if len(response.content) > max_bytes:
        raise ValueError(
            f"image too large "
            f"({len(response.content) // 1024 // 1024} MB)"
        )

    content_type = (
        response.headers.get("Content-Type", "").lower()
    )
    if not content_type.startswith("image"):
        raise ValueError(f"not an image ({content_type})")

    optimize_image(response.content, output_path)
    return output_path


# ============================================================
# فایل‌های موجود روی دیسک
# ============================================================

def collect_existing_paths(product_number):
    """مسیرهای نسبی فایل‌های webp موجود برای این محصول."""

    if not os.path.isdir(OUTPUT_DIR):
        return []

    prefix = f"{product_number}-"
    paths = []

    for filename in sorted(os.listdir(OUTPUT_DIR)):
        lower = filename.lower()
        if filename.startswith(prefix) and lower.endswith(".webp"):
            paths.append(f"{OUTPUT_URL_PREFIX}/{filename}")

    return paths


# ============================================================
# دانلود برای یک محصول
# ============================================================

def download_images_for_product(driver, product):
    product_id = product["id"]
    product_number = product.get("productNumber") or product_id
    product_name = product.get("name") or ""

    already_paths = collect_existing_paths(product_number)
    already = len(already_paths)

    if already >= IMAGES_PER_PRODUCT:
        print(f"   ⏭️  از قبل {already} عکس روی دیسک هست")
        return already_paths

    print(f"   🔍 سرچ: {product_name}")

    try:
        want = (
            already
            + SKIP_FIRST
            + IMAGES_PER_PRODUCT
            + 20
        )

        if SEARCH_ENGINE == "bing":
            urls = collect_bing(driver, product_name, want=want)
        else:
            urls = collect_google(driver, product_name, want=want)

    except Exception as e:
        print(f"   ❌ خطا در سرچ: {e}")
        return already_paths

    if not urls:
        print("   ⚠️  هیچ لینکی پیدا نشد")
        return already_paths

    result_paths = list(already_paths)
    search_index = 0

    for url in urls:
        if len(result_paths) >= IMAGES_PER_PRODUCT:
            break

        if search_index < SKIP_FIRST + already:
            search_index += 1
            continue

        number = len(result_paths) + 1
        filename = f"{product_number}-{number:02d}.webp"
        output_path = os.path.join(OUTPUT_DIR, filename)

        if os.path.exists(output_path):
            result_paths.append(
                f"{OUTPUT_URL_PREFIX}/{filename}"
            )
            search_index += 1
            continue

        try:
            final_path = download_and_optimize(url, output_path)
            size_kb = os.path.getsize(final_path) // 1024

            print(
                f"   ⬇️  {os.path.basename(final_path)} "
                f"({size_kb} KB)"
            )

            result_paths.append(
                f"{OUTPUT_URL_PREFIX}/{filename}"
            )

        except Exception as e:
            print(f"   ⚠️  رد شد: {str(e)[:100]}")

        search_index += 1

    return result_paths


# ============================================================
# Main
# ============================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("")
    print("=" * 60)
    print("🚀 Product Image Downloader (DB mode)")
    print("=" * 60)
    print(f"🗄️  Helper: {DB_HELPER}")
    print(f"📁 خروجی: {OUTPUT_DIR}")
    print(f"🔎 موتور: {SEARCH_ENGINE.upper()}")
    print(
        f"🖼️  هدف: {IMAGES_PER_PRODUCT} عکس "
        f"(حداقل قابل قبول: {IMAGES_MIN_ACCEPTABLE})"
    )
    print(f"📐 اندازه: {OUTPUT_SIZE} × {OUTPUT_SIZE}")
    print(f"⭐ کیفیت: {WEBP_QUALITY}")
    print("")

    try:
        pending = fetch_pending_products()
    except Exception as e:
        print(f"❌ خطا در خواندن دیتابیس: {e}")
        return

    print(f"⏳ محصولات بدون تصویر: {len(pending)}")

    if not pending:
        print("🎉 همه‌ی محصولات تصویر دارند.")
        return

    driver = build_driver()
    total_downloaded = 0
    total_updated = 0

    try:
        for i, product in enumerate(pending):
            pid = product.get("id")
            number = product.get("productNumber") or pid
            name = product.get("name") or ""

            print("")
            print(
                f"[{i + 1}/{len(pending)}] "
                f"🆔 {number}  | {name}"
            )

            try:
                paths = download_images_for_product(driver, product)

                if paths:
                    save_product_images(pid, paths)
                    total_updated += 1
                    total_downloaded += len(paths)

                    if len(paths) < IMAGES_MIN_ACCEPTABLE:
                        print(
                            f"   ⚠️  فقط {len(paths)} عکس "
                            f"(کمتر از حداقل {IMAGES_MIN_ACCEPTABLE})"
                        )
                else:
                    print("   ⚠️  هیچ عکسی ذخیره نشد")

            except Exception as e:
                print(f"   ❌ خطای کلی: {e}")

            if i < len(pending) - 1:
                time.sleep(DELAY_BETWEEN_PRODUCTS)

    finally:
        driver.quit()

    print("")
    print("=" * 60)
    print("🎉 پایان اجرا.")
    print(f"📸 مجموع مسیرهای ذخیره‌شده: {total_downloaded}")
    print(f"🛠️  محصولات آپدیت‌شده در DB: {total_updated}")
    print(f"📁 مسیر: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()