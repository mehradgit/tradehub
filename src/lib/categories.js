// src/lib/categories.js

export const categories = [
  // ====== دسته‌های اصلی (parent = 0) ======
  { id: 1, name: 'Protein', parent: 0 },
  { id: 2, name: 'Legumes, Grains, and Other Foods', parent: 0 },
  { id: 3, name: 'Dairy and Breakfast', parent: 0 },
  { id: 4, name: 'Frozen Foods', parent: 0 },
  { id: 5, name: 'Condiments', parent: 0 },
  { id: 6, name: 'Canned and Ready-Made Food', parent: 0 },
  { id: 7, name: 'Sweets and Snacks', parent: 0 },

  // ====== زیردسته‌های Protein (parent = 1) ======
  { id: 8, name: 'Eggs', parent: 1 },
  { id: 9, name: 'Mushrooms', parent: 1 },
  { id: 10, name: 'Sprouts', parent: 1 },
  { id: 11, name: 'Meat', parent: 1 },
  { id: 12, name: 'Chicken', parent: 1 },
  { id: 13, name: 'Fish', parent: 1 },
  { id: 14, name: 'Shrimp', parent: 1 },
  { id: 15, name: 'Caviar', parent: 1 },
  { id: 16, name: 'Sausage', parent: 1 },
  { id: 19, name: 'Hot Dog', parent: 1 },
  { id: 20, name: 'Hamburger', parent: 1 },
  { id: 21, name: 'Nuggets', parent: 1 },
  { id: 22, name: 'Other Meat and Poultry Products', parent: 1 },

  // ====== زیردسته‌های Legumes, Grains, and Other Foods (parent = 2) ======
  { id: 23, name: 'Rice', parent: 2 },
  { id: 24, name: 'Legumes', parent: 2 },
  { id: 25, name: 'Pasta', parent: 2 },
  { id: 26, name: 'Lasagna', parent: 2 },
  { id: 27, name: 'Sugar', parent: 2 },
  { id: 28, name: 'Candy', parent: 2 },
  { id: 29, name: 'Dates', parent: 2 },
  { id: 30, name: 'Flour', parent: 2 },
  { id: 31, name: 'Powder', parent: 2 },
  { id: 32, name: 'Dough', parent: 2 },
  { id: 33, name: 'Various Breads', parent: 2 },
  { id: 34, name: 'Oil', parent: 2 },

  // ====== زیردسته‌های Dairy and Breakfast (parent = 3) ======
  { id: 35, name: 'Milk', parent: 3 },
  { id: 36, name: 'Cheese', parent: 3 },
  { id: 37, name: 'Butter', parent: 3 },
  { id: 38, name: 'Yogurt', parent: 3 },
  { id: 39, name: 'Cream', parent: 3 },
  { id: 40, name: 'Buttermilk', parent: 3 },
  { id: 41, name: 'Ice Cream', parent: 3 },
  { id: 42, name: 'Jam', parent: 3 },
  { id: 43, name: 'Honey', parent: 3 },
  { id: 44, name: 'Breakfast Chocolate', parent: 3 },
  { id: 45, name: 'Peanut Butter', parent: 3 },
  { id: 46, name: 'Cornflakes', parent: 3 },
  { id: 47, name: 'Cornflakes', parent: 3 }, // تکراری در SQL شما بود، اینجا نگه داشتم
  { id: 48, name: 'Halva', parent: 3 },

  // ====== زیردسته‌های Frozen Foods (parent = 4) ======
  { id: 49, name: 'Vegetables', parent: 4 },
  { id: 50, name: 'Desserts', parent: 4 },
  { id: 51, name: 'Ready-Made Meals', parent: 4 },

  // ====== زیردسته‌های Condiments (parent = 5) ======
  { id: 52, name: 'Salt', parent: 5 },
  { id: 53, name: 'Spices', parent: 5 },
  { id: 54, name: 'Herbs', parent: 5 },
  { id: 55, name: 'Lemon Juice', parent: 5 },
  { id: 56, name: 'Vinegar', parent: 5 },
  { id: 57, name: 'Tomato Paste', parent: 5 },
  { id: 58, name: 'Sauce', parent: 5 },
  { id: 59, name: 'Extracts', parent: 5 },
  { id: 60, name: 'Saffron', parent: 5 },
  { id: 61, name: 'Dried Limes', parent: 5 },
  { id: 62, name: 'Barberry', parent: 5 },
  { id: 63, name: 'Raisins', parent: 5 },

  // ====== زیردسته‌های Canned and Ready-Made Food (parent = 6) ======
  { id: 64, name: 'Mineral Water', parent: 6 },
  { id: 65, name: 'Juice', parent: 6 },
  { id: 66, name: 'Syrup', parent: 6 },
  { id: 67, name: 'Tea', parent: 6 },
  { id: 68, name: 'Herbal Tea', parent: 6 },
  { id: 69, name: 'Herbal Drinks', parent: 6 },
  { id: 70, name: 'Buttermilk', parent: 6 },
  { id: 71, name: 'Barley Water', parent: 6 },
  { id: 72, name: 'Energy Drinks', parent: 6 },

  // ====== زیردسته‌های Sweets and Snacks (parent = 7) ======
  { id: 73, name: 'Salad', parent: 7 },
  { id: 74, name: 'Club Sandwich', parent: 7 },
  { id: 75, name: 'Soup', parent: 7 },
  { id: 76, name: 'Stew', parent: 7 },
  { id: 77, name: 'Pickles', parent: 7 },
  { id: 78, name: 'Brine', parent: 7 },
  { id: 79, name: 'Canned Vegetables', parent: 7 },
  { id: 80, name: 'Fish', parent: 7 },
  { id: 81, name: 'Various Nuts and Dried Fruits', parent: 7 },
  { id: 82, name: 'Plums', parent: 7 },
  { id: 83, name: 'Apricots', parent: 7 },
  { id: 84, name: 'Loquats', parent: 7 },
  { id: 85, name: 'Gum', parent: 7 },
  { id: 86, name: 'Pastille', parent: 7 },
  { id: 87, name: 'Smarties', parent: 7 },
  { id: 88, name: 'Pretzels', parent: 7 },
  { id: 89, name: 'Chocolate', parent: 7 },
  { id: 90, name: 'Cocoa', parent: 7 },
  { id: 91, name: 'Puffs', parent: 7 },
  { id: 92, name: 'Chips', parent: 7 },
  { id: 93, name: 'Crunchy', parent: 7 },
  { id: 94, name: 'Popcorn', parent: 7 },
  { id: 95, name: 'Crunchy', parent: 7 },
  { id: 96, name: 'Jelly', parent: 7 },
  { id: 97, name: 'Dent', parent: 7 },
  { id: 98, name: 'Crème Caramel', parent: 7 },
];

// تابع کمکی برای پیدا کردن نام دسته بر اساس ID
export function getCategoryById(id) {
  const found = categories.find(c => c.id === id);
  return found ? found.name : '';
}