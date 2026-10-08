
// scripts/seed-50-buyers-requests.js
// ============================================================
// FoodTradeLink - Demo Buyer Companies + Buying Requests Seeder
//
// Creates:
//   - 50 realistic demo BUYER companies
//   - 1 to 3 buying requests per company
//   - ~100 buying requests total
//
// IMPORTANT:
// Categories / subcategories / products are read from the existing
// Product records in the database, so generated requests always
// belong to categories that actually exist in FoodTradeLink.
//
// Commands:
//
//   node scripts/seed-50-buyers-requests.js
//   node scripts/seed-50-buyers-requests.js --dry
//   node scripts/seed-50-buyers-requests.js --reset
//
// --dry
//   Preview without inserting.
//
// --reset
//   Delete requests/users created by this script and recreate them.
//
// ============================================================

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ============================================================
// CONFIG
// ============================================================

const PREFIX = "demo.buyer.";

const DEMO_EMAIL_DOMAIN = "foodtradelink-demo.test";

const START_REQUEST_NUMBER = 900000;

const START_PROFILE_NUMBER = 900000;

const MIN_REQUESTS_PER_COMPANY = 1;
const MAX_REQUESTS_PER_COMPANY = 3;

// ============================================================
// 50 BUYER COMPANIES
// ============================================================
//
// These are intentionally fictional demo companies.
// They are realistic enough for marketplace testing,
// but use .test email/domain values.
//
// ============================================================

