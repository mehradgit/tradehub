
# scripts/download-product-images.py
# ============================================================
# دانلود + بهینه‌سازی تصاویر محصولات
#
# امکانات:
#   - Google / Bing
#   - تشخیص CAPTCHA
#   - Resume
#   - حداکثر 5 عکس برای هر محصول
#   - خروجی استاندارد:
#         1200 × 1200
#         WebP
#         کیفیت 82
#         پس‌زمینه سفید
#   - رد کردن تصاویر خیلی کوچک
#   - حفظ نام Product Number
#
# مثال:
#
#   2759501-01.webp
#   2759501-02.webp
#   2759501-03.webp
#
# ============================================================

import os
import re
import time
import io
import requests
import pandas as pd

from urllib.parse import urlparse, quote

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
# تنظیمات پروژه
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        ".."
    )
)

EXCEL_FILE = os.path.join(
    PROJECT_ROOT,
    "scripts",
    "products-export.xlsx"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "public",
    "uploads",
    "products"
)


# ============================================================
# تنظیمات تصاویر
# ============================================================

IMAGES_PER_PRODUCT = 5

OUTPUT_SIZE = 1200

WEBP_QUALITY = 82

# حداقل ابعاد عکس دانلود شده
MIN_SOURCE_WIDTH = 500
MIN_SOURCE_HEIGHT = 500

# اگر تصویر اصلی کمتر از این حجم باشد مشکلی نیست
# اما تصاویر خیلی کوچک معمولاً کیفیت مناسبی ندارند.

# ============================================================
# تنظیمات جستجو
# ============================================================

SKIP_FIRST = 1

MAX_SCROLLS = 4

SCROLL_WAIT = 2.2

HEADLESS = False

# google / bing
SEARCH_ENGINE = "google"

# فاصله بین محصولات
DELAY_BETWEEN_PRODUCTS = 5

# اگر محصول 5 عکس داشته باشد رد می‌شود
SKIP_EXISTING = True


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
# ساخت WebDriver
# ============================================================

