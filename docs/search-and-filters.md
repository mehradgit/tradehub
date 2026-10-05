# جست‌وجو و فیلتر — راهنمای معماری و استقرار

این سند سیستم یکپارچه‌ی جست‌وجو/فیلتر را توضیح می‌دهد: چطور کار
می‌کند، چطور فیلتر یا اتریبیوت جدید اضافه کنیم، و چه گام‌هایی برای
استقرار لازم است.

---

## ۱. معماری در یک نگاه

```
                    ┌──────────────────────────────────┐
                    │  src/lib/filters/schemas.js      │
                    │  تنها منبع حقیقت فیلترها         │
                    └───────────────┬──────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐         ┌──────────────────┐        ┌─────────────────┐
│ buildWhere.js │         │  FilterBar.js    │        │  params.js      │
│ فیلتر → شرط   │         │  نوار + پنل      │        │  URL ↔ فیلتر     │
│    Prisma     │         │                  │        │  (سرور/کلاینت)  │
└───────────────┘         └──────────────────┘        └─────────────────┘
        ▲                           ▲
        │                           │
┌───────┴───────────────────────────┴──────────────────────────────────┐
│  serverContext.js — getFilterContext(schemaKey, searchParams)        │
│  درخت دسته + گزینه‌ها + اتریبیوت‌ها + شرط + facet را یک‌جا می‌دهد     │
└──────────────────────────────────────────────────────────────────────┘
```

**اصل طراحی:** صفحه‌ها هیچ منطق فیلتری ندارند. هر صفحه فقط
`getFilterContext` را صدا می‌زند، `where`/`orderBy` را به Prisma
می‌دهد و `<FilterBar {...barProps} />` را رندر می‌کند.

---

## ۲. فایل‌ها

### موتور فیلتر
| فایل | نقش |
|---|---|
| `src/lib/filters/schemas.js` | تعریف اعلانی همه‌ی فیلترها + `baseWhere` + `searchableFields` + `sortOptions` |
| `src/lib/filters/params.js` | خواندن/نوشتن پارامترهای URL (pure، مشترک سرور و کلاینت) |
| `src/lib/filters/buildWhere.js` | تبدیل مقادیر فیلتر به شرط Prisma + صفحه‌بندی + `orderBy` |
| `src/lib/filters/options.js` | پر کردن گزینه‌ها از واژگان و لیست کشورها (فقط سرور) |
| `src/lib/filters/serverContext.js` | بسته‌ی آماده برای Server Components |
| `src/hooks/useFilterParams.js` | هوک کلاینت (خواندن/اعمال/پاک‌کردن) |

### UI
| فایل | نقش |
|---|---|
| `src/components/filters/FilterBar.js` | نوار باریک + دکمه «Filters» با بج تعداد |
| `src/components/filters/FilterSheet.js` | پنل کشویی همه‌ی فیلترها (Escape + قفل اسکرول + aria) |
| `src/components/filters/FilterField.js` | رندرکننده‌ی هر نوع فیلد |
| `src/components/filters/CategoryCascader.js` | انتخابگر دسته سه‌سطحی |
| `src/components/filters/ActiveFilterChips.js` | چیپ فیلترهای فعال با حذف تکی |

### دسته‌بندی و اتریبیوت
| فایل | نقش |
|---|---|
| `src/lib/categoryTree.js` | ساخت درخت سه‌سطحی + `resolveCategoryPath` (pure) |
| `src/lib/attributesService.js` | تعاریف اتریبیوت + resolve برای مسیر + EAV + facet |
| `src/lib/attributeValues.js` | تبدیل شکل مقادیر بین فرم و API (pure) |
| `src/lib/vocabularies.js` | واژگان کنترل‌شده در `Setting["vocabularies"]` |
| `src/lib/searchText.js` | ساخت متن یکجای جست‌وجو (pure) |

### کامپوننت‌های فرم
| فایل | نقش |
|---|---|
| `src/components/ui/VocabularySelect.js` | dropdown واژگان (تک/چندگزینه‌ای، با مقدار دلخواه) |
| `src/components/product/ProductAttributesFields.js` | فیلدهای مشخصات داینامیک بر اساس دسته |

