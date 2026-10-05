// src/components/ui/CountrySelect.js
"use client";

import { useState, useRef, useEffect } from "react";
import { countries, getCountryByCode } from "@/lib/countries";
import CountryFlag from "./CountryFlag";

export default function CountrySelect({
  value = "", // country code (e.g. "US")
  onChange, // callback that returns the country code
  placeholder = "Select country",
  className = "",
  required = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Close the dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter countries by the search term
  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selected country
  const selectedCountry = getCountryByCode(value);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="position-relative" ref={wrapperRef}>
      {/* Selected value button */}
      <div
        className={`form-control d-flex align-items-center justify-content-between cursor-pointer ${className}`}
        style={{ cursor: "pointer", minHeight: "45px" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="d-flex align-items-center gap-2">
          {selectedCountry ? (
            <>
              <CountryFlag countryCode={value} size="20px" />
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-muted">{placeholder}</span>
          )}
        </div>
        <i className={`fas fa-chevron-${isOpen ? "up" : "down"} text-muted`}></i>
      </div>

      {/* Dropdown list with search */}
      {isOpen && (
        <div
          className="position-absolute w-100 shadow bg-white rounded-3 overflow-hidden"
          style={{
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 1050,
            border: "1px solid var(--gray-light)",
            maxHeight: "300px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search field */}
          <div className="p-2 border-bottom">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent border-end-0">
                <i className="fas fa-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-auto" style={{ maxHeight: "250px" }}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country.code}
                  className="d-flex align-items-center gap-2 px-3 py-2 hover-bg-light cursor-pointer"
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSelect(country.code)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--light)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <CountryFlag countryCode={country.code} size="20px" />
                  <span>{country.name}</span>
                  {value === country.code && (
                    <i className="fas fa-check ms-auto text-primary"></i>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-3 text-muted">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}