const BUYER_COMPANIES = [
  {
    name: "Meridian Harvest Trading",
    country: "United Arab Emirates",
    countryCode: "AE",
    city: "Dubai",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "51-100",
    contact: "Omar Khalid",
    title: "Procurement Director",
    phone: "+971 50 000 1001",
    address: "Jebel Ali Free Zone, Dubai",
    websiteSlug: "meridian-harvest",
    bio:
      "Meridian Harvest Trading is a Dubai-based food importing and distribution company focused on sourcing reliable agricultural and processed food products from established producers across the Middle East, Central Asia and South Asia. The company supplies wholesalers, hospitality groups and regional retailers and maintains long-term procurement relationships with qualified exporters."
  },
  {
    name: "Gulf Crest Food Industries",
    country: "Saudi Arabia",
    countryCode: "SA",
    city: "Riyadh",
    postalCode: "00000",
    businessType: "Food Manufacturer",
    employees: "101-250",
    contact: "Faisal Al Harbi",
    title: "International Sourcing Manager",
    phone: "+966 50 000 1002",
    address: "Industrial Area, Riyadh",
    websiteSlug: "gulf-crest-foods",
    bio:
      "Gulf Crest Food Industries operates a regional food manufacturing and sourcing business serving distributors, restaurants and institutional buyers throughout Saudi Arabia. Its procurement team regularly evaluates bulk ingredients, dried foods, spices, grains and premium agricultural products for recurring supply programs."
  },
  {
    name: "Anatolia Select Foods",
    country: "Turkey",
    countryCode: "TR",
    city: "Istanbul",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Emre Yilmaz",
    title: "Purchasing Manager",
    phone: "+90 530 000 1003",
    address: "Ikitelli Food Trade District, Istanbul",
    websiteSlug: "anatolia-select",
    bio:
      "Anatolia Select Foods sources specialty food ingredients for Turkish distributors, private-label manufacturers and foodservice companies. The company is particularly interested in consistent quality, competitive FOB and CIF pricing and suppliers capable of supporting repeat commercial shipments."
  },
  {
    name: "Pacific Rim Pantry",
    country: "Malaysia",
    countryCode: "MY",
    city: "Kuala Lumpur",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "51-100",
    contact: "Nur Aisyah Rahman",
    title: "Head of Procurement",
    phone: "+60 12 000 1004",
    address: "Port Klang Commercial Zone",
    websiteSlug: "pacific-rim-pantry",
    bio:
      "Pacific Rim Pantry supplies food manufacturers, modern retailers and hospitality operators across Malaysia and neighboring Southeast Asian markets. Its sourcing team works with international suppliers of dry ingredients, nuts, dried fruits, grains, spices and value-added food products."
  },
  {
    name: "Horizon Agro Imports",
    country: "India",
    countryCode: "IN",
    city: "Mumbai",
    postalCode: "00000",
    businessType: "Agro Food Importer",
    employees: "101-250",
    contact: "Arjun Mehta",
    title: "Import Procurement Lead",
    phone: "+91 98 0000 1005",
    address: "Navi Mumbai Trade Hub",
    websiteSlug: "horizon-agro-imports",
    bio:
      "Horizon Agro Imports connects international food producers with Indian wholesalers and processors. The company handles bulk sourcing programs and evaluates suppliers based on product specifications, export documentation, shipment reliability and the ability to maintain consistent quality across repeat orders."
  },
  {
    name: "Danube Food Partners",
    country: "Germany",
    countryCode: "DE",
    city: "Hamburg",
    postalCode: "00000",
    businessType: "Food Importer & Wholesaler",
    employees: "51-100",
    contact: "Lukas Schneider",
    title: "Sourcing Director",
    phone: "+49 170 000 1006",
    address: "Hamburg Food Logistics District",
    websiteSlug: "danube-food-partners",
    bio:
      "Danube Food Partners is an international food trading company serving European wholesalers and food manufacturers. Its procurement operation emphasizes traceability, documented quality standards, dependable logistics and competitive commercial terms for recurring imports."
  },
  {
    name: "North Sea Ingredients",
    country: "Netherlands",
    countryCode: "NL",
    city: "Rotterdam",
    postalCode: "00000",
    businessType: "Ingredient Distributor",
    employees: "51-100",
    contact: "Sophie de Vries",
    title: "Strategic Buyer",
    phone: "+31 6 0000 1007",
    address: "Rotterdam Food Logistics Park",
    websiteSlug: "north-sea-ingredients",
    bio:
      "North Sea Ingredients supplies food manufacturers and distributors across Western Europe with bulk agricultural and processed food ingredients. The company evaluates suppliers on specifications, certifications, packaging formats, shipment flexibility and long-term supply potential."
  },
  {
    name: "Britannia Food Sourcing",
    country: "United Kingdom",
    countryCode: "GB",
    city: "London",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Oliver Bennett",
    title: "Procurement Manager",
    phone: "+44 7700 000108",
    address: "London Food Trading District",
    websiteSlug: "britannia-food-sourcing",
    bio:
      "Britannia Food Sourcing supports UK wholesalers, foodservice companies and specialty retailers through international procurement programs. The company is interested in dependable exporters offering documented quality, practical packaging and stable supply for recurring orders."
  },
  {
    name: "Baltic Harvest Group",
    country: "Poland",
    countryCode: "PL",
    city: "Warsaw",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "51-100",
    contact: "Mateusz Kowalski",
    title: "Import Manager",
    phone: "+48 500 000 109",
    address: "Warsaw Food Distribution Center",
    websiteSlug: "baltic-harvest",
    bio:
      "Baltic Harvest Group distributes imported food products to wholesalers and food manufacturers across Central and Eastern Europe. Procurement decisions are based on quality consistency, export readiness, packaging specifications and the supplier's ability to support scheduled commercial volumes."
  },
  {
    name: "Doha Premium Foods",
    country: "Qatar",
    countryCode: "QA",
    city: "Doha",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "51-100",
    contact: "Khalid Al Mansoor",
    title: "Commercial Procurement Manager",
    phone: "+974 5000 0110",
    address: "Doha Logistics Zone",
    websiteSlug: "doha-premium-foods",
    bio:
      "Doha Premium Foods sources premium and mainstream food products for Qatar's retail, hospitality and foodservice sectors. The company regularly evaluates international suppliers for bulk ingredients, specialty foods, dried products and agricultural commodities."
  },
  {
    name: "Oman Valley Trading",
    country: "Oman",
    countryCode: "OM",
    city: "Muscat",
    postalCode: "00000",
    businessType: "Food Trading Company",
    employees: "11-50",
    contact: "Ahmed Al Balushi",
    title: "Purchasing Director",
    phone: "+968 9000 0111",
    address: "Rusayl Industrial Estate, Muscat",
    websiteSlug: "oman-valley-trading",
    bio:
      "Oman Valley Trading serves food wholesalers, hotels and regional retailers through a diversified international sourcing network. The company is interested in reliable exporters capable of meeting recurring shipment schedules and maintaining consistent product specifications."
  },
  {
    name: "Kuwait Pantry Group",
    country: "Kuwait",
    countryCode: "KW",
    city: "Kuwait City",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Yousef Al Sabah",
    title: "Head of Imports",
    phone: "+965 5000 0112",
    address: "Shuwaikh Food Trading Area",
    websiteSlug: "kuwait-pantry",
    bio:
      "Kuwait Pantry Group supplies supermarkets, catering companies and foodservice operators throughout Kuwait. Its procurement team focuses on bulk food commodities and specialty products with dependable export documentation and competitive landed costs."
  },
  {
    name: "Caspian Food Link",
    country: "Azerbaijan",
    countryCode: "AZ",
    city: "Baku",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "11-50",
    contact: "Rashad Mammadov",
    title: "International Purchasing Manager",
    phone: "+994 50 000 0113",
    address: "Baku International Trade Zone",
    websiteSlug: "caspian-food-link",
    bio:
      "Caspian Food Link imports food products for distributors, restaurants and retail chains in Azerbaijan. The company works with regional and international suppliers and looks for commercially competitive products that can support steady monthly procurement."
  },
  {
    name: "Steppe Harvest Trading",
    country: "Kazakhstan",
    countryCode: "KZ",
    city: "Almaty",
    postalCode: "00000",
    businessType: "Agri-Food Distributor",
    employees: "51-100",
    contact: "Ayan Sarsenov",
    title: "Sourcing Manager",
    phone: "+7 700 000 0114",
    address: "Almaty Wholesale Food Center",
    websiteSlug: "steppe-harvest",
    bio:
      "Steppe Harvest Trading supplies food processors and wholesalers throughout Kazakhstan and Central Asia. The company imports selected food ingredients and finished products and prioritizes suppliers with reliable export capacity and consistent quality."
  },
  {
    name: "Levant Gourmet Supply",
    country: "Jordan",
    countryCode: "JO",
    city: "Amman",
    postalCode: "00000",
    businessType: "Specialty Food Importer",
    employees: "11-50",
    contact: "Samer Haddad",
    title: "Managing Procurement Partner",
    phone: "+962 79 000 0115",
    address: "Amman Food Distribution District",
    websiteSlug: "levant-gourmet",
    bio:
      "Levant Gourmet Supply sources specialty ingredients and premium food products for Jordanian distributors, hotels and specialty retailers. The business places particular emphasis on product presentation, traceability and dependable supplier communication."
  },
  {
    name: "Mesopotamia Food Trade",
    country: "Iraq",
    countryCode: "IQ",
    city: "Baghdad",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Hassan Karim",
    title: "Import Purchasing Manager",
    phone: "+964 770 000 0116",
    address: "Baghdad International Market",
    websiteSlug: "mesopotamia-food-trade",
    bio:
      "Mesopotamia Food Trade imports food products for wholesalers, retailers and foodservice businesses across Iraq. Its sourcing team seeks competitive international suppliers with practical packaging, dependable logistics and flexible commercial terms."
  },
  {
    name: "Mediterranean Pantry Co.",
    country: "Greece",
    countryCode: "GR",
    city: "Athens",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "11-50",
    contact: "Nikos Papadopoulos",
    title: "Purchasing Lead",
    phone: "+30 690 000 0117",
    address: "Athens Food Trade Center",
    websiteSlug: "mediterranean-pantry",
    bio:
      "Mediterranean Pantry Co. distributes imported ingredients and specialty food products to Greek wholesalers, hospitality groups and retailers. The company actively develops new international supplier relationships for premium and mainstream food categories."
  },
  {
    name: "Iberia Global Foods",
    country: "Spain",
    countryCode: "ES",
    city: "Valencia",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Carlos Navarro",
    title: "International Buyer",
    phone: "+34 600 000 0118",
    address: "Valencia Port Food Zone",
    websiteSlug: "iberia-global-foods",
    bio:
      "Iberia Global Foods operates an international sourcing program serving food distributors and manufacturers in Spain. The company looks for suppliers offering strong quality control, export documentation and attractive terms for container-scale procurement."
  },
  {
    name: "Alpine Food Resources",
    country: "Austria",
    countryCode: "AT",
    city: "Vienna",
    postalCode: "00000",
    businessType: "Ingredient Importer",
    employees: "11-50",
    contact: "Anna Gruber",
    title: "Procurement Specialist",
    phone: "+43 660 000 0119",
    address: "Vienna International Trade Center",
    websiteSlug: "alpine-food-resources",
    bio:
      "Alpine Food Resources supplies food manufacturers and distributors across Austria and neighboring European markets. Procurement focuses on traceable agricultural products, specialty ingredients and packaged foods suitable for professional food production."
  },
  {
    name: "Nordic Taste Partners",
    country: "Sweden",
    countryCode: "SE",
    city: "Stockholm",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Erik Johansson",
    title: "Sourcing Manager",
    phone: "+46 70 000 0120",
    address: "Stockholm Food Logistics Center",
    websiteSlug: "nordic-taste",
    bio:
      "Nordic Taste Partners develops international supply channels for foodservice distributors and specialty retailers in Scandinavia. The company values consistent specifications, responsible packaging and reliable long-term supplier performance."
  },
  {
    name: "Crown Food Merchants",
    country: "France",
    countryCode: "FR",
    city: "Marseille",
    postalCode: "00000",
    businessType: "Food Trading Company",
    employees: "51-100",
    contact: "Julien Moreau",
    title: "Import Director",
    phone: "+33 6 00 00 0121",
    address: "Marseille Food Port",
    websiteSlug: "crown-food-merchants",
    bio:
      "Crown Food Merchants supplies French food distributors and processors through international sourcing programs. The company evaluates bulk food products, specialty ingredients and agricultural commodities based on commercial competitiveness and documentation quality."
  },
  {
    name: "Sakura Food Distribution",
    country: "Japan",
    countryCode: "JP",
    city: "Osaka",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "101-250",
    contact: "Kenji Nakamura",
    title: "Overseas Procurement Manager",
    phone: "+81 90 0000 0122",
    address: "Osaka Food Import District",
    websiteSlug: "sakura-food-distribution",
    bio:
      "Sakura Food Distribution imports selected agricultural products and food ingredients for Japanese wholesalers and manufacturers. Its sourcing team emphasizes product consistency, clear specifications, suitable packaging and dependable export documentation."
  },
  {
    name: "Seoul Harvest Partners",
    country: "South Korea",
    countryCode: "KR",
    city: "Seoul",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Min-Jae Park",
    title: "Global Procurement Manager",
    phone: "+82 10 0000 0123",
    address: "Seoul Food Distribution Center",
    websiteSlug: "seoul-harvest",
    bio:
      "Seoul Harvest Partners connects overseas food producers with Korean importers, processors and distributors. The company is interested in differentiated ingredients and reliable bulk suppliers capable of meeting detailed quality specifications."
  },
  {
    name: "Dragon Gate Food Trading",
    country: "China",
    countryCode: "CN",
    city: "Shanghai",
    postalCode: "00000",
    businessType: "Food Import & Distribution",
    employees: "251-500",
    contact: "Wei Zhang",
    title: "International Procurement Director",
    phone: "+86 138 0000 0124",
    address: "Shanghai International Food Market",
    websiteSlug: "dragon-gate-foods",
    bio:
      "Dragon Gate Food Trading manages international sourcing programs for Chinese food distributors and manufacturing partners. The company handles substantial commercial volumes and evaluates suppliers for quality, production capacity and export reliability."
  },
  {
    name: "Jakarta Food Network",
    country: "Indonesia",
    countryCode: "ID",
    city: "Jakarta",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "101-250",
    contact: "Budi Santoso",
    title: "Head of Imports",
    phone: "+62 811 0000 0125",
    address: "Jakarta International Food Hub",
    websiteSlug: "jakarta-food-network",
    bio:
      "Jakarta Food Network supplies Indonesian wholesalers, food manufacturers and hospitality groups. Its procurement team develops international supplier relationships for dry foods, agricultural products, spices, nuts and processed ingredients."
  },
  {
    name: "Manila Global Pantry",
    country: "Philippines",
    countryCode: "PH",
    city: "Manila",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Miguel Santos",
    title: "Procurement Head",
    phone: "+63 917 000 0126",
    address: "Manila Food Import Center",
    websiteSlug: "manila-global-pantry",
    bio:
      "Manila Global Pantry imports food ingredients and finished products for wholesalers and foodservice operators in the Philippines. The company seeks dependable suppliers with competitive pricing and flexible shipment options."
  },
  {
    name: "East Africa Food Link",
    country: "Kenya",
    countryCode: "KE",
    city: "Nairobi",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "51-100",
    contact: "Daniel Mwangi",
    title: "Commercial Sourcing Manager",
    phone: "+254 700 000 0127",
    address: "Nairobi Food Trade Center",
    websiteSlug: "east-africa-food-link",
    bio:
      "East Africa Food Link supplies food distributors and processors in Kenya and neighboring markets. The company sources international food products and ingredients and looks for suppliers capable of supporting regular commercial shipments."
  },
  {
    name: "Cape Harvest Imports",
    country: "South Africa",
    countryCode: "ZA",
    city: "Cape Town",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Liam Botha",
    title: "International Buyer",
    phone: "+27 82 000 0128",
    address: "Cape Town Food Logistics Park",
    websiteSlug: "cape-harvest-imports",
    bio:
      "Cape Harvest Imports serves South African wholesalers, retailers and food manufacturers through a diversified international sourcing network. The business evaluates bulk agricultural products, ingredients and specialty food items."
  },
  {
    name: "Casablanca Food Exchange",
    country: "Morocco",
    countryCode: "MA",
    city: "Casablanca",
    postalCode: "00000",
    businessType: "Food Trading Company",
    employees: "11-50",
    contact: "Youssef El Amrani",
    title: "Purchasing Director",
    phone: "+212 600 000 0129",
    address: "Casablanca Food Trade District",
    websiteSlug: "casablanca-food-exchange",
    bio:
      "Casablanca Food Exchange sources food products for Moroccan distributors and processors. The company is expanding its international supplier base and evaluates exporters based on commercial terms, documentation and consistency of supply."
  },
  {
    name: "Cairo Food Resources",
    country: "Egypt",
    countryCode: "EG",
    city: "Cairo",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "101-250",
    contact: "Mahmoud Hassan",
    title: "Import Procurement Director",
    phone: "+20 100 000 0130",
    address: "Cairo Food Trading Zone",
    websiteSlug: "cairo-food-resources",
    bio:
      "Cairo Food Resources manages international procurement for Egyptian distributors and food manufacturers. The company handles recurring bulk purchases and seeks exporters with scalable production, dependable shipment schedules and clear product documentation."
  },
  {
    name: "Beirut Specialty Foods",
    country: "Lebanon",
    countryCode: "LB",
    city: "Beirut",
    postalCode: "00000",
    businessType: "Specialty Food Distributor",
    employees: "11-50",
    contact: "Karim Nassar",
    title: "Purchasing Manager",
    phone: "+961 70 000 0131",
    address: "Beirut Wholesale Food Market",
    websiteSlug: "beirut-specialty-foods",
    bio:
      "Beirut Specialty Foods distributes premium and specialty food products to Lebanese retailers, restaurants and hospitality groups. The company looks for differentiated products with strong quality credentials and attractive commercial potential."
  },
  {
    name: "Tbilisi Food Partners",
    country: "Georgia",
    countryCode: "GE",
    city: "Tbilisi",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Giorgi Beridze",
    title: "International Sourcing Manager",
    phone: "+995 555 000 0132",
    address: "Tbilisi Food Distribution Center",
    websiteSlug: "tbilisi-food-partners",
    bio:
      "Tbilisi Food Partners develops import channels for Georgian wholesalers, foodservice companies and retailers. Its purchasing team is interested in reliable regional and international suppliers with competitive pricing and flexible delivery options."
  },
  {
    name: "Balkan Food Supply",
    country: "Serbia",
    countryCode: "RS",
    city: "Belgrade",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "51-100",
    contact: "Marko Jovanovic",
    title: "Head of Purchasing",
    phone: "+381 60 000 0133",
    address: "Belgrade Wholesale Market",
    websiteSlug: "balkan-food-supply",
    bio:
      "Balkan Food Supply serves wholesalers and food manufacturers throughout the Western Balkans. The company sources bulk agricultural products, ingredients and packaged foods from international producers."
  },
  {
    name: "Prague Food Connect",
    country: "Czech Republic",
    countryCode: "CZ",
    city: "Prague",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Jan Novak",
    title: "Sourcing Specialist",
    phone: "+420 700 000 0134",
    address: "Prague Food Trade Center",
    websiteSlug: "prague-food-connect",
    bio:
      "Prague Food Connect supplies Central European food businesses with imported ingredients and specialty products. The company values reliable documentation, predictable lead times and stable product specifications."
  },
  {
    name: "Bucharest Agro Foods",
    country: "Romania",
    countryCode: "RO",
    city: "Bucharest",
    postalCode: "00000",
    businessType: "Agri-Food Importer",
    employees: "51-100",
    contact: "Andrei Popescu",
    title: "Procurement Director",
    phone: "+40 720 000 0135",
    address: "Bucharest Agricultural Trade Center",
    websiteSlug: "bucharest-agro-foods",
    bio:
      "Bucharest Agro Foods works with wholesalers and processors across Romania and Eastern Europe. Its sourcing team evaluates bulk agricultural products and food ingredients based on price, quality, documentation and shipment reliability."
  },
  {
    name: "Helsinki Food Market",
    country: "Finland",
    countryCode: "FI",
    city: "Helsinki",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Mika Korhonen",
    title: "Import Manager",
    phone: "+358 40 000 0136",
    address: "Helsinki Food Logistics Center",
    websiteSlug: "helsinki-food-market",
    bio:
      "Helsinki Food Market develops international sourcing channels for Nordic food distributors and specialty retailers. The company focuses on traceable products, consistent quality and dependable logistics."
  },
  {
    name: "Lisbon Global Pantry",
    country: "Portugal",
    countryCode: "PT",
    city: "Lisbon",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "11-50",
    contact: "Tiago Silva",
    title: "Procurement Manager",
    phone: "+351 910 000 0137",
    address: "Lisbon Food Import Center",
    websiteSlug: "lisbon-global-pantry",
    bio:
      "Lisbon Global Pantry supplies foodservice and retail customers with imported food products from Europe, Asia and the Middle East. The company actively searches for reliable producers with export-ready packaging."
  },
  {
    name: "Dublin Food Merchants",
    country: "Ireland",
    countryCode: "IE",
    city: "Dublin",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Sean Murphy",
    title: "Commercial Buyer",
    phone: "+353 85 000 0138",
    address: "Dublin Food Logistics Park",
    websiteSlug: "dublin-food-merchants",
    bio:
      "Dublin Food Merchants sources food ingredients and specialty products for Irish wholesalers and foodservice companies. The company prefers suppliers capable of maintaining consistent specifications and delivery schedules."
  },
  {
    name: "Toronto Global Ingredients",
    country: "Canada",
    countryCode: "CA",
    city: "Toronto",
    postalCode: "00000",
    businessType: "Ingredient Importer",
    employees: "101-250",
    contact: "Ethan Wilson",
    title: "Global Sourcing Director",
    phone: "+1 416 000 0139",
    address: "Toronto Food Distribution Hub",
    websiteSlug: "toronto-global-ingredients",
    bio:
      "Toronto Global Ingredients supplies food manufacturers and distributors across Canada with international ingredients and agricultural products. Procurement programs emphasize certification, traceability, stable supply and competitive pricing."
  },
  {
    name: "New York Food Exchange",
    country: "United States",
    countryCode: "US",
    city: "New York",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "101-250",
    contact: "Michael Carter",
    title: "Director of International Procurement",
    phone: "+1 212 000 0140",
    address: "New York Food Trade Center",
    websiteSlug: "new-york-food-exchange",
    bio:
      "New York Food Exchange manages international sourcing for distributors, specialty retailers and foodservice operators in the United States. The company seeks scalable suppliers for both commodity and premium food categories."
  },
  {
    name: "Mexico Food Gateway",
    country: "Mexico",
    countryCode: "MX",
    city: "Mexico City",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Carlos Ramirez",
    title: "Import Purchasing Manager",
    phone: "+52 55 0000 0141",
    address: "Mexico City Food Distribution Center",
    websiteSlug: "mexico-food-gateway",
    bio:
      "Mexico Food Gateway develops international procurement programs for Mexican distributors and food processors. The company looks for suppliers that can provide consistent bulk volumes and clear export documentation."
  },
  {
    name: "Santiago Food Partners",
    country: "Chile",
    countryCode: "CL",
    city: "Santiago",
    postalCode: "00000",
    businessType: "Food Trading Company",
    employees: "11-50",
    contact: "Diego Morales",
    title: "Purchasing Director",
    phone: "+56 9 0000 0142",
    address: "Santiago Food Trade Center",
    websiteSlug: "santiago-food-partners",
    bio:
      "Santiago Food Partners imports selected ingredients and food products for wholesalers and food manufacturers in Chile. Its procurement team is focused on long-term supplier relationships and dependable commercial execution."
  },
  {
    name: "Sao Paulo Food Link",
    country: "Brazil",
    countryCode: "BR",
    city: "Sao Paulo",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "101-250",
    contact: "Rafael Oliveira",
    title: "International Buyer",
    phone: "+55 11 0000 0143",
    address: "Sao Paulo Food Logistics District",
    websiteSlug: "sao-paulo-food-link",
    bio:
      "Sao Paulo Food Link supplies Brazilian distributors and processors through international sourcing partnerships. The company handles bulk food procurement and evaluates suppliers for quality, capacity and shipment reliability."
  },
  {
    name: "Buenos Aires Food Traders",
    country: "Argentina",
    countryCode: "AR",
    city: "Buenos Aires",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "51-100",
    contact: "Martin Fernandez",
    title: "Procurement Manager",
    phone: "+54 11 0000 0144",
    address: "Buenos Aires Food Market",
    websiteSlug: "buenos-aires-food-traders",
    bio:
      "Buenos Aires Food Traders sources imported ingredients and specialty food products for Argentine distributors and manufacturers. The company is particularly interested in reliable bulk suppliers with competitive landed costs."
  },
  {
    name: "Lima Food Resources",
    country: "Peru",
    countryCode: "PE",
    city: "Lima",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "11-50",
    contact: "Luis Torres",
    title: "Sourcing Manager",
    phone: "+51 900 000 0145",
    address: "Lima Food Import Center",
    websiteSlug: "lima-food-resources",
    bio:
      "Lima Food Resources supplies foodservice companies and distributors in Peru. Its international purchasing program covers dry foods, spices, agricultural ingredients and specialty products."
  },
  {
    name: "Nairobi Specialty Foods",
    country: "Kenya",
    countryCode: "KE",
    city: "Nairobi",
    postalCode: "00000",
    businessType: "Specialty Food Importer",
    employees: "11-50",
    contact: "Grace Wanjiku",
    title: "Procurement Manager",
    phone: "+254 711 000 0146",
    address: "Nairobi Specialty Food Market",
    websiteSlug: "nairobi-specialty-foods",
    bio:
      "Nairobi Specialty Foods imports premium and specialty products for hotels, restaurants, retailers and food distributors. The company seeks distinctive products backed by reliable quality documentation."
  },
  {
    name: "Accra Food Supply House",
    country: "Ghana",
    countryCode: "GH",
    city: "Accra",
    postalCode: "00000",
    businessType: "Food Distributor",
    employees: "51-100",
    contact: "Kwame Mensah",
    title: "Head of Procurement",
    phone: "+233 24 000 0147",
    address: "Accra Food Trading Center",
    websiteSlug: "accra-food-supply",
    bio:
      "Accra Food Supply House distributes imported ingredients and packaged foods to wholesalers and foodservice businesses in Ghana. Its purchasing team seeks practical packaging, competitive pricing and reliable delivery."
  },
  {
    name: "Lagos Global Foods",
    country: "Nigeria",
    countryCode: "NG",
    city: "Lagos",
    postalCode: "00000",
    businessType: "Food Importer",
    employees: "101-250",
    contact: "Chinedu Okafor",
    title: "International Procurement Manager",
    phone: "+234 803 000 0148",
    address: "Lagos International Food Market",
    websiteSlug: "lagos-global-foods",
    bio:
      "Lagos Global Foods manages food imports for distributors, retailers and manufacturing customers in Nigeria. The company seeks scalable international suppliers with competitive commercial terms and dependable shipment performance."
  },
  {
    name: "Kigali Food Connect",
    country: "Rwanda",
    countryCode: "RW",
    city: "Kigali",
    postalCode: "00000",
    businessType: "Food Trading Company",
    employees: "11-50",
    contact: "Eric Ndayisenga",
    title: "Purchasing Manager",
    phone: "+250 788 000 0149",
    address: "Kigali Food Trade Zone",
    websiteSlug: "kigali-food-connect",
    bio:
      "Kigali Food Connect develops supply relationships between international food producers and Rwandan distributors. The company is interested in dependable products that can be imported on a recurring basis."
  },
  {
    name: "Dar es Salaam Food Link",
    country: "Tanzania",
    countryCode: "TZ",
    city: "Dar es Salaam",
    postalCode: "00000",
    businessType: "Food Importer & Distributor",
    employees: "51-100",
    contact: "Joseph Mushi",
    title: "Import Manager",
    phone: "+255 710 000 0150",
    address: "Dar es Salaam Port Food District",
    websiteSlug: "dar-food-link",
    bio:
      "Dar es Salaam Food Link supplies wholesalers, retailers and hospitality businesses across Tanzania. The company is expanding its international supplier network and seeks competitive bulk food products with dependable shipping options."
  }
];