---

## ۳. اتریبیوت‌ها چطور کار می‌کنند

### تعریف (پنل ادمین → `/admin/attributes`)

هر اتریبیوت یک `scope` دارد و از سلسله‌مراتب ارث می‌برد:

```
global                              ← همه‌ی محصولات
  └ category    (scopeId = grains-cereals)
      └ subCategory (scopeId = rice)
          └ productType (scopeId = basmati)
```

اگر یک `key` در چند scope تعریف شود، **خاص‌ترین** برنده است.

### مثال عسل

| key | label | dataType | unit | options |
|---|---|---|---|---|
| `moisture` | Moisture content | number | % | — |
| `color` | Colour | select | — | Amber / Dark / Light |
| `floral_source` | Floral source | multiSelect | — | Acacia / Clover / Multifloral |
| `organic` | Organic | boolean | — | — |
| `mgo` | MGO | number | mg/kg | — |

فقط همین‌ها را در پنل تعریف می‌کنی. **بعدش:**

- فرم ثبت محصول، وقتی دسته = Honey انتخاب شود، خودکار این‌ها را نشان می‌دهد
- پنل فیلتر `/products`، وقتی دسته = Honey انتخاب شود، خودکار این‌ها را نشان می‌دهد
- کنار هر گزینه‌ی انتخابی، **تعداد محصولات** (facet count) نمایش داده می‌شود

**هیچ کدی برای این‌ها لازم نیست.**

### ذخیره‌سازی

- اتریبیوت `multiSelect` برای هر گزینه یک ردیف `ProductAttribute` می‌سازد
  تا فیلتر ایندکس‌پذیر بماند (`@@index([attributeId, valueString])`).
- ذخیره به‌صورت «حذف کامل + درج مجدد» است، پس همیشه idempotent است.

---

## ۴. افزودن فیلتر جدید

فقط یک شیء به `fields` اسکیمای مربوطه در `schemas.js` اضافه کن:

```js
{
  name: "leadTimeMax",        // نام پارامتر در URL
  type: "number",             // text | multiSelect | select | boolean |
                              // numberRange | number | date |
                              // categoryCascader | dynamicAttributes | sort
  label: "Max lead time",
  dbField: "leadTime",        // ستون دیتابیس
  op: "lte",                  // برای type:"number" (gte | lte)
  unit: "days",
  primary: true,              // true = در نوار باریک هم دیده شود
}
```

سپس همین. نوار، پنل، چیپ‌ها و شرط Prisma خودکار به‌روز می‌شوند.

### حالت‌های خاص

| نیاز | راه‌حل |
|---|---|
| ستون CSV (`certifications`) | `matchMode: "contains"` |
| فیلتر روی رابطه (`user.businessType`) | `relation: "user"` |
| فیلتر «دارد / ندارد» | `relationExists: "products"` |
| شرط سفارشی (مثل دسته‌بندی پروفایل) | `manualOnly: true` و اعمال در خود صفحه |

---

## ۵. دسته‌بندی سه‌سطحی

درخت از همان `productTypes[]` موجود در `categories.json` ساخته می‌شود —
پس آن فایل ۱۶۳۴ خطی دست‌نخورده مانده است.

```
سطح ۱: grains-cereals     (Grains & Cereals)
سطح ۲: rice               (Rice)
سطح ۳: basmati            (Basmati)
```

`categoryPath = "grains-cereals/rice/basmati"` روی `Product` و
`BuyingRequest` ذخیره و با **prefix روی ایندکس** فیلتر می‌شود:

```sql
-- همه‌ی برنج‌ها (سطح ۲)
WHERE categoryPath = 'grains-cereals/rice' OR categoryPath LIKE 'grains-cereals/rice/%'
```

**لینک‌های قدیمی** `?category=Rice&subCategory=...` خودکار به path
تبدیل می‌شوند، پس هیچ لینک یا بوکمارکی نمی‌شکند.

---

## ۶. استقرار — گام‌های اجباری

> ⚠️ بدون گام ۱ و ۲، اپ **کرش می‌کند** چون شِما مدل و ستون جدید دارد.

