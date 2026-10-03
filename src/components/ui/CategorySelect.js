// src/components/ui/CategorySelect.js
"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";

export default function CategorySelect({
  categoryValue = "",
  subCategoryValue = "",
  productTypeValue = "",
  onCategoryChange,
  onSubCategoryChange,
  onProductTypeChange,
  categoryRequired = false,
  subCategoryRequired = false,
  productTypeRequired = false,
}) {
  const { categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  // ====== Sync با props ======
  useEffect(() => {
    if (categoryValue && categories.length > 0) {
      const found = categories.find(
        (c) => c.id === categoryValue || c.name === categoryValue
      );
      if (found) setSelectedCategoryId(found.id);
    }
  }, [categoryValue, categories]);

  useEffect(() => {
    if (subCategoryValue && categories.length > 0) {
      const found = categories.find(
        (c) => c.id === subCategoryValue || c.name === subCategoryValue
      );
      if (found) setSelectedSubCategoryId(found.id);
    }
  }, [subCategoryValue, categories]);

  // ====== لیست‌ها ======
  const mainCategories = categories
    .filter((c) => c.parent === 0)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const subCategories = categories
    .filter((c) => c.parent === selectedCategoryId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const selectedSub = categories.find((c) => c.id === selectedSubCategoryId);
  const productTypes = selectedSub?.productTypes || [];

  // ====== Handlerها ======
  const handleMainChange = (e) => {
    const id = e.target.value;
    setSelectedCategoryId(id);
    const name = categories.find((c) => c.id === id)?.name || "";
    onCategoryChange?.(name, id);
    setSelectedSubCategoryId("");
    onSubCategoryChange?.("", "");
    onProductTypeChange?.("");
  };

  const handleSubChange = (e) => {
    const id = e.target.value;
    setSelectedSubCategoryId(id);
    const name = categories.find((c) => c.id === id)?.name || "";
    onSubCategoryChange?.(name, id);
    onProductTypeChange?.("");
  };

  const handleProductTypeChange = (e) => {
    onProductTypeChange?.(e.target.value);
  };

  // ====== محاسبه عرض ستون‌ها ======
  const hasProductType = productTypes.length > 0;
  const colClass = hasProductType ? "col-md-4" : "col-md-6";

  return (
    <div className="row g-3">
      {/* سطح ۱: Category */}
      <div className={colClass}>
        <label className="form-label fw-semibold">
          Category {categoryRequired && <span className="text-danger">*</span>}
        </label>
        <select
          className="form-select"
          value={selectedCategoryId}
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

      {/* سطح ۲: Sub-Category */}
      <div className={colClass}>
        <label className="form-label fw-semibold">
          Sub-Category{" "}
          {subCategoryRequired && <span className="text-danger">*</span>}
        </label>
        <select
          className="form-select"
          value={selectedSubCategoryId}
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
            <option value="" disabled>
              {selectedCategoryId
                ? "No sub-categories available"
                : "Select a category first"}
            </option>
          )}
        </select>
      </div>

      {/* سطح ۳: Product Type (فقط اگر زیردسته productTypes داشته باشد) */}
      {hasProductType && (
        <div className="col-md-4">
          <label className="form-label fw-semibold">
            Product Type{" "}
            {productTypeRequired && <span className="text-danger">*</span>}
          </label>
          <select
            className="form-select"
            value={productTypeValue}
            onChange={handleProductTypeChange}
            required={productTypeRequired}
          >
            <option value="">Select product type</option>
            {productTypes.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}