// ============================================================
// REQUEST PROFILE TEMPLATES
// ============================================================
//
// These profiles determine how requests differ from each other.
// The actual category/product is taken from the database.
//
// ============================================================

const REQUEST_PROFILES = [
  {
    style: "bulk-import",
    quantityMultiplier: 18,
    leadDays: 35,
    paymentTerms: "30% advance, 70% against shipping documents",
    shippingTerms: "CIF",
    packaging: [
      "20 kg food-grade cartons",
      "25 kg laminated polypropylene bags",
      "10 kg export cartons"
    ],
    certifications: [
      "HACCP, ISO 22000, Certificate of Origin",
      "ISO 22000, HACCP, Health Certificate",
      "GFSI-recognized food safety certification preferred"
    ]
  },
  {
    style: "container-program",
    quantityMultiplier: 35,
    leadDays: 50,
    paymentTerms: "Irrevocable L/C at sight",
    shippingTerms: "FOB",
    packaging: [
      "25 kg export-grade bags",
      "20 kg cartons on fumigated pallets",
      "Standard export cartons with palletization"
    ],
    certifications: [
      "ISO 22000, HACCP, Phytosanitary Certificate",
      "HACCP and relevant export health documentation",
      "ISO 9001, HACCP, Certificate of Analysis"
    ]
  },
  {
    style: "premium",
    quantityMultiplier: 8,
    leadDays: 25,
    paymentTerms: "50% advance, balance before dispatch",
    shippingTerms: "CIF",
    packaging: [
      "Vacuum-sealed food-grade packs in export cartons",
      "Premium retail-ready cartons",
      "1 kg inner packs inside 10 kg export cartons"
    ],
    certifications: [
      "HACCP, ISO 22000, Certificate of Analysis",
      "ISO 22000 and laboratory quality report",
      "Food safety certification and Certificate of Origin"
    ]
  },
  {
    style: "foodservice",
    quantityMultiplier: 12,
    leadDays: 28,
    paymentTerms: "T/T 30/70",
    shippingTerms: "CFR",
    packaging: [
      "10 kg foodservice cartons",
      "20 kg commercial cartons",
      "25 kg foodservice bags"
    ],
    certifications: [
      "HACCP preferred",
      "ISO 22000 preferred",
      "Certificate of Analysis required"
    ]
  },
  {
    style: "trial-order",
    quantityMultiplier: 4,
    leadDays: 20,
    paymentTerms: "100% T/T against proforma invoice",
    shippingTerms: "EXW",
    packaging: [
      "Standard export packaging",
      "Small commercial cartons suitable for trial shipment",
      "Food-grade bags with carton overpack"
    ],
    certifications: [
      "Certificate of Analysis",
      "Certificate of Origin",
      "Basic food safety documentation"
    ]
  },
  {
    style: "recurring",
    quantityMultiplier: 22,
    leadDays: 40,
    paymentTerms: "T/T 30/70 with quarterly supply agreement",
    shippingTerms: "CIF",
    packaging: [
      "25 kg export bags on pallets",
      "20 kg cartons with palletization",
      "Standard export packaging suitable for recurring shipments"
    ],
    certifications: [
      "HACCP, ISO 22000",
      "ISO 22000, Certificate of Analysis",
      "HACCP, Certificate of Origin and laboratory report"
    ]
  }
];