```bash
# ۱. تولید کلاینت Prisma
npx prisma generate

# ۲. ساخت جدول‌ها و ستون‌های جدید
npx prisma db push

# ۳. بیلد
npm run build
pm2 restart foodhub --update-env     # یا سرویس معادل
```

```bash
# ۴. اگر واژگان تازه است، یک‌بار از پنل یا API ساخته می‌شود
#    (/api/vocabularies خودش مقادیر پیش‌فرض را می‌نویسد)

# ۵. پر کردن categoryPath و searchText ردیف‌های موجود
#    (چون به alias «@/» نیاز دارد، یک API است نه اسکریپت)
curl -X POST "http://127.0.0.1:3000/api/admin/maintenance/rebuild-indexes" \
  -H "Content-Type: application/json" \
  -H "Cookie: <کوکی نشست ادمین>" \
  -d '{"only":"both"}'
```

```bash
# ۶. ایندکس FULLTEXT (یک‌بار در هر محیط)
mysql -u root foodhub < prisma/sql/fulltext-indexes.sql
```

### ترتیب مهم است

اگر گام ۵ را قبل از ۲ بزنی، خطای «ستون وجود ندارد» می‌گیری.
اگر گام ۵ را نزنی، محصولات قدیمی در فیلتر دسته‌بندی **پیدا نمی‌شوند**
(چون `categoryPath` آن‌ها خالی است).

---

## ۷. جدول‌ها و ستون‌های جدید

| تغییر | توضیح |
|---|---|
| `Product.categoryPath` | مسیر سه‌سطحی برای فیلتر پیشوندی (+ ایندکس) |
| `Product.searchText` | متن یکجای جست‌وجو (+ FULLTEXT) |
| `Product.paymentTerms` | فیلتر «نحوه پرداخت» روی محصولات |
| `BuyingRequest.categoryPath` | همان، برای درخواست‌ها |
| `BuyingRequest.searchText` | همان |
| `AttributeDefinition` | تعریف اتریبیوت‌ها |
| `ProductAttribute` | مقادیر اتریبیوت (EAV) |
| ایندکس‌های جدید | `[categoryPath]`، `[status, isVisible]`، `[countryCode]`، `[deliveryCountry]`، `[userId]` |

---

## ۸. عیب‌یابی

| نشانه | علت | راه‌حل |
|---|---|---|
| `Unknown argument categoryPath` | `prisma generate` نزده‌ای | گام ۱ |
| `Table 'AttributeDefinition' doesn't exist` | `db push` نزده‌ای | گام ۲ |
| فیلتر دسته نتیجه نمی‌دهد | `categoryPath` ردیف‌ها خالی است | گام ۵ |
| بخش Specifications خالی است | برای آن دسته اتریبیوت تعریف نشده | `/admin/attributes` |
| دراپ‌داون‌های فرم خالی‌اند | `Setting["vocabularies"]` ساخته نشده | `/admin/vocabularies` یا یک‌بار `GET /api/vocabularies` |
| facet count نشان داده نمی‌شود | اتریبیوت `isFilterable` نیست | در پنل اتریبیوت تیک بزن |
| ایمیل‌ها ارسال نمی‌شوند | ربطی به این سیستم ندارد | `/admin/scheduled-jobs` |

---

## ۹. زمان‌بندی و پنجره‌ی زمانی

- مچ‌کردن cron با **ساعت محلی سرور** انجام می‌شود.
- برای تهران: `timedatectl set-timezone Asia/Tehran`.
- تایمرهای systemd مربوط به ایمیل/تیکت جدای از این سیستم‌اند
  (بخش `docs/` را ببین یا `systemctl list-timers 'foodtrade*'`).

---

## ۹.۵ ⚠️ نرمال‌سازی داده‌های قدیمی (مهم)

فرم‌های قدیمی، **رشته‌های نمایشی** را در دیتابیس ذخیره می‌کردند:

| فرم قدیمی ذخیره می‌کرد | واژگان جدید ذخیره می‌کند |
|---|---|
| `FOB (Free On Board)` | `FOB` |
| `CIF (Cost, Insurance, Freight)` | `CIF` |
| `T/T` یا `Telegraphic Transfer` | `T/T in advance` |
| `DDP (Delivered Duty Paid)` | `DDP` |

