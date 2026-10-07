# scripts/download-product-images.py
# ============================================================
# دانلود تصاویر محصولات از گوگل/بینگ
# - کپچا رو تشخیص می‌ده و صبر می‌کنه تا حلش کنی
# - از جایی که قطع شد ادامه می‌ده (Resume)
# - می‌تونی موتور رو بین google / bing عوض کنی
# ============================================================

import os
import re
import time
import requests
import pandas as pd

from urllib.parse import urlparse, quote
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager


# ============================================================
# تنظیمات
# ============================================================
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXCEL_FILE   = os.path.join(PROJECT_ROOT, "scripts", "products-export.xlsx")
OUTPUT_DIR   = os.path.join(PROJECT_ROOT, "public", "uploads", "products")

IMAGES_PER_PRODUCT = 5
SKIP_FIRST = 1
MAX_SCROLLS = 4
SCROLL_WAIT = 2.2          # کمی بیشتر از قبل
HEADLESS = False

# موتور جستجو: "google" یا "bing"
# اگه گوگل اذیت کرد، بذار "bing"
SEARCH_ENGINE = "google"

# تاخیر بین محصولات (ثانیه) — هر چی بیشتر، امن‌تر
DELAY_BETWEEN_PRODUCTS = 5

# اگه True، محصولاتی که از قبل ۵ عکس دارن رو دوباره نمی‌گیره
SKIP_EXISTING = True


# ============================================================
# ساخت درایور
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
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    return driver


# ============================================================
# تشخیص کپچا
# ============================================================
def is_captcha_page(driver):
    """
    اگه صفحه‌ی گوگل کپچا/«سیستم ما ترافیک مشکوک شناسایی کرده» بود True برمی‌گردونه.
    """
    try:
        url = driver.current_url.lower()
    except Exception:
        return False

    # آدرس‌های معمول کپچای گوگل
    captcha_url_markers = (
        "sorry/index",
        "/sorry/",
        "recaptcha",
        "captcha",
    )
    if any(m in url for m in captcha_url_markers):
        return True

    # متن‌های معمول صفحه‌ی بلاک
    try:
        page_text = driver.find_element(By.TAG_NAME, "body").text.lower()
    except Exception:
        return False

    text_markers = (
        "unusual traffic",
        "our systems have detected",
        "not a robot",
        "recaptcha",
        "verify you are human",
    )
    return any(m in page_text for m in text_markers)


def wait_for_captcha_solved(driver, timeout_sec=600):
    """
    صبر می‌کنه تا کاربر کپچا رو دستی حل کنه.
    هر ۳ ثانیه چک می‌کنه که از صفحه‌ی کپچا خارج شده یا نه.
    """
    print("\n" + "!" * 60)
    print("🛑 گوگل کپچا نشون داده!")
    print("   لطفاً برو توی مرورگر و کپچا رو حل کن.")
    print(f"   حداکثر {timeout_sec // 60} دقیقه صبر می‌کنم...")
    print("!" * 60 + "\n")

    start = time.time()
    while time.time() - start < timeout_sec:
        time.sleep(3)
        if not is_captcha_page(driver):
            print("✅ کپچا حل شد. ادامه می‌دم...\n")
            return True

    print("⏰ زمان تمام شد. از ادامه صرف‌نظر می‌کنم.\n")
    return False


# ============================================================
# جمع‌آوری لینک عکس‌ها از گوگل
# ============================================================
def collect_google(driver, query, want=30):
    driver.get("https://www.google.com/imghp?hl=en")
    wait = WebDriverWait(driver, 15)

    box = wait.until(EC.presence_of_element_located((By.NAME, "q")))
    box.clear()
    box.send_keys(query)
    box.send_keys(Keys.ENTER)

    time.sleep(3)

    # ====== چک کپچا ======
    if is_captcha_page(driver):
        if not wait_for_captcha_solved(driver):
            return []

    urls = set()

    for _ in range(MAX_SCROLLS):
        driver.execute_script("window.scrollBy(0, document.body.scrollHeight);")
        time.sleep(SCROLL_WAIT)

        if is_captcha_page(driver):
            if not wait_for_captcha_solved(driver):
                break

        html = driver.page_source

        for pat in (
            r'\["(https?://[^"]+?)",\d+,\d+\]',
            r'"ou":"(https?://[^"]+?)"',
            r'"imgurl":"(https?://[^"]+?)"',
        ):
            for m in re.findall(pat, html):
                urls.add(m.replace("\\/", "/"))

        urls = {u for u in urls if not any(
            bad in u for bad in
            ("gstatic.com", "google.com", "googleusercontent", "ggpht.com", "data:image")
        )}

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# جمع‌آوری لینک عکس‌ها از بینگ (backup)
# ============================================================
def collect_bing(driver, query, want=30):
    url = f"https://www.bing.com/images/search?q={quote(query)}"
    driver.get(url)
    time.sleep(3)

    urls = set()

    for _ in range(MAX_SCROLLS):
        driver.execute_script("window.scrollBy(0, document.body.scrollHeight);")
        time.sleep(SCROLL_SCROLL_WAIT if False else SCROLL_WAIT)

        html = driver.page_source

        # بینگ لینک عکس اصلی رو در murl نگه می‌داره
        for m in re.findall(r'"murl":"(https?://[^"]+?)"', html):
            urls.add(m.replace("\\/", "/"))
        for m in re.findall(r'mediaurl=([^&"]+)', html):
            urls.add(requests.utils.unquote(m))

        urls = {u for u in urls if not any(
            bad in u for bad in
            ("bing.com", "bing.net", "microsoft.com", "data:image")
        )}

        if len(urls) >= want:
            break

    return list(urls)