// ============================================================
// HELPERS
// ============================================================

function slugify(text) {
  return text
    .toString()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick(array, index) {
  return array[index % array.length];
}

function randomBetween(min, max, seed = Math.random()) {
  return Math.floor(min + seed * (max - min + 1));
}

function roundTo(value, step = 50) {
  return Math.round(value / step) * step;
}

function formatMoney(value) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2
  });
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeCompanyEmail(index) {
  return `${PREFIX}${String(index + 1).padStart(2, "0")}@${DEMO_EMAIL_DOMAIN}`;
}

function makeRequestTitle(product, company, profile) {
  const styles = {
    "bulk-import": "Bulk Import Requirement",
    "container-program": "Container Supply Requirement",
    premium: "Premium Grade Sourcing Request",
    foodservice: "Foodservice Supply Requirement",
    "trial-order": "Trial Commercial Order",
    recurring: "Recurring Supply Program"
  };

  return `${product.name} – ${styles[profile.style]}`;
}

function makeDescription({
  company,
  product,
  profile,
  quantity,
  unit,
  destination,
  packaging,
  certifications,
  targetPrice
}) {
  const styleText = {
    "bulk-import":
      "We are looking for an established exporter capable of handling a commercial bulk shipment with consistent quality from batch to batch.",
    "container-program":
      "We are evaluating suppliers for a larger container-based purchasing program and prefer producers with demonstrated export capacity.",
    premium:
      "Our current requirement is focused on premium-grade material with strong traceability, documented quality and professional export presentation.",
    foodservice:
      "The product will be supplied to foodservice and professional buyers, so consistency, practical packaging and reliable delivery are important.",
    "trial-order":
      "We would like to begin with a commercially meaningful trial order before discussing a longer-term purchasing agreement.",
    recurring:
      "This is intended to become a recurring procurement program if the first shipments meet our quality, pricing and delivery expectations."
  };

  return [
    styleText[profile.style],
    `Our company is currently seeking approximately ${quantity.toLocaleString()} ${unit} of ${product.name}.`,
    `Preferred delivery destination is ${destination}.`,
    `Our indicative target price is around ${formatMoney(targetPrice)} USD per ${unit}, although competitive offers will be considered.`,
    `Preferred packaging: ${packaging}.`,
    `Required documentation/certification: ${certifications}.`,
    "Suppliers should provide product specifications, available monthly capacity, current export markets, production lead time and recent quality documentation.",
    `Commercial preference: ${profile.shippingTerms} with ${profile.paymentTerms}.`,
    "Please include your best export quotation, MOQ, lead time and available shipment schedule."
  ].join(" ");
}