### اثرش روی فیلتر

فیلتر از `contains` استفاده می‌کند، پس:

- ✅ فیلتر `FOB` روی ردیف قدیمی `FOB (Free On Board)` **کار می‌کند** (زیررشته است)
- ❌ فیلتر `T/T in advance` روی ردیف قدیمی `T/T` **کار نمی‌کند**

یعنی فیلترهای «نحوه پرداخت» و «نحوه تحویل» تا زمانی که داده‌ی قدیمی
نرمال نشود، بخشی از ردیف‌ها را از دست می‌دهند.

### راه‌حل — پنل ادمین `/admin/maintenance`

ابزار «Normalise legacy vocabulary values» دقیقاً همین کار را می‌کند:

1. **Preview (dry run)** را بزن — **هیچ چیزی نوشته نمی‌شود**.
   گزارش می‌دهد: چند ردیف اسکن شد، چند تا تغییر می‌کند، و
   **چند تا نگاشت نشدند** (مثلاً `PayPal` یا `L/C` تنها که
   نگاشت قطعی ندارند).
2. اگر نتیجه درست بود، **Apply changes** را بزن (با تأیید).

نکات ایمنی:
- پیش‌فرض همیشه **dry-run** است؛ فقط `{"dryRun": false}` صریح
  مینویسد.
- مقدار نگاشت‌نشده **حفظ می‌شود**، هیچ‌وقت پاک یا خالی نمی‌شود.
- نگاشت‌ها به مقادیر واقعی واژگان اعتبارسنجی می‌شوند؛ اگر ادمین
  گزینه‌ای را تغییر داده باشد، آن alias نادیده گرفته می‌شود.
- ایدمپوتنت است — اجرای دوباره نتیجه‌ی یکسان می‌دهد.

**اگر چیزی «unmatched» ماند:** به `/admin/vocabularies` برو، مقدار
استاندارد را به واژگان اضافه کن، و دوباره Preview و Apply بزن.
(لینک مستقیم در همان کارت هست.)

### نمونه‌ی نگاشت‌ها

| مقدار قدیمی | مقدار استاندارد |
|---|---|
| `FOB (Free On Board)` | `FOB` |
| `CIF (Cost, Insurance, Freight)` | `CIF` |
| `T/T` یا `Telegraphic Transfer` | `T/T in advance` |
| `ISO 9001:2015` | `ISO 9001` |
| `USDA Organic` / `NOP` | `Organic (USDA)` |
| `Fair Trade` | `Fairtrade` |
| `Metric Ton` / `tonne` | `MT` |
| `PayPal` | ⚠️ نگاشت نمی‌شود — به واژگان اضافه کن |
| `L/C` (تنها) | ⚠️ بین ۴ گزینه مبهم است — دستی تعیین کن |

بعد از نرمال‌سازی، در همان صفحه **Rebuild search indexes** را بزن
تا `categoryPath` و `searchText` ردیف‌ها هم به‌روز شود.

> نکته: `VocabularySelect` مقدار قدیمی که در لیست نیست را به‌عنوان
> یک گزینه‌ی اضافه نشان می‌دهد، پس در فرم ویرایش **هیچ داده‌ای پنهان
> نمی‌شود** و کاربر می‌تواند آن را به مقدار استاندارد تغییر دهد.

<details>
<summary>روش دستی با SQL (اگر پنل در دسترس نبود)</summary>

```sql
-- نمونه — قبل از اجرا حتماً از دیتابیس بکاپ بگیر
UPDATE BuyingRequest SET shippingTerms = 'FOB'
  WHERE shippingTerms LIKE 'FOB%';
UPDATE BuyingRequest SET shippingTerms = 'CIF'
  WHERE shippingTerms LIKE 'CIF%';
UPDATE BuyingRequest SET paymentTerms = 'T/T in advance'
  WHERE paymentTerms IN ('T/T', 'Telegraphic Transfer');
```

</details>

---

## ۱۰. لندینگ‌های SEO — ✅ پیاده شد

مسیر: `src/app/(public)/categories/[...path]/page.js`

