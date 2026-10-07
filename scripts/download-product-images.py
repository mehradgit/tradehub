
# scripts/download-product-images.py
# ============================================================
# دانلود تصاویر محصولات از گوگل ایمیج
#
# ورودی:  اکسل با ستون‌های "Product Number" و "Name"
# خروجی:  public/uploads/products/{productNumber}-{01..05}.jpg
#
# اجرا:
#   python scripts/download-product-images.py
# ============================================================

import os
import re
import time
import io
import requests
import pandas as pd

from urllib.parse import urlparse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from webdriver_manager.chrome import ChromeDriverManager


# ============================================================
# مسیرها — نسبت به ریشه‌ی پروژه
# ============================================================
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

EXCEL_FILE  = os.path.join(PROJECT_ROOT, "scripts", "products-export.xlsx")
OUTPUT_DIR  = os.path.join(PROJECT_ROOT, "public", "uploads", "products")

# اگه واقعاً می‌خوای "upload" بدون s باشه، خط بالا رو این کن:
# OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "upload", "products")


# ============================================================
# تنظیمات
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
SCROLL_WAIT = 1.8
HEADLESS = False
SKIP_EXISTING = False


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
# جمع‌آوری لینک عکس‌ها
# ============================================================
def collect_image_urls(driver, query, want=30):
    driver.get("https://www.google.com/imghp?hl=en")
    wait = WebDriverWait(driver, 15)

    box = wait.until(
        EC.presence_of_element_located(
            (By.NAME, "q")
        )
    )

    box.clear()

    box.send_keys(query)

    box.send_keys(Keys.ENTER)

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
# دانلود یک عکس — اسم نهایی رو خودمون تعیین می‌کنیم
# ============================================================

def download_and_optimize(
    url,
    output_path
):

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://www.google.com/",
    }
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()

    ctype = r.headers.get("Content-Type", "")
    if not ctype.startswith("image"):
        raise ValueError(f"not an image ({ctype})")

    # پسوند رو تشخیص بده
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        if "png" in ctype:
            ext = ".png"
        elif "webp" in ctype:
            ext = ".webp"
        elif "gif" in ctype:
            ext = ".gif"
        else:
            ext = ".jpg"

    final_path = dest_path_no_ext + ext
    with open(final_path, "wb") as f:
        f.write(r.content)
    return final_path


# ============================================================
# بررسی اینکه محصول از قبل چند عکس داره
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

    print(f"   🔍 سرچ: {product_name}")

    try:
        urls = collect_image_urls(
            driver,
            product_name,
            want=SKIP_FIRST + IMAGES_PER_PRODUCT + 15,
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
        if index < SKIP_FIRST:
            index += 1
            continue
        if downloaded >= IMAGES_PER_PRODUCT:
            break

        # اسم فایل: 1234567-01.jpg  (بدون پسوند چون download_one خودش اضافه می‌کنه)
        n = downloaded + 1
        dest_no_ext = os.path.join(OUTPUT_DIR, f"{product_number}-{n:02d}")

        try:
            final_path = download_one(url, dest_no_ext)
            size_kb = os.path.getsize(final_path) // 1024
            print(f"   ⬇️  {os.path.basename(final_path)}  ({size_kb} KB)")
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
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ فایل اکسل پیدا نشد: {EXCEL_FILE}")
        print("   اول این رو اجرا کن:  node scripts/export-products.js")
        return

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    print(f"📖 خوندن اکسل: {EXCEL_FILE}")
    print(f"📁 پوشه‌ی خروجی: {OUTPUT_DIR}\n")

    df = pd.read_excel(EXCEL_FILE)

    for col in (
        "Product Number",
        "Name"
    ):

        if col not in df.columns:
            print(f"❌ ستون «{col}» توی اکسل نیست.")
            print(f"   ستون‌های موجود: {list(df.columns)}")
            return

    print(f"✅ {len(df)} محصول داخل اکسل هست.\n")
    print("=" * 60)

    driver = build_driver()

    total_downloaded = 0

    try:
        for i, row in df.iterrows():
            number = row["Product Number"]
            name = str(row["Name"]).strip()

            if not name or pd.isna(number):
                print(f"[{i+1}/{len(df)}] ⚠️  داده ناقص، رد شد")
                continue

            print(f"\n[{i+1}/{len(df)}] 🆔 {number}")

            count = download_images_for_product(driver, number, name)
            total_downloaded += count

            time.sleep(2)

    finally:

        driver.quit()

    print("\n" + "=" * 60)
    print(f"🎉 پایان. {total_downloaded} عکس دانلود شد.")
    print(f"📁 مسیر: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