function makeSearchText(request) {
  return [
    request.title,
    request.category,
    request.subCategory,
    request.productType,
    request.categoryPath,
    request.description,
    request.deliveryCountry,
    request.packagingReq,
    request.certifications,
    request.shippingTerms,
    request.paymentTerms
  ]
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// GET NEXT NUMBERS
// ============================================================

async function getNextProfileNumber() {
  const last = await prisma.user.findFirst({
    orderBy: {
      profileNumber: "desc"
    },
    select: {
      profileNumber: true
    }
  });

  return Math.max(
    START_PROFILE_NUMBER,
    (last?.profileNumber || 0) + 1
  );
}

async function getNextRequestNumber() {
  const last = await prisma.buyingRequest.findFirst({
    orderBy: {
      requestNumber: "desc"
    },
    select: {
      requestNumber: true
    }
  });

  return Math.max(
    START_REQUEST_NUMBER,
    (last?.requestNumber || 0) + 1
  );
}

// ============================================================
// FIND PRODUCTS / CATEGORIES
// ============================================================

async function loadProducts() {
  const products = await prisma.product.findMany({
    where: {
      isVisible: true
    },
    select: {
      id: true,
      name: true,
      category: true,
      subCategory: true,
      productType: true,
      categoryPath: true,
      price: true,
      currency: true,
      unit: true,
      moq: true,
      country: true
    },
    orderBy: {
      id: "asc"
    }
  });

  return products;
}

// ============================================================
// GROUP PRODUCTS BY CATEGORY
// ============================================================

function groupProducts(products) {
  const groups = new Map();

  for (const product of products) {
    const key = product.categoryPath || product.category;

    if (!key) continue;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(product);
  }

  return [...groups.values()];
}

// ============================================================
// CREATE COMPANY
// ============================================================

async function createBuyerCompany({
  company,
  index,
  profileNumber
}) {
  const email = makeCompanyEmail(index);

  const slug =
    `${slugify(company.name)}-demo-${String(index + 1).padStart(2, "0")}`;

  const data = {
    profileNumber,
    slug,
    name: company.contact,
    email,
    password: null,
    role: "BUYER",
    plan: "FREE",

    companyName: company.name,
    country: company.country,
    city: company.city,
    postalCode: company.postalCode,
    countryCode: company.countryCode,
    businessType: company.businessType,
    phone: company.phone,
    bio: company.bio,
    address: company.address,

    website: `https://${company.websiteSlug}.foodtradelink-demo.test`,
    companyEmail: `procurement@${company.websiteSlug}.foodtradelink-demo.test`,

    employeeCount: company.employees,

    socialLinks: {
      linkedin: `https://linkedin.com/company/${company.websiteSlug}`,
      tradeRole: "Buyer",
      contactPerson: company.contact,
      jobTitle: company.title
    },

    registrationComplete: true,

    galleryImages: [],

    primaryCategory: null,
    primarySubCategory: null
  };

  const existing = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: {
        id: existing.id
      },
      data: {
        ...data,
        profileNumber: existing.profileNumber
      }
    });

    return updated;
  }

  return prisma.user.create({
    data
  });
}

