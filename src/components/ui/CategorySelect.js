// src/components/ui/CategorySelect.js
"use client";

import { useState } from "react";
import { categories } from "@/lib/categories";

export default function CategorySelect({
  categoryValue = "", // نام دسته (ذخیره‌شده در دیتابیس)
  subCategoryValue = "", // نام زیردسته (ذخیره‌شده در دیتابیس)
  onCategoryChange, // تابعی که نام دسته جدید را برمی‌گرداند
  onSubCategoryChange, // تابعی که نام زیردسته جدید را برمی‌گرداند
  categoryRequired = false,
  subCategoryRequired = false,
}) {
  // ====== یافتن ID بر اساس نام برای نمایش اولیه ======
  const findIdByName = (name) => {
    const found = categories.find(c => c.name === name);
    return found ? found.id : "";
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState(findIdByName(categoryValue));
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(findIdByName(subCategoryValue));

  // ====== استخراج دسته‌های اصلی ======
  const mainCategories = categories.filter(c => c.parent === 0);

  // ====== استخراج زیردسته‌ها بر اساس دسته انتخاب‌شده ======
  const subCategories = categories.filter(c => c.parent === selectedCategoryId);

  // ====== هندلر تغییر دسته اصلی ======
  const handleMainChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedCategoryId(id);
    
    // پیدا کردن نام دسته و ارسال به والد
    const categoryName = categories.find(c => c.id === id)?.name || "";
    onCategoryChange(categoryName);

    // ریست کردن زیردسته
    setSelectedSubCategoryId("");
    onSubCategoryChange("");
  };

  // ====== هندلر تغییر زیردسته ======
  const handleSubChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedSubCategoryId(id);
    
    // پیدا کردن نام زیردسته و ارسال به والد
    const subName = categories.find(c => c.id === id)?.name || "";
    onSubCategoryChange(subName);
  };

  return (
    <div className="row g-3">
      {/* ====== دسته اصلی ====== */}
      <div className="col-md-6">
        <label className="form-label fw-semibold">
          Category {categoryRequired && <span className="text-danger">*</span>}
        </label>
        <select
          className="form-select"
          value={selectedCategoryId || ""}
          onChange={handleMainChange}
          required={categoryRequired}
        >
          <option value="">Select category</option>
          {mainCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* ====== زیردسته ====== */}
      <div className="col-md-6">
        <label className="form-label fw-semibold">
          Sub-Category {subCategoryRequired && <span className="text-danger">*</span>}
        </label>
        <select
          className="form-select"
          value={selectedSubCategoryId || ""}
          onChange={handleSubChange}
          disabled={!selectedCategoryId}
          required={subCategoryRequired}
        >
          <option value="">Select sub-category</option>
          {subCategories.length > 0 ? (
            subCategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))
          ) : (
            <option value="" disabled>No sub-categories available</option>
          )}
        </select>
        {!selectedCategoryId && (
          <div className="text-muted small mt-1">
            Please select a category first.
          </div>
        )}
      </div>
    </div>
  );
}