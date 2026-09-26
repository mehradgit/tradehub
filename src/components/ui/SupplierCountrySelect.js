// src/components/ui/SupplierCountrySelect.js
"use client";

import { useState, useRef, useEffect } from "react";
import { countries } from "@/lib/countries";
import CountryFlag from "./CountryFlag";

export default function SupplierCountrySelect({ value = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isWorldwide = value.includes("WORLDWIDE");

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCountry = (code) => {
    if (code === "WORLDWIDE") {
      onChange(isWorldwide ? [] : ["WORLDWIDE"]);
      return;
    }

    let newValue = isWorldwide
      ? [code]
      : value.includes(code)
      ? value.filter((c) => c !== code)
      : [...value, code];

    onChange(newValue);
  };

  const removeCountry = (code) => {
    onChange(value.filter((c) => c !== code));
  };

  const getSelectedLabel = () => {
    if (value.length === 0) return "Select supplier countries...";
    if (isWorldwide) return "Worldwide";
    if (value.length === 1) {
      const c = countries.find((x) => x.code === value[0]);
      return c?.name || value[0];
    }
    return `${value.length} countries selected`;
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          border: "1.5px solid var(--gray-light)",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          background: "#fff",
          minHeight: 46,
        }}
      >
        <span style={{ fontSize: 14, color: value.length ? "var(--black)" : "var(--gray)" }}>
          {getSelectedLabel()}
        </span>
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
          style={{ fontSize: 12, color: "var(--gray)" }}
        ></i>
      </div>

      {value.length > 0 && !isWorldwide && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {value.map((code) => {
            const country = countries.find((c) => c.code === code);
            return (
              <span
                key={code}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  background: "var(--primary-light, #eaf7f1)",
                  color: "var(--primary-dark, #0b5b43)",
                  borderRadius: 50,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <CountryFlag countryCode={code} size="14px" />
                {country?.name || code}
                <button
                  type="button"
                  onClick={() => removeCountry(code)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--primary-dark)",
                    fontSize: 12,
                    lineHeight: 1,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid var(--gray-light)",
            borderRadius: "var(--radius)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            zIndex: 1000,
            maxHeight: 320,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: 10, borderBottom: "1px solid var(--gray-light)" }}>
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--gray-light)",
                borderRadius: 8,
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ overflowY: "auto", maxHeight: 240 }}>
            <div
              onClick={() => toggleCountry("WORLDWIDE")}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: isWorldwide ? "var(--primary-light)" : "transparent",
                fontWeight: isWorldwide ? 700 : 500,
                fontSize: 13,
                borderBottom: "1px solid var(--gray-light)",
              }}
              onMouseEnter={(e) => {
                if (!isWorldwide) e.currentTarget.style.background = "var(--light)";
              }}
              onMouseLeave={(e) => {
                if (!isWorldwide) e.currentTarget.style.background = "transparent";
              }}
            >
              <i
                className="fas fa-globe"
                style={{ color: "var(--primary)", width: 20, textAlign: "center" }}
              ></i>
              <span>Worldwide</span>
              {isWorldwide && (
                <i className="fas fa-check" style={{ marginLeft: "auto", color: "var(--primary)" }}></i>
              )}
            </div>

            {filteredCountries.map((country) => {
              const isSelected = value.includes(country.code);
              return (
                <div
                  key={country.code}
                  onClick={() => toggleCountry(country.code)}
                  style={{
                    padding: "10px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    background: isSelected ? "var(--primary-light)" : "transparent",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--light)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <CountryFlag countryCode={country.code} size="18px" />
                  <span>{country.name}</span>
                  {isSelected && (
                    <i
                      className="fas fa-check"
                      style={{ marginLeft: "auto", color: "var(--primary)" }}
                    ></i>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}