// ============================================================
// BUILD REQUEST
// ============================================================

function buildRequest({
  company,
  companyIndex,
  requestIndex,
  product,
  profile,
  requestNumber
}) {
  const baseMoq =
    Number(product.moq) > 0
      ? Number(product.moq)
      : 1000;

  const quantity = Math.max(
    baseMoq,
    roundTo(
      baseMoq * profile.quantityMultiplier +
        companyIndex * 37 +
        requestIndex * 113,
      50
    )
  );

  const unit = product.unit || "kg";

  const destination = `${company.city}, ${company.country}`;

  const packaging = pick(
    profile.packaging,
    companyIndex + requestIndex
  );

  const certifications = pick(
    profile.certifications,
    companyIndex + requestIndex
  );

  const basePrice =
    Number(product.price) > 0
      ? Number(product.price)
      : 10;

  // Buyer target price is intentionally below the supplier's
  // current displayed price, but still commercially realistic.
  const discount =
    0.82 +
    ((companyIndex + requestIndex) % 9) * 0.015;

  const targetPrice = Number(
    (basePrice * discount).toFixed(2)
  );

  const lowerBudget = roundTo(
    targetPrice * 0.95,
    10
  );

  const upperBudget = roundTo(
    targetPrice * 1.12,
    10
  );

  const deadline = new Date();

  deadline.setDate(
    deadline.getDate() +
      profile.leadDays +
      ((companyIndex * 3 + requestIndex * 5) % 21)
  );

  const supplierCountryPool = [
    "Iran",
    "Türkiye",
    "India",
    "United Arab Emirates",
    "Saudi Arabia",
    "Egypt",
    "Pakistan",
    "Vietnam",
    "Thailand",
    "China"
  ];

  // Rotate preferred supplier origins so requests differ.
  const supplierCountries = [
    pick(supplierCountryPool, companyIndex + requestIndex),
    pick(supplierCountryPool, companyIndex + requestIndex + 3),
    pick(supplierCountryPool, companyIndex + requestIndex + 6)
  ].filter(
    (country, index, array) =>
      array.indexOf(country) === index
  );

  const title = makeRequestTitle(
    product,
    company,
    profile
  );

  const description = makeDescription({
    company,
    product,
    profile,
    quantity,
    unit,
    destination,
    packaging,
    certifications,
    targetPrice
  });

  const request = {
    requestNumber,
    slug:
      `${slugify(title)}-${requestNumber}`,

    title,

    category: product.category,
    subCategory: product.subCategory || null,
    productType: product.productType || null,
    categoryPath: product.categoryPath || null,

    description,

    quantity,
    unit,

    budgetRange:
      `${formatMoney(lowerBudget)} - ${formatMoney(upperBudget)} USD / ${unit}`,

    currency: "USD",

    deadline,

    shippingTerms: profile.shippingTerms,

    deliveryCountry: company.country,

    packagingReq: packaging,

    certifications,

    attachments: [],

    isUrgent:
      profile.style === "trial-order"
        ? false
        : (companyIndex + requestIndex) % 7 === 0,

    isVisible: true,

    buyerCountry: company.country,

    paymentTerms: profile.paymentTerms,

    targetPrice,

    isPriceNegotiable:
      (companyIndex + requestIndex) % 5 !== 0,

    supplierCountries,

    status: "APPROVED",

    rejectionNote: null,

    approvedAt: new Date(),

    approvedBy: null,

    views:
      15 +
      ((companyIndex * 17 + requestIndex * 31) % 480),

    searchText: null
  };

  request.searchText = makeSearchText(request);

  return request;
}

