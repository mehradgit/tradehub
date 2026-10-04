-- ============================================================
-- prisma/sql/fulltext-indexes.sql
-- ============================================================
-- ایندکس‌های FULLTEXT برای جست‌وجوی متنی روی ستون searchText
--
-- این فایل یک migration پریزما نیست؛ یک اسکریپت دستی است که
-- باید یک‌بار روی هر محیط اجرا شود:
--
--   mysql -u root foodhub < prisma/sql/fulltext-indexes.sql
--
-- نکات مهم:
--
--   ۱) MySQL اگر ایندکس با همان نام از قبل وجود داشته باشد،
--      خطا می‌دهد (چیزی شبیه "Duplicate key name"). این اسکریپت
--      قبل از اجرا وجود ایندکس را چک نمی‌کند، پس اگر مطمئن
--      نیستید اول با این دستور بررسی کنید:
--
--        SHOW INDEX FROM Product
--          WHERE Key_name = 'Product_searchText_fulltext';
--
--        SHOW INDEX FROM BuyingRequest
--          WHERE Key_name = 'BuyingRequest_searchText_fulltext';
--
--      اگر خروجی خالی بود، ایندکس وجود ندارد و اجرای ALTER امن است.
--
--   ۲) نام جداول دقیقاً با نام مدل‌های پریزما نوشته می‌شود:
--      `Product` و `BuyingRequest` (حرف اول بزرگ).
--
--   ۳) بعد از ساخت ایندکس، اندپوینت زیر را یک‌بار اجرا کنید تا
--      searchText ردیف‌های قدیمی پر شود، وگرنه آن ردیف‌ها داخل
--      FULLTEXT نمی‌آیند:
--
--        POST /api/admin/maintenance/rebuild-indexes
--        body: { "only": "searchText" }   (یا both)
--
--   ۴) هر دو جدول از موتور InnoDB هستند؛ MySQL 5.6+ از FULLTEXT
--      روی InnoDB پشتیبانی می‌کند. پارامتر پیش‌فرض
--      innodb_ft_min_token_size = 3 است، یعنی کلمات کوتاه‌تر از
--      ۳ کاراکتر در ایندکس نمی‌آیند. اگر لازم بود آن را در
--      my.cnf کم کنید (نیاز به ری‌استارت سرور دارد).
-- ============================================================

-- محصولات
ALTER TABLE `Product`
  ADD FULLTEXT INDEX `Product_searchText_fulltext` (`searchText`);

-- درخواست‌های خرید
ALTER TABLE `BuyingRequest`
  ADD FULLTEXT INDEX `BuyingRequest_searchText_fulltext` (`searchText`);
