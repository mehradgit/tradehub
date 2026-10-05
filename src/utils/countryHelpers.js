// src/utils/countryHelpers.js
const countryNameToCode = {
  "United States": "us",
  "United Kingdom": "gb",
  "Germany": "de",
  "France": "fr",
  "Canada": "ca",
  "Australia": "au",
  "Iran": "ir",
  "Turkey": "tr",
  "UAE": "ae",
  "India": "in",
  "China": "cn",
  "Japan": "jp",
  "Brazil": "br",
  "Mexico": "mx",
  "Spain": "es",
  "Italy": "it",
  "Netherlands": "nl",
  "Poland": "pl",
  "Kenya": "ke",
  "New Zealand": "nz",
  "South Korea": "kr",
  "Singapore": "sg",
  "Malaysia": "my",
  "Thailand": "th",
  "Vietnam": "vn",
  "Russia": "ru",
  "South Africa": "za",
  "Egypt": "eg",
  "Saudi Arabia": "sa",
};

export function getCountryCode(countryName) {
  if (!countryName) return null;
  // If it is already a two-letter code
  if (countryName.length === 2 && /^[A-Za-z]{2}$/.test(countryName)) {
    return countryName.toLowerCase();
  }
  return countryNameToCode[countryName] || null;
}