// ============================================================
// HOW MANY REQUESTS PER COMPANY?
// ============================================================
//
// Deterministic distribution:
// 17 companies -> 1 request
// 17 companies -> 2 requests
// 16 companies -> 3 requests
//
// Total = 99 requests
//
// ============================================================

function getRequestCount(companyIndex) {
  const mod = companyIndex % 3;

  if (mod === 0) return 1;
  if (mod === 1) return 2;

  return 3;
}

// ============================================================
// RESET
// ============================================================

async function resetDemoData() {
  console.log("\n🧹 Removing existing demo buyer requests...\n");

  const emails = BUYER_COMPANIES.map((_, index) =>
    makeCompanyEmail(index)
  );

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: emails
      }
    },
    select: {
      id: true,
      email: true
    }
  });

  let deletedRequests = 0;

  for (const user of users) {
    const result =
      await prisma.buyingRequest.deleteMany({
        where: {
          userId: user.id
        }
      });

    deletedRequests += result.count;
  }

  console.log(
    `Deleted ${deletedRequests} existing demo requests.`
  );

  // We intentionally DO NOT delete the User records.
  //
  // This prevents accidental deletion of related data
  // such as messages, saved profiles, subscriptions, etc.
  //
  // The users will simply be reused on the next seed.
}

// ============================================================
// DRY RUN
// ============================================================

