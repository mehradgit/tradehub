// scripts/seed-data/product-pools.js
// ============================================================
// پول محصولات به‌ازای هر دسته‌بندی اصلی
// هر محصول: name, unit, price, moq, keywords (برای دانلود تصویر)
// ============================================================

const productPools = {
  // ============================================================
  // خرما و خشکبار
  // ============================================================
  "nuts-seeds-dried-fruits": [
    { name: "Medjool Dates Jumbo Grade A",       unit: "kg", price: 4.80, moq: 500, keywords: "medjool,dates" },
    { name: "Sukkary Dates Premium",             unit: "kg", price: 5.50, moq: 500, keywords: "dates,sukkary" },
    { name: "Ajwa Al-Madinah Dates",             unit: "kg", price: 28.00, moq: 100, keywords: "ajwa,dates" },
    { name: "Siwa Organic Dates",                unit: "kg", price: 3.80, moq: 500, keywords: "organic,dates" },
    { name: "Deglet Nour Dates Branch",          unit: "kg", price: 4.20, moq: 1000, keywords: "deglet,date-palm" },
    { name: "Khalas Dates Fresh",                unit: "kg", price: 5.00, moq: 500, keywords: "khalas,dates" },
    { name: "Barhi Dates Rutab",                 unit: "kg", price: 6.50, moq: 300, keywords: "barhi,dates" },
    { name: "Dried Figs Premium Turkish Style",  unit: "kg", price: 7.20, moq: 500, keywords: "dried,figs" },
    { name: "Dried Apricots Malatya",            unit: "kg", price: 5.80, moq: 500, keywords: "dried,apricots" },
    { name: "Golden Raisins Seedless",           unit: "kg", price: 3.40, moq: 1000, keywords: "raisins,grapes" },
    { name: "Dried Prunes Pitted",               unit: "kg", price: 3.90, moq: 1000, keywords: "prunes,dried" },
    { name: "Dried Mango Slices",                unit: "kg", price: 6.80, moq: 500, keywords: "dried,mango" },
    { name: "Dried Cranberries Sweetened",       unit: "kg", price: 5.10, moq: 500, keywords: "cranberries,dried" },
    { name: "Dried Mulberries White",            unit: "kg", price: 8.50, moq: 300, keywords: "mulberries,dried" },
    { name: "Almonds Raw California",            unit: "kg", price: 8.90, moq: 500, keywords: "almonds,raw" },
    { name: "Pistachios Roasted Salted",         unit: "kg", price: 14.50, moq: 300, keywords: "pistachios,roasted" },
    { name: "Walnut Kernels Light Halves",       unit: "kg", price: 9.80, moq: 500, keywords: "walnuts,kernels" },
    { name: "Cashews W320 Roasted",              unit: "kg", price: 11.20, moq: 500, keywords: "cashews,roasted" },
    { name: "Hazelnuts Blanched Turkey",         unit: "kg", price: 10.50, moq: 500, keywords: "hazelnuts,turkey" },
    { name: "Pine Nuts Premium Grade",           unit: "kg", price: 32.00, moq: 100, keywords: "pine,nuts" },
    { name: "Mixed Nuts Roasted",                unit: "kg", price: 12.00, moq: 300, keywords: "mixed,nuts" },
    { name: "Date Paste Natural",                unit: "kg", price: 2.80, moq: 1000, keywords: "date,paste" },
    { name: "Date Syrup (Dibs) Organic",         unit: "L",  price: 4.20, moq: 500, keywords: "date,syrup" },
    { name: "Dried Papaya Chunks",               unit: "kg", price: 5.60, moq: 500, keywords: "dried,papaya" },
    { name: "Dried Banana Chips",                unit: "kg", price: 4.80, moq: 500, keywords: "banana,chips" },
    { name: "Dried Tomato Sun-Dried",            unit: "kg", price: 7.50, moq: 300, keywords: "sun,dried,tomato" },
    { name: "Dried Strawberry Freeze",           unit: "kg", price: 18.00, moq: 200, keywords: "freeze,dried,strawberry" },
    { name: "Dried Mango Powder",                unit: "kg", price: 8.20, moq: 300, keywords: "mango,powder" },
    { name: "Sesame Seeds Hulled",               unit: "kg", price: 3.20, moq: 1000, keywords: "sesame,seeds" },
    { name: "Sunflower Seeds Kernels",           unit: "kg", price: 2.90, moq: 1000, keywords: "sunflower,seeds" },
  ],

  // ============================================================
  // روغن زیتون
  // ============================================================
  "oils-fats-shortenings": [
    { name: "Extra Virgin Olive Oil Cold Pressed",        unit: "L", price: 6.80, moq: 1000, keywords: "olive,oil,bottle" },
    { name: "Organic Extra Virgin Olive Oil",             unit: "L", price: 8.50, moq: 500, keywords: "olive,oil,organic" },
    { name: "Chetoui EVOO High Polyphenol",               unit: "L", price: 9.20, moq: 500, keywords: "olive,oil,green" },
    { name: "Chemlali EVOO Classic",                      unit: "L", price: 6.20, moq: 1000, keywords: "olive,oil,bottle" },
    { name: "Picholine Marocaine EVOO",                   unit: "L", price: 7.50, moq: 500, keywords: "olive,oil,gold" },
    { name: "Zaity Olive Oil Virgin",                     unit: "L", price: 5.80, moq: 1000, keywords: "olive,oil" },
    { name: "Sorani Olive Oil Traditional",               unit: "L", price: 6.50, moq: 1000, keywords: "olive,oil,jar" },
    { name: "Kaissy Olive Oil Delicate",                  unit: "L", price: 7.00, moq: 1000, keywords: "olive,oil" },
    { name: "Early Harvest EVOO Limited",                 unit: "L", price: 11.00, moq: 300, keywords: "olive,oil,harvest" },
    { name: "Single Origin EVOO Tunisia",                 unit: "L", price: 8.80, moq: 500, keywords: "olive,oil,tunisia" },
    { name: "PDO Certified Olive Oil",                    unit: "L", price: 9.80, moq: 500, keywords: "olive,oil,certified" },
    { name: "Refined Olive Oil",                          unit: "L", price: 3.60, moq: 2000, keywords: "olive,oil,refined" },
    { name: "Olive Pomace Oil",                           unit: "L", price: 2.80, moq: 2000, keywords: "olive,pomace" },
    { name: "Virgin Olive Oil Blend",                     unit: "L", price: 4.20, moq: 1000, keywords: "olive,oil" },
    { name: "Kalamata Table Olives in Brine",             unit: "kg", price: 3.20, moq: 500, keywords: "kalamata,olives" },
    { name: "Green Olives Stuffed",                       unit: "kg", price: 2.90, moq: 500, keywords: "green,olives" },
    { name: "Black Olives Dry Salt Cured",                unit: "kg", price: 3.50, moq: 500, keywords: "black,olives" },
    { name: "Olive Tapenade Natural",                     unit: "kg", price: 6.20, moq: 300, keywords: "olive,tapenade" },
    { name: "Organic Olive Oil Bulk (IBC)",               unit: "L", price: 4.80, moq: 5000, keywords: "olive,oil,bulk" },
    { name: "Olive Oil Cosmetics Grade",                  unit: "L", price: 5.50, moq: 1000, keywords: "olive,oil,cosmetic" },
    { name: "EVOO 5L Tin Premium",                        unit: "L", price: 6.20, moq: 500, keywords: "olive,oil,tin" },
    { name: "EVOO 750ml Glass Bottle",                    unit: "L", price: 7.50, moq: 1000, keywords: "olive,oil,glass" },
    { name: "EVOO 250ml Gift Set",                        unit: "L", price: 12.00, moq: 500, keywords: "olive,oil,gift" },
    { name: "Olive Oil Private Label",                    unit: "L", price: 6.00, moq: 2000, keywords: "olive,oil,label" },
    { name: "High Polyphenol EVOO Reserve",               unit: "L", price: 14.50, moq: 300, keywords: "olive,oil,reserve" },
    { name: "Moroccan Argan Oil Cosmetic",                unit: "L", price: 45.00, moq: 100, keywords: "argan,oil" },
    { name: "Argan Oil Food Grade",                       unit: "L", price: 55.00, moq: 100, keywords: "argan,oil,food" },
  ],

  // ============================================================
  // میوه و سبزی تازه
  // ============================================================
  "fruits-vegetables": [
    { name: "Valencia Oranges Premium",              unit: "kg", price: 0.65, moq: 5000, keywords: "valencia,oranges" },
    { name: "Navel Oranges Seedless",                unit: "kg", price: 0.72, moq: 5000, keywords: "navel,oranges" },
    { name: "Murcott Mandarins Sweet",               unit: "kg", price: 0.85, moq: 3000, keywords: "mandarins,citrus" },
    { name: "Clementines Fresh",                     unit: "kg", price: 0.90, moq: 3000, keywords: "clementines,citrus" },
    { name: "Lemons Eureka",                         unit: "kg", price: 0.70, moq: 3000, keywords: "lemons,fresh" },
    { name: "Grapefruits Star Ruby",                 unit: "kg", price: 0.80, moq: 3000, keywords: "grapefruit,citrus" },
    { name: "Fresh Strawberries Grade A",            unit: "kg", price: 2.40, moq: 1000, keywords: "fresh,strawberry" },
    { name: "IQF Frozen Strawberries",               unit: "kg", price: 2.80, moq: 5000, keywords: "frozen,strawberry" },
    { name: "Potatoes Spunta Washed",                unit: "kg", price: 0.35, moq: 10000, keywords: "spunta,potato" },
    { name: "Potatoes Diamant Table",                unit: "kg", price: 0.38, moq: 10000, keywords: "potato,fresh" },
    { name: "Red Onions Fresh",                      unit: "kg", price: 0.30, moq: 10000, keywords: "red,onion" },
    { name: "White Onions Premium",                  unit: "kg", price: 0.33, moq: 10000, keywords: "white,onion" },
    { name: "Golden Onions Fresh",                   unit: "kg", price: 0.32, moq: 10000, keywords: "golden,onion" },
    { name: "Tomatoes Roma Vine",                    unit: "kg", price: 0.55, moq: 3000, keywords: "tomato,fresh" },
    { name: "Cherry Tomatoes Premium",               unit: "kg", price: 1.20, moq: 1000, keywords: "cherry,tomato" },
    { name: "Green Beans Fine Extra",                unit: "kg", price: 1.40, moq: 2000, keywords: "green,beans" },
    { name: "Zucchini Fresh",                        unit: "kg", price: 0.60, moq: 3000, keywords: "zucchini,fresh" },
    { name: "Cucumbers Greenhouse",                  unit: "kg", price: 0.50, moq: 3000, keywords: "cucumber,fresh" },
    { name: "Red Peppers Bell",                      unit: "kg", price: 1.10, moq: 2000, keywords: "red,pepper" },
    { name: "Eggplants Black Beauty",                unit: "kg", price: 0.65, moq: 2000, keywords: "eggplant,fresh" },
    { name: "Peaches Yellow Fresh",                  unit: "kg", price: 1.10, moq: 2000, keywords: "peach,fresh" },
    { name: "Nectarines White Flesh",                unit: "kg", price: 1.30, moq: 2000, keywords: "nectarine,fresh" },
    { name: "Plums Red Globe",                       unit: "kg", price: 1.00, moq: 2000, keywords: "plum,fresh" },
    { name: "Watermelons Seedless",                  unit: "kg", price: 0.40, moq: 5000, keywords: "watermelon,fresh" },
    { name: "Melons Cantaloupe",                     unit: "kg", price: 0.55, moq: 3000, keywords: "cantaloupe,melon" },
    { name: "Grapes Crimson Seedless",               unit: "kg", price: 1.80, moq: 1000, keywords: "grapes,red" },
    { name: "Grapes Thompson White",                 unit: "kg", price: 1.60, moq: 1000, keywords: "grapes,white" },
    { name: "Pomegranates Wonderful",                unit: "kg", price: 1.10, moq: 2000, keywords: "pomegranate,fresh" },
    { name: "Figs Fresh Black Mission",              unit: "kg", price: 3.20, moq: 500, keywords: "fresh,figs" },
    { name: "Avocados Hass",                         unit: "kg", price: 2.50, moq: 1000, keywords: "avocado,hass" },
    { name: "Mangoes Kent",                          unit: "kg", price: 1.90, moq: 1000, keywords: "mango,kent" },
    { name: "Fresh Herbs Mixed",                     unit: "kg", price: 4.50, moq: 200, keywords: "fresh,herbs" },
  ],
};

module.exports = { productPools };