```
/categories/grains-cereals
/categories/grains-cereals/rice
/categories/grains-cereals/rice/basmati
```

### ⚠️ چرا `/categories/...` و نه `/products/...`

طرح اولیه `/products/grains-cereals/rice` بود، اما با صفحه‌ی محصول
**تضاد مسیر** دارد:

```
src/app/(public)/products/[productNumber]/[slug]/page.js
                        └── segments: 2

/products/1/basmati-rice             ← صفحه‌ی محصول
/products/grains-cereals             ← ۱ سگمنت → تضاد ندارد
/products/grains-cereals/rice        ← ۲ سگمنت ⇒ Next آن را صفحه‌ی
                                       محصول می‌بیند، parseInt("rice")
                                       می‌شود NaN ⇒ notFound
```

Next.js مسیر `/products/grains-cereals/rice` را به‌عنوان صفحه‌ی
محصول تفسیر می‌کند. پیشوند جدا (`/categories/...`) این تضاد را کامل
حل می‌کند و عمق دلخواه می‌دهد.

### چه چیزی در هر لندینگ هست

| مورد | جزئیات |
|---|---|
| `generateMetadata` | عنوان/توضیح پویا + `alternates.canonical` + OG + Twitter + `robots` |
| JSON-LD | `CollectionPage` + `ItemList` + `BreadcrumbList` |
| بریدکرامب | هر سطح لینک‌دار (`Home › Products › … › Basmati`) |
| زیردسته‌ها | چیپ‌های لینک‌دار به سطح بعدی (لینک‌سازی داخلی) |
| فیلترها | همان `FilterBar` مشترک — کاربر می‌تواند روی مبدا/قیمت/مشخصات فیلتر کند |
| نتایج | گرید محصولات + صفحه‌بندی |
| مسیر نامعتبر | `notFound()` |
| sitemap | همه‌ی گره‌های درخت با اولویت بر اساس سطح (۱ → ۰.۸) |
| لینک داخلی | بریدکرامب صفحه‌ی `/products` هم به این لندینگ‌ها اشاره می‌کند |

### نکته‌ی کارایی

اعتبارسنجی مسیر با `getCategoryTreeOnly()` انجام می‌شود (فقط درخت)،
نه `getFilterContext()` — وگرنه گزینه‌ها و facet بی‌دلیل دو بار
محاسبه می‌شدند.

---

## ۱۱. کارهای باقی‌مانده (پیشنهاد)

### ۱۱.۱ جست‌وجوی رتبه‌بندی‌شده

تبدیل `contains` به `MATCH(searchText) AGAINST(? IN NATURAL LANGUAGE MODE)`
تا جست‌وجو از ایندکس FULLTEXT استفاده کند و نتایج رتبه‌بندی شوند.
نیازمند `$queryRaw` است چون Prisma این را پشتیبانی نمی‌کند.

### ۱۱.۲ بقیه

- **نرمال‌سازی داده‌ی قدیمی** (بخش ۹.۵)
- **اتریبیوت برای درخواست‌ها** — الان EAV فقط محصول است
  (`ProductAttribute`)؛ اگر لازم شد یک `RequestAttribute` مشابه
- **جست‌وجوهای ذخیره‌شده** و هشدار «محصول جدید در دسته‌ی من»
- **یکپارچه‌سازی `globals.css`** — استایل نوار فیلتر و پنل فعلاً inline است
- **دامنه‌ی canonical** — `BASE_URL` در چند فایل `foodtradelink.com`
  هاردکد شده است؛ اگر دامنه‌ی واقعی چیز دیگری است باید یک‌جا شود

---

## ۱۲. مگا سرچ — تنها ورودی جست‌وجو و فیلتر کل سایت

صفحه‌ی `/search` **حذف شد** و سرچ درون صفحات هم برداشته شد. حالا:

- **هدر** تنها جای جست‌وجوست: یک فیلد کوچک که با کلیک/فوکوس/`/`
  به نوار بزرگ تبدیل می‌شود (ورودی + انتخابگر حوزه + مرتب‌سازی +
  دکمه Filters + چیپ‌ها).
- **صفحات** فقط یک فیلد **مصنوعی** دارند که همان نوار هدر را باز
  می‌کند، به‌علاوه‌ی یک دکمه‌ی `Filters` که مدال را مستقیم باز می‌کند.
- **فیلترها** مدال‌اند نه کشویی از بغل. مدال دو سطح دارد:
  سطح ۱ فهرست گروه‌ها، سطح ۲ پارامترهای یک فیلتر که **جایگزین**
  سطح ۱ می‌شود (`←` / `Escape` / کلیک بیرون / Apply همه برمی‌گردانند).

### معماری — چرا مدال در صفحه ساخته می‌شود نه در هدر

داده‌ی فیلتر (گزینه‌ها، درخت دسته، تعاریف اتریبیوت، facet) سمت سرور
و داخل خودِ صفحه تولید می‌شود. هدر به آن دسترسی ندارد و اگر می‌خواست
داشته باشد، به یک API جدید برای facet و تکرار منطق نیاز بود. پس:

```
دکمه Filters هدر
      │  window.dispatchEvent(CustomEvent)
      ▼
FilterBar همان صفحه (داده‌ی سرور را دارد) → مدال را باز می‌کند
```

گذرگاه رویداد در `src/lib/filterEvents.js` است:
`OPEN_FILTERS` (هدر → مدال صفحه) و `OPEN_MEGA` (فیلد مصنوعی → نوار هدر).

### مسیر جست‌وجو

```
┌─ فیلد کوچک هدر ────────────────────────────────────────────┐
│  کلیک / فوکوس / کلید «/»  →  نوار بزرگ باز + فوکوس ورودی   │
└────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        ▼                                       ▼
  انتخابگر حوزه                            دکمه Filters
  Products / Requests / Companies          (رویداد → مدال صفحه)
        │                                       │
        └──────────────► /products             مدال سطح ۱
                         /requests             └─► مدال سطح ۲
                         /profiles                 (جایگزین)
                         ?search=…&page=1
```

- **مرتب‌سازی** dropdown جدا کنار `Filters` در نوار است (فیلتر نیست،
  پس در مدال نیست).
- **چیپ‌های هدر** از `readFilterValues` + اسکیمای همان بخش ساخته
  می‌شوند. چیپ اتریبیوت‌های پویا در هدر نمایش داده **نمی‌شود** (چون
  تعاریفشان سمت سرور است) — آن‌ها در چیپ‌های خود صفحه هستند.
- **`HeroSearch`** صفحه‌ی اصلی هم به `/products?search=…` می‌رود.
- **JSON-LD sitelinks searchbox** در `src/app/layout.js` به
  `/products?search={search_term_string}` اشاره می‌کند.

### فایل‌های مرتبط

| فایل | نقش |
|---|---|
| `src/lib/filterEvents.js` | گذرگاه رویداد هدر ↔ صفحه |
| `src/components/layout/HeaderSearch.js` | فیلد کوچک + نوار مگا + انتخابگر حوزه + مرتب‌سازی |
| `src/components/filters/FilterModal.js` | مدال سطح ۱ و ۲ (`summarizeField` هم اینجاست) |
| `src/components/filters/FilterBar.js` | فیلد مصنوعی + دکمه Filters + چیپ‌ها + مدال |
| `src/components/filters/FilterField.js` | رندرکننده‌ی هر نوع فیلد؛ لیست‌های بلند **کادر جست‌وجو** دارند و گزینه‌های دارای `code` (کشورها) **پرچم** نشان می‌دهند |

> `src/components/filters/FilterSheet.js` دیگر استفاده نمی‌شود (کشویی
> قدیمی) و `src/components/{product/ProductFilterBar,requests/FilterBar,
> profiles/ProfileFilter}.js` هم کد مرده‌اند — هر چهار فایل را می‌توان
> دستی حذف کرد.

> **موتور فیلتر دست‌نخورده است:** `schemas.js`، `buildWhere.js`،
> `params.js` و `serverContext.js` هیچ تغییری نکردند — این کار فقط
> لایه‌ی UI و ناوبری را عوض کرد، پس `where` و facet سمت سرور همان
> قبلی است.