async function dryRun(products) {
  console.log("\n============================================");
  console.log("DRY RUN");
  console.log("============================================\n");

  const groups = groupProducts(products);

  console.log(`Products available: ${products.length}`);
  console.log(`Category groups available: ${groups.length}`);
  console.log(
    `Buyer companies to create/update: ${BUYER_COMPANIES.length}`
  );

  let totalRequests = 0;

  for (let i = 0; i < BUYER_COMPANIES.length; i++) {
    const company = BUYER_COMPANIES[i];

    const requestCount = getRequestCount(i);

    totalRequests += requestCount;

    console.log(
      `${String(i + 1).padStart(2, "0")}. ` +
        `${company.name} (${company.country}) -> ` +
        `${requestCount} request(s)`
    );

    for (let r = 0; r < requestCount; r++) {
      const group =
        groups[(i * 2 + r) % groups.length];

      const product =
        group[(i + r) % group.length];

      const profile =
        REQUEST_PROFILES[
          (i + r) % REQUEST_PROFILES.length
        ];

      console.log(
        `    • ${product.name} | ` +
          `${product.category}` +
          (product.subCategory
            ? ` / ${product.subCategory}`
            : "") +
          ` | ${profile.style}`
      );
    }
  }

  console.log(
    `\nTotal requests that will be generated: ${totalRequests}`
  );
}

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  const args = process.argv.slice(2);

  const isDryRun = args.includes("--dry");
  const shouldReset = args.includes("--reset");

  console.log("\n");
  console.log("============================================");
  console.log(" FoodTradeLink Buyer Request Seeder");
  console.log("============================================");
  console.log("");

  // ----------------------------------------------------------
  // Load existing products
  // ----------------------------------------------------------

  const products = await loadProducts();

  if (!products.length) {
    throw new Error(
      "No visible products were found in the database. " +
      "Create/seed products first."
    );
  }

  console.log(
    `📦 Found ${products.length} visible products.`
  );

  const categoryGroups = groupProducts(products);

  if (!categoryGroups.length) {
    throw new Error(
      "Products exist, but no usable category/categoryPath was found."
    );
  }

  console.log(
    `🗂️ Found ${categoryGroups.length} category groups.`
  );

  // ----------------------------------------------------------
  // Dry run
  // ----------------------------------------------------------

  if (isDryRun) {
    await dryRun(products);
    return;
  }

  // ----------------------------------------------------------
  // Reset
  // ----------------------------------------------------------

  if (shouldReset) {
    await resetDemoData();
  }

  // ----------------------------------------------------------
  // Get starting numbers
  // ----------------------------------------------------------

  let nextProfileNumber =
    await getNextProfileNumber();

  let nextRequestNumber =
    await getNextRequestNumber();

  // ----------------------------------------------------------
  // Create companies
  // ----------------------------------------------------------

  let createdCompanies = 0;
  let updatedCompanies = 0;
  let createdRequests = 0;

  console.log("\n🏢 Creating buyer companies...\n");

  for (
    let companyIndex = 0;
    companyIndex < BUYER_COMPANIES.length;
    companyIndex++
  ) {
    const company =
      BUYER_COMPANIES[companyIndex];

    const email =
      makeCompanyEmail(companyIndex);

    const existing =
      await prisma.user.findUnique({
        where: {
          email
        },
        select: {
          id: true,
          profileNumber: true
        }
      });

    const buyer =
      await createBuyerCompany({
        company,
        index: companyIndex,
        profileNumber:
          existing?.profileNumber ||
          nextProfileNumber++
      });

    if (existing) {
      updatedCompanies++;
    } else {
      createdCompanies++;
    }

    console.log(
      `✓ ${String(companyIndex + 1).padStart(2, "0")}/50 ` +
        `${company.name} — ${company.country}`
    );

    // --------------------------------------------------------
    // Create 1-3 requests
    // --------------------------------------------------------

    const requestCount =
      getRequestCount(companyIndex);

    for (
      let requestIndex = 0;
      requestIndex < requestCount;
      requestIndex++
    ) {
      // Select a category group based on company + request.
      // This ensures different companies don't all receive
      // the same category.
      const group =
        categoryGroups[
          (companyIndex * 2 + requestIndex) %
            categoryGroups.length
        ];

      if (!group || !group.length) {
        continue;
      }

      // Select an actual product from that category.
      const product =
        group[
          (companyIndex + requestIndex * 2) %
            group.length
        ];

      const profile =
        REQUEST_PROFILES[
          (companyIndex + requestIndex) %
            REQUEST_PROFILES.length
        ];

      const request =
        buildRequest({
          company,
          companyIndex,
          requestIndex,
          product,
          profile,
          requestNumber: nextRequestNumber++
        });

      await prisma.buyingRequest.create({
        data: {
          ...request,
          userId: buyer.id
        }
      });

      createdRequests++;

      console.log(
        `   ↳ Request #${request.requestNumber}: ` +
          `${product.name} ` +
          `[${product.category}]`
      );
    }
  }

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------

  console.log("\n");
  console.log("============================================");
  console.log(" SEED COMPLETED");
  console.log("============================================");
  console.log("");

  console.log(
    `Companies created : ${createdCompanies}`
  );

  console.log(
    `Companies updated : ${updatedCompanies}`
  );

  console.log(
    `Requests created  : ${createdRequests}`
  );

  console.log(
    `Products used     : ${products.length}`
  );

  console.log(
    `Categories used   : ${categoryGroups.length}`
  );

  console.log("");
  console.log(
    "All demo buyer accounts use the pattern:"
  );

  console.log(
    `  ${PREFIX}01@${DEMO_EMAIL_DOMAIN}`
  );

  console.log("");
}

// ============================================================
// ERROR HANDLING
// ============================================================

main()
  .catch((error) => {
    console.error("\n❌ SEED FAILED\n");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

