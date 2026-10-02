// src/components/ui/CategorySelect.js
"use client";

import { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories"; // ✅ جدید

export default function CategorySelect({
  categoryValue = "",
  subCategoryValue = "",
  onCategoryChange,
  onSubCategoryChange,
  categoryRequired = false,
  subCategoryRequired = false,
}) {
  const { categories } = useCategories(); // ✅ جدید
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  // وقتی categories لود شد، مقادیر اولیه رو ست کن
  useEffect(() => {
    if (categoryValue && categories.length > 0) {
      const found = categories.find((c) => c.name === categoryValue);
      if (found) setSelectedCategoryId(found.id);
    }
  }, [categoryValue, categories]);

  useEffect(() => {
    if (subCategoryValue && categories.length > 0) {
      const found = categories.find((c) => c.name === subCategoryValue);
      if (found) setSelectedSubCategoryId(found.id);
    }
  }, [subCategoryValue, categories]);

  const mainCategories = categories.filter((c) => c.parent === 0);
  const subCategories = categories.filter(
    (c) => c.parent === selectedCategoryId
  );

  const handleMainChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedCategoryId(id);
    const categoryName = categories.find((c) => c.id === id)?.name || "";
    onCategoryChange(categoryName);
    setSelectedSubCategoryId("");
    onSubCategoryChange("");
  };

  const handleSubChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedSubCategoryId(id);
    const subName = categories.find((c) => c.id === id)?.name || "";
    onSubCategoryChange(subName);
  };

  return (
    <div className="row g-3">
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

      <div className="col-md-6">
        <label className="form-label fw-semibold">
          Sub-Category{" "}
          {subCategoryRequired && <span className="text-danger">*</span>}
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
            <option value="" disabled>
              No sub-categories available
            </option>
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