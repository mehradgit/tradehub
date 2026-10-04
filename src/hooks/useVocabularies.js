// src/hooks/useVocabularies.js
"use client";

import { useEffect, useState } from "react";

// ============================================================
// واژگان کنترل‌شده برای فرم‌ها
// cache سطح ماژول تا فقط یک‌بار fetch شود
// ============================================================
let cache = null;
let cachePromise = null;

export function useVocabularies() {
  const [vocabularies, setVocabularies] = useState(cache || {});
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    if (cache) {
      setVocabularies(cache);
      setLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = fetch("/api/vocabularies")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          cache = data?.vocabularies || {};
          return cache;
        })
        .catch(() => {
          cache = {};
          return {};
        });
    }

    cachePromise.then((v) => {
      setVocabularies(v);
      setLoading(false);
    });
  }, []);

  return { vocabularies, loading };
}

/**
 * گزینه‌های یک واژگان خاص → [{value,label}]
 */
export function useVocabulary(key) {
  const { vocabularies, loading } = useVocabularies();
  return { options: vocabularies[key] || [], loading };
}

export function invalidateVocabulariesCache() {
  cache = null;
  cachePromise = null;
}