# ============================================================
# دانلود یک عکس
# ============================================================
def download_one(url, dest_path_no_ext):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0 Safari/537.36",
        "Referer": "https://www.google.com/",
    }
    r = requests.get(url, headers=headers, timeout=20)
    r.raise_for_status()

    ctype = r.headers.get("Content-Type", "")
    if not ctype.startswith("image"):
        raise ValueError(f"not an image ({ctype})")

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
# چند عکس از قبل داریم؟
# ============================================================
def count_existing(product_number):
    if not os.path.isdir(OUTPUT_DIR):
        return 0
    prefix = f"{product_number}-"
    return sum(
        1 for f in os.listdir(OUTPUT_DIR)
        if f.startswith(prefix) and f.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp"))
    )


# ============================================================
# دانلود عکس‌های یک محصول
# ============================================================
def download_images_for_product(driver, product_number, product_name):
    already = count_existing(product_number)
    if SKIP_EXISTING and already >= IMAGES_PER_PRODUCT:
        print(f"   ⏭️  از قبل {already} عکس داره — رد شد")
        return 0

    # از کجا شروع کنیم؟ (برای resume اگه ناقص مونده)
    start_index = already if already > 0 else 0

    print(f"   🔍 سرچ: {product_name}")

    try:
        if SEARCH_ENGINE == "bing":
            urls = collect_bing(driver, product_name,
                                want=start_index + SKIP_FIRST + IMAGES_PER_PRODUCT + 15)
        else:
            urls = collect_google(driver, product_name,
                                  want=start_index + SKIP_FIRST + IMAGES_PER_PRODUCT + 15)
    except Exception as e:
        print(f"   ❌ خطا در سرچ: {e}")
        return 0

    if not urls:
        print("   ⚠️  هیچ لینکی پیدا نشد")
        return 0

    downloaded = 0
    index = 0

    for url in urls:
        if index < SKIP_FIRST + start_index:
            index += 1
            continue
        if downloaded >= (IMAGES_PER_PRODUCT - start_index):
            break

        n = start_index + downloaded + 1
        dest_no_ext = os.path.join(OUTPUT_DIR, f"{product_number}-{n:02d}")

        try:
            final_path = download_one(url, dest_no_ext)
            size_kb = os.path.getsize(final_path) // 1024
            print(f"   ⬇️  {os.path.basename(final_path)}  ({size_kb} KB)")
            downloaded += 1
        except Exception as e:
            print(f"   ⚠️  رد شد: {str(e)[:60]}")

        index += 1

    return downloaded


# ============================================================
# تابع اصلی
# ============================================================
def main():
    if not os.path.exists(EXCEL_FILE):
        print(f"❌ فایل اکسل پیدا نشد: {EXCEL_FILE}")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"📖 اکسل: {EXCEL_FILE}")
    print(f"📁 خروجی: {OUTPUT_DIR}")
    print(f"🔎 موتور: {SEARCH_ENGINE.upper()}")
    print(f"⏱️  تاخیر بین محصولات: {DELAY_BETWEEN_PRODUCTS}s\n")

    df = pd.read_excel(EXCEL_FILE)

    for col in ("Product Number", "Name"):
        if col not in df.columns:
            print(f"❌ ستون «{col}» توی اکسل نیست. ستون‌ها: {list(df.columns)}")
            return

    # ====== لیست محصولات ناقص ======
    pending = []
    for _, row in df.iterrows():
        number = row["Product Number"]
        name = str(row["Name"]).strip()
        if not name or pd.isna(number):
            continue
        have = count_existing(number)
        if have < IMAGES_PER_PRODUCT:
            pending.append((number, name, have))

    print(f"📊 کل محصولات: {len(df)}")
    print(f"✅ تکمیل شده: {len(df) - len(pending)}")
    print(f"⏳ باقی‌مانده: {len(pending)}\n")
    print("=" * 60)

    if not pending:
        print("🎉 همه‌ی محصولات ۵ عکس دارن. کاری نیست.")
        return

    driver = build_driver()
    total_downloaded = 0

    try:
        for i, (number, name, have) in enumerate(pending):
            print(f"\n[{i+1}/{len(pending)}] 🆔 {number}  (داشتی: {have})")

            try:
                count = download_images_for_product(driver, number, name)
                total_downloaded += count
            except Exception as e:
                print(f"   ❌ خطای کلی: {e}")

            # اگه کپچا حل نشد یا بلاک شدید، این خط می‌تونه مکث طولانی بشه
            if i < len(pending) - 1:
                time.sleep(DELAY_BETWEEN_PRODUCTS)

    finally:
        driver.quit()

    print("\n" + "=" * 60)
    print(f"🎉 پایان این اجرا. {total_downloaded} عکس دانلود شد.")
    print(f"📁 مسیر: {OUTPUT_DIR}")
    print("\n💡 اگه کپچا خوردی و ادامه ندادی، دوباره همین دستور رو بزن؛")
    print("   از همون‌جایی که قطع شد ادامه می‌ده.")


if __name__ == "__main__":
    main()