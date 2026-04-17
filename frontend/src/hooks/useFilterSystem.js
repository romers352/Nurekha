import { useState, useMemo } from "react";

const TEXT_TYPES = ["text", "textarea", "email", "phone", "url"];

/**
 * Custom hook for managing advanced filtering and search
 * @param {Array} items - The items to filter
 * @param {Object} schema - The collection schema
 * @returns {Object} - Filter state and filtered items
 */
export function useFilterSystem(items, schema) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({});

  const applyFilter = (item, fieldName, filter, fieldType) => {
    const value = item.data?.[fieldName];
    if (filter === undefined || filter === null) return true;

    if (TEXT_TYPES.includes(fieldType)) {
      if (!filter.text) return true;
      return String(value ?? "").toLowerCase().includes(String(filter.text).toLowerCase());
    }
    if (fieldType === "number") {
      const n = parseFloat(value);
      if (filter.min !== undefined && filter.min !== "" && !isNaN(filter.min) && (isNaN(n) || n < parseFloat(filter.min))) return false;
      if (filter.max !== undefined && filter.max !== "" && !isNaN(filter.max) && (isNaN(n) || n > parseFloat(filter.max))) return false;
      return true;
    }
    if (fieldType === "date") {
      if (!value) return !(filter.from || filter.to);
      const d = new Date(value).getTime();
      if (filter.from && d < new Date(filter.from).getTime()) return false;
      if (filter.to && d > new Date(filter.to).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    }
    if (fieldType === "dropdown") {
      if (!filter.value) return true;
      return value === filter.value;
    }
    if (fieldType === "checkbox") {
      if (!filter.value || filter.value === "any") return true;
      if (filter.value === "yes") return value === true;
      if (filter.value === "no") return !value;
      return true;
    }
    if (fieldType === "image") {
      if (!filter.value || filter.value === "any") return true;
      const imgs = Array.isArray(value) ? value : value ? [value] : [];
      if (filter.value === "has") return imgs.length > 0;
      if (filter.value === "none") return imgs.length === 0;
      return true;
    }
    return true;
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Simple search across all string-ish values
      if (search) {
        const searchLower = search.toLowerCase();
        const match = Object.values(item.data || {}).some((val) => {
          if (val === null || val === undefined) return false;
          if (Array.isArray(val)) return val.some((v) => String(v).toLowerCase().includes(searchLower));
          return String(val).toLowerCase().includes(searchLower);
        });
        if (!match) return false;
      }
      // Advanced filters
      if (schema && Object.keys(activeFilters).length > 0) {
        for (const [fieldName, filter] of Object.entries(activeFilters)) {
          const field = schema.fields.find((f) => f.field_name === fieldName);
          if (!field) continue;
          if (!applyFilter(item, fieldName, filter, field.field_type)) return false;
        }
      }
      return true;
    });
  }, [items, search, activeFilters, schema]);

  const activeFilterCount = useMemo(() => {
    return Object.entries(activeFilters).filter(([, f]) => {
      if (!f) return false;
      if (f.text) return true;
      if (f.value) return true;
      if (f.min !== undefined && f.min !== "") return true;
      if (f.max !== undefined && f.max !== "") return true;
      if (f.from || f.to) return true;
      return false;
    }).length;
  }, [activeFilters]);

  const clearAllFilters = () => {
    setSearch("");
    setActiveFilters({});
  };

  return {
    search,
    setSearch,
    activeFilters,
    setActiveFilters,
    filteredItems,
    activeFilterCount,
    clearAllFilters,
  };
}