def build_driver():

    opts = Options()

    if HEADLESS:
        opts.add_argument("--headless=new")

    opts.add_argument("--start-maximized")

    opts.add_argument(
        "--disable-blink-features=AutomationControlled"
    )

    opts.add_argument("--no-sandbox")

    opts.add_argument(
        "--disable-dev-shm-usage"
    )

    opts.add_argument("--lang=en-US")

    opts.add_experimental_option(
        "excludeSwitches",
        ["enable-automation"]
    )

    opts.add_experimental_option(
        "useAutomationExtension",
        False
    )

    driver = webdriver.Chrome(
        service=Service(
            ChromeDriverManager().install()
        ),
        options=opts
    )

    driver.execute_script(
        """
        Object.defineProperty(
            navigator,
            'webdriver',
            {
                get: () => undefined
            }
        )
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
        "sorry/index",
        "/sorry/",
        "recaptcha",
        "captcha",
    )

    if any(
        marker in url
        for marker in captcha_url_markers
    ):
        return True

    try:
        page_text = (
            driver
            .find_element(
                By.TAG_NAME,
                "body"
            )
            .text
            .lower()
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

    return any(
        marker in page_text
        for marker in text_markers
    )


# ============================================================
# انتظار برای CAPTCHA
# ============================================================

def wait_for_captcha_solved(
    driver,
    timeout_sec=600
):

    print("\n" + "!" * 60)

    print(
        "🛑 CAPTCHA نمایش داده شده!"
    )

    print(
        "   لطفاً CAPTCHA را در مرورگر حل کن."
    )

    print(
        f"   حداکثر {timeout_sec // 60} دقیقه منتظر می‌مانم..."
    )

    print("!" * 60 + "\n")

    start = time.time()

    while (
        time.time() - start
        < timeout_sec
    ):

        time.sleep(3)

        if not is_captcha_page(driver):

            print(
                "✅ CAPTCHA حل شد."
            )

            print(
                "   ادامه می‌دهم...\n"
            )

            return True

    print(
        "⏰ زمان CAPTCHA تمام شد."
    )

    return False


# ============================================================
# Google Images
# ============================================================

def collect_google(
    driver,
    query,
    want=30
):

    driver.get(
        "https://www.google.com/imghp?hl=en"
    )

    wait = WebDriverWait(
        driver,
        15
    )

    box = wait.until(
        EC.presence_of_element_located(
            (By.NAME, "q")
        )
    )

    box.clear()

    box.send_keys(query)

    box.send_keys(Keys.ENTER)

    time.sleep(3)

    if is_captcha_page(driver):

        if not wait_for_captcha_solved(
            driver
        ):
            return []

    urls = set()

    for _ in range(MAX_SCROLLS):

        driver.execute_script(
            "window.scrollBy(0, document.body.scrollHeight);"
        )

        time.sleep(
            SCROLL_WAIT
        )

        if is_captcha_page(driver):

            if not wait_for_captcha_solved(
                driver
            ):
                break

        html = driver.page_source

        patterns = (

            r'\["(https?://[^"]+?)",\d+,\d+\]',

            r'"ou":"(https?://[^"]+?)"',

            r'"imgurl":"(https?://[^"]+?)"',
        )

        for pattern in patterns:

            for match in re.findall(
                pattern,
                html
            ):

                urls.add(
                    match.replace(
                        "\\/",
                        "/"
                    )
                )

        urls = {
            url
            for url in urls
            if not any(
                bad in url
                for bad in (
                    "gstatic.com",
                    "google.com",
                    "googleusercontent",
                    "ggpht.com",
                    "data:image"
                )
            )
        }

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# Bing Images
# ============================================================

def collect_bing(
    driver,
    query,
    want=30
):

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

        time.sleep(
            SCROLL_WAIT
        )

        html = driver.page_source

        for match in re.findall(
            r'"murl":"(https?://[^"]+?)"',
            html
        ):

            urls.add(
                match.replace(
                    "\\/",
                    "/"
                )
            )

        for match in re.findall(
            r'mediaurl=([^&"]+)',
            html
        ):

            urls.add(
                requests.utils.unquote(
                    match
                )
            )

        urls = {
            url
            for url in urls
            if not any(
                bad in url
                for bad in (
                    "bing.com",
                    "bing.net",
                    "microsoft.com",
                    "data:image"
                )
            )
        }

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# استانداردسازی تصویر
# ============================================================

def optimize_image(
    image_bytes,
    output_path
):

    try:

        image = Image.open(
            io.BytesIO(
                image_bytes
            )
        )

        # ----------------------------------------------------
        # بررسی ابعاد
        # ----------------------------------------------------

        width, height = image.size

        if (
            width < MIN_SOURCE_WIDTH
            or height < MIN_SOURCE_HEIGHT
        ):

            raise ValueError(
                f"image too small: "
                f"{width}x{height}"
            )

        # ----------------------------------------------------
        # اصلاح Orientation بر اساس EXIF
        # ----------------------------------------------------

        image = ImageOps.exif_transpose(
            image
        )

        # ----------------------------------------------------
        # تبدیل به RGB
        # ----------------------------------------------------

        if image.mode in (
            "RGBA",
            "LA",
            "P"
        ):

            background = Image.new(
                "RGB",
                image.size,
                (
                    255,
                    255,
                    255
                )
            )

            if image.mode == "P":

                image = image.convert(
                    "RGBA"
                )

            background.paste(
                image,
                mask=image.getchannel(
                    "A"
                )
                if image.mode == "RGBA"
                else None
            )

            image = background

        else:

            image = image.convert(
                "RGB"
            )

        # ----------------------------------------------------
        # قرار دادن در Canvas مربع
        # ----------------------------------------------------

        ratio = min(
            OUTPUT_SIZE / image.width,
            OUTPUT_SIZE / image.height
        )

        new_width = max(
            1,
            int(
                image.width * ratio
            )
        )

        new_height = max(
            1,
            int(
                image.height * ratio
            )
        )

        image = image.resize(
            (
                new_width,
                new_height
            ),
            Image.Resampling.LANCZOS
        )

        # ----------------------------------------------------
        # Canvas سفید 1200×1200
        # ----------------------------------------------------

        canvas = Image.new(
            "RGB",
            (
                OUTPUT_SIZE,
                OUTPUT_SIZE
            ),
            (
                255,
                255,
                255
            )
        )

        left = (
            OUTPUT_SIZE
            - new_width
        ) // 2

        top = (
            OUTPUT_SIZE
            - new_height
        ) // 2

        canvas.paste(
            image,
            (
                left,
                top
            )
        )

        # ----------------------------------------------------
        # ذخیره WebP
        # ----------------------------------------------------

        canvas.save(
            output_path,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6
        )

        return True

    except Exception as e:

        raise ValueError(
            f"image processing failed: {e}"
        )


# ============================================================
# دانلود + Optimize
# ============================================================

def download_and_optimize(
    url,
    output_path
):

    headers = {

        "User-Agent":
            USER_AGENT,

        "Referer":
            "https://www.google.com/",
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=REQUEST_TIMEOUT
    )

    response.raise_for_status()

    # --------------------------------------------------------
    # حجم دانلود
    # --------------------------------------------------------

    max_bytes = (
        MAX_DOWNLOAD_SIZE_MB
        * 1024
        * 1024
    )

    if len(response.content) > max_bytes:

        raise ValueError(
            f"image too large "
            f"({len(response.content) // 1024 // 1024} MB)"
        )

    # --------------------------------------------------------
    # Content Type
    # --------------------------------------------------------

    content_type = (
        response
        .headers
        .get(
            "Content-Type",
            ""
        )
        .lower()
    )

    if not content_type.startswith(
        "image"
    ):

        raise ValueError(
            f"not an image ({content_type})"
        )

    # --------------------------------------------------------
    # Optimize
    # --------------------------------------------------------

    optimize_image(
        response.content,
        output_path
    )

    return output_path


# ============================================================
# شمارش عکس‌های محصول
# ============================================================

def count_existing(
    product_number
):

    if not os.path.isdir(
        OUTPUT_DIR
    ):
        return 0

    prefix = (
        f"{product_number}-"
    )

    count = 0

    for filename in os.listdir(
        OUTPUT_DIR
    ):

        lower = filename.lower()

        if (
            filename.startswith(
                prefix
            )
            and lower.endswith(
                ".webp"
            )
        ):

            count += 1

    return count


# ============================================================
# دانلود تصاویر محصول
# ============================================================

def download_images_for_product(
    driver,
    product_number,
    product_name
):

    already = count_existing(
        product_number
    )

    if (
        SKIP_EXISTING
        and already >= IMAGES_PER_PRODUCT
    ):

        print(
            f"   ⏭️  از قبل {already} عکس دارد — رد شد"
        )

        return 0

    start_index = (
        already
        if already > 0
        else 0
    )

    print(
        f"   🔍 سرچ: {product_name}"
    )

    try:

        want = (
            start_index
            + SKIP_FIRST
            + IMAGES_PER_PRODUCT
            + 20
        )

        if SEARCH_ENGINE == "bing":

            urls = collect_bing(
                driver,
                product_name,
                want=want
            )

        else:

            urls = collect_google(
                driver,
                product_name,
                want=want
            )

    except Exception as e:

        print(
            f"   ❌ خطا در سرچ: {e}"
        )

        return 0

    if not urls:

        print(
            "   ⚠️  هیچ لینکی پیدا نشد"
        )

        return 0

    downloaded = 0

    search_index = 0

    target_count = (
        IMAGES_PER_PRODUCT
        - start_index
    )

    for url in urls:

        if (
            search_index
            < SKIP_FIRST
            + start_index
        ):

            search_index += 1

            continue

        if downloaded >= target_count:
            break

        number = (
            start_index
            + downloaded
            + 1
        )

        filename = (
            f"{product_number}"
            f"-{number:02d}"
            f".webp"
        )

        output_path = os.path.join(
            OUTPUT_DIR,
            filename
        )

        # ----------------------------------------------------
        # اگر فایل موجود است
        # ----------------------------------------------------

        if os.path.exists(
            output_path
        ):

            print(
                f"   ⏭️  {filename} موجود است"
            )

            downloaded += 1

            search_index += 1

            continue

        try:

            final_path = (
                download_and_optimize(
                    url,
                    output_path
                )
            )

            size_kb = (
                os.path.getsize(
                    final_path
                )
                // 1024
            )

            print(
                f"   ⬇️  {os.path.basename(final_path)} "
                f"({size_kb} KB)"
            )

            downloaded += 1

        except Exception as e:

            print(
                f"   ⚠️  رد شد: "
                f"{str(e)[:100]}"
            )

        search_index += 1

    return downloaded


# ============================================================
# Main
# ============================================================

def main():

    if not os.path.exists(
        EXCEL_FILE
    ):

        print(
            f"❌ فایل اکسل پیدا نشد:"
        )

        print(
            EXCEL_FILE
        )

        return

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    print("");
    print("=" * 60)
    print(
        "🚀 Product Image Downloader + Optimizer"
    )
    print("=" * 60)

    print(
        f"📖 اکسل: {EXCEL_FILE}"
    )

    print(
        f"📁 خروجی: {OUTPUT_DIR}"
    )

    print(
        f"🔎 موتور: {SEARCH_ENGINE.upper()}"
    )

    print(
        f"🖼️  عکس برای هر محصول: {IMAGES_PER_PRODUCT}"
    )

    print(
        f"📐 اندازه: {OUTPUT_SIZE} × {OUTPUT_SIZE}"
    )

    print(
        f"🎨 فرمت: WebP"
    )

    print(
        f"⭐ کیفیت: {WEBP_QUALITY}"
    )

    print(
        f"📦 حداقل عکس اصلی: "
        f"{MIN_SOURCE_WIDTH}×{MIN_SOURCE_HEIGHT}"
    )

    print(
        f"⏱️  تاخیر: "
        f"{DELAY_BETWEEN_PRODUCTS}s"
    )

    print("")

    # --------------------------------------------------------
    # Excel
    # --------------------------------------------------------

    df = pd.read_excel(
        EXCEL_FILE
    )

    for col in (
        "Product Number",
        "Name"
    ):

        if col not in df.columns:

            print(
                f"❌ ستون «{col}» وجود ندارد."
            )

            print(
                f"ستون‌ها: {list(df.columns)}"
            )

            return

    # --------------------------------------------------------
    # محصولات ناقص
    # --------------------------------------------------------

    pending = []

    completed = 0

    for _, row in df.iterrows():

        number = row[
            "Product Number"
        ]

        name = str(
            row["Name"]
        ).strip()

        if (
            not name
            or pd.isna(number)
        ):

            continue

        # ----------------------------------------------------
        # جلوگیری از تبدیل 2759501.0
        # ----------------------------------------------------

        try:

            if float(number).is_integer():

                number = int(number)

        except Exception:
            pass

        have = count_existing(
            number
        )

        if have < IMAGES_PER_PRODUCT:

            pending.append(
                (
                    number,
                    name,
                    have
                )
            )

        else:

            completed += 1

    print(
        f"📊 کل محصولات: {len(df)}"
    )

    print(
        f"✅ تکمیل شده: {completed}"
    )

    print(
        f"⏳ باقی‌مانده: {len(pending)}"
    )

    print("")
    print("=" * 60)

    if not pending:

        print(
            "🎉 همه محصولات ۵ عکس دارند."
        )

        return

    # --------------------------------------------------------
    # Driver
    # --------------------------------------------------------

    driver = build_driver()

    total_downloaded = 0

    try:

        for i, (
            number,
            name,
            have
        ) in enumerate(
            pending
        ):

            print("")

            print(
                f"[{i + 1}/{len(pending)}]"
                f" 🆔 {number}"
                f"  (دارای {have} عکس)"
            )

            try:

                count = (
                    download_images_for_product(
                        driver,
                        number,
                        name
                    )
                )

                total_downloaded += count

            except Exception as e:

                print(
                    f"   ❌ خطای کلی: {e}"
                )

            if (
                i
                < len(pending) - 1
            ):

                time.sleep(
                    DELAY_BETWEEN_PRODUCTS
                )

    finally:

        driver.quit()

    # --------------------------------------------------------
    # گزارش
    # --------------------------------------------------------

    print("")
    print("=" * 60)

    print(
        f"🎉 پایان اجرا."
    )

    print(
        f"📸 تعداد عکس دانلود شده: "
        f"{total_downloaded}"
    )

    print(
        f"📁 مسیر: {OUTPUT_DIR}"
    )

    print("")
    print(
        "💡 برای ادامه اجرای بعدی، همین اسکریپت را دوباره اجرا کن."
    )

    print(
        "   عکس‌های موجود دوباره دانلود نمی‌شوند."
    )

    print("=" * 60)


# ============================================================
# اجرا
# ============================================================

if __name__ == "__main__":
    main()
