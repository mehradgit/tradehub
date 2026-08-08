import pandas as pd
import random
from datetime import datetime, timedelta
import uuid

# ====== لیست کشورها ======
COUNTRIES = [
    ('United States', 'US'),
    ('United Kingdom', 'GB'),
    ('Germany', 'DE'),
    ('France', 'FR'),
    ('Canada', 'CA'),
    ('Australia', 'AU'),
    ('Iran', 'IR'),
    ('Turkey', 'TR'),
    ('UAE', 'AE'),
    ('India', 'IN'),
    ('China', 'CN'),
    ('Japan', 'JP'),
    ('Brazil', 'BR'),
    ('Mexico', 'MX'),
    ('Spain', 'ES'),
    ('Italy', 'IT'),
    ('Netherlands', 'NL'),
    ('Poland', 'PL'),
    ('Kenya', 'KE'),
    ('New Zealand', 'NZ'),
    ('South Korea', 'KR'),
    ('Singapore', 'SG'),
    ('Malaysia', 'MY'),
    ('Thailand', 'TH'),
    ('Vietnam', 'VN'),
]

# ====== دسته‌بندی‌ها و زیردسته‌ها ======
CATEGORIES = {
    'Coffee & Beverages': [
        'Green Coffee Beans', 'Roasted Coffee', 'Instant Coffee',
        'Tea', 'Matcha', 'Cocoa', 'Energy Drinks'
    ],
    'Honey & Sweeteners': [
        'Raw Honey', 'Manuka Honey', 'Acacia Honey', 'Wildflower Honey',
        'Maple Syrup', 'Agave Syrup', 'Stevia', 'Dates Syrup'
    ],
    'Fruits & Vegetables': [
        'Fresh Fruits', 'Dried Fruits', 'Frozen Vegetables',
        'Organic Vegetables', 'Exotic Fruits', 'Citrus'
    ],
    'Grains & Cereals': [
        'Rice', 'Wheat', 'Quinoa', 'Oats', 'Barley', 'Corn',
        'Buckwheat', 'Millet', 'Couscous'
    ],
    'Spices & Herbs': [
        'Pepper', 'Cinnamon', 'Turmeric', 'Ginger', 'Cardamom',
        'Cumin', 'Coriander', 'Nutmeg', 'Cloves', 'Saffron', 'Vanilla'
    ],
    'Oils & Vinegars': [
        'Olive Oil', 'Sunflower Oil', 'Canola Oil', 'Coconut Oil',
        'Sesame Oil', 'Avocado Oil', 'Balsamic Vinegar', 'Apple Cider Vinegar'
    ],
    'Dairy & Eggs': [
        'Milk', 'Cheese', 'Yogurt', 'Butter', 'Cream', 'Eggs'
    ],
    'Meat & Poultry': [
        'Beef', 'Chicken', 'Lamb', 'Turkey', 'Duck', 'Pork'
    ],
    'Nuts & Seeds': [
        'Almonds', 'Walnuts', 'Cashews', 'Pistachios', 'Hazelnuts',
        'Sunflower Seeds', 'Pumpkin Seeds', 'Chia Seeds', 'Flax Seeds'
    ],
    'Organic & Natural': [
        'Organic Superfoods', 'Natural Supplements', 'Plant-Based Proteins',
        'Organic Snacks', 'Fermented Foods'
    ]
}

# ====== توابع کمکی ======
def random_country():
    return random.choice(COUNTRIES)

def random_category():
    return random.choice(list(CATEGORIES.keys()))

def random_subcategory(category):
    return random.choice(CATEGORIES[category])

def random_quantity():
    return random.choice([10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000])

def random_unit():
    return random.choice(['kg', 'g', 'L', 'ml', 'pieces', 'boxes', 'pallets', 'containers'])

def random_budget():
    ranges = [
        'Under $1,000', '$1,000 – $5,000', '$5,000 – $10,000',
        '$10,000 – $25,000', '$25,000 – $50,000', '$50,000 – $100,000',
        '$100,000+'
    ]
    return random.choice(ranges)

def random_deadline():
    return (datetime.now() + timedelta(days=random.randint(7, 90))).strftime('%Y-%m-%d')

def random_shipping():
    return random.choice(['FOB', 'CIF', 'EXW', 'DDP', 'DAP'])

def random_certifications():
    certs = [
        'USDA Organic', 'EU Organic', 'Fair Trade', 'ISO 22000',
        'Halal', 'Kosher', 'Rainforest Alliance', 'Non-GMO',
        'USDA Organic, Fair Trade', 'EU Organic, Halal'
    ]
    return random.choice(certs) if random.random() > 0.3 else ''

def random_attachments():
    if random.random() > 0.4:
        return ['specs.pdf', 'certificate.pdf', 'sample_photos.jpg']
    return []

def random_urgent():
    return random.random() > 0.7

def generate_description(category, subcategory):
    templates = [
        f"Looking for high-quality {subcategory.lower()} for our {category.lower()} production line.",
        f"We need a reliable supplier of {subcategory.lower()} for our expanding business.",
        f"Please quote for {subcategory.lower()} with monthly delivery.",
        f"Seeking premium {subcategory.lower()} for export to Europe.",
        f"Urgent requirement for {subcategory.lower()} - need immediate samples.",
        f"Looking for certified organic {subcategory.lower()} for our product line.",
        f"Need bulk supply of {subcategory.lower()} for food processing.",
        f"Requesting quotes for {subcategory.lower()} with long-term contract.",
    ]
    return random.choice(templates)

# ====== تولید داده ======
def generate_buying_requests(n=300):
    data = []
    used_titles = set()

    for i in range(n):
        category = random_category()
        subcategory = random_subcategory(category)
        country_name, country_code = random_country()

        # تولید عنوان یکتا
        base_title = f"{subcategory} · {random.randint(100, 9999)} {random_unit()}"
        title = base_title
        count = 1
        while title in used_titles:
            title = f"{base_title} ({count})"
            count += 1
        used_titles.add(title)

        # تولید توضیحات
        description = generate_description(category, subcategory)

        # تولید کمیت
        quantity = random_quantity()
        unit = random_unit()

        # تولید کشور خریدار
        buyer_country, _ = random_country()

        row = {
            'title': title,
            'category': category,
            'subCategory': subcategory,
            'description': description,
            'quantity': quantity,
            'unit': unit,
            'budgetRange': random_budget(),
            'currency': 'USD',
            'deadline': random_deadline(),
            'shippingTerms': random_shipping(),
            'deliveryCountry': country_name,
            'packagingReq': random.choice(['As per requirement', 'Standard packaging', 'Customized packaging', '']),
            'certifications': random_certifications(),
            'attachments': ', '.join(random_attachments()),
            'isUrgent': random_urgent(),
            'isVisible': True,
            'buyerCountry': buyer_country,
            'supplierCode': random.randint(1000000, 1000100),  # برای ارتباط با کاربر
        }
        data.append(row)

    return pd.DataFrame(data)

# ====== ذخیره فایل ======
if __name__ == "__main__":
    df = generate_buying_requests(300)
    df.to_excel('buying_requests.xlsx', index=False)
    print("✅ 300 buying requests generated and saved to buying_requests.xlsx")
    print(f"📊 Categories distribution:\n{df['category'].value_counts().to_string()}")