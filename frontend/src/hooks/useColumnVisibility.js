import { useState, useEffect } from "react";

/**
 * Custom hook for managing column visibility with localStorage persistence
 * NOTE: localStorage here stores ONLY column-visibility preferences
 * (list of non-sensitive schema field names, e.g. ["name","price","sku"]).
 * No PII, tokens, or auth data is ever stored here. This is safe.
 * 
 * @param {Object} schema - The collection schema
 * @param {string} agentId - The agent ID
 * @returns {Object} - Visible columns state and manipulation functions
 */
export function useColumnVisibility(schema, agentId) {
  const [visibleColumns, setVisibleColumns] = useState(null);

  // Load visible columns from localStorage once schema is known
  useEffect(() => {
    if (!schema) return;
    const storageKey = `cols:${agentId}:${schema.collection_name}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Only keep columns that still exist in schema
          const validNames = new Set(schema.fields.map((f) => f.field_name));
          const kept = parsed.filter((n) => validNames.has(n));
          setVisibleColumns(kept.length ? kept : schema.fields.slice(0, 6).map((f) => f.field_name));
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load column visibility", e);
    }
    // Default: first 6 columns
    setVisibleColumns(schema.fields.slice(0, 6).map((f) => f.field_name));
  }, [schema, agentId]);

  // Persist visible columns
  useEffect(() => {
    if (!schema || !visibleColumns) return;
    const storageKey = `cols:${agentId}:${schema.collection_name}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (e) {
      console.error("Failed to save column visibility", e);
    }
  }, [visibleColumns, schema, agentId]);

  const toggleColumn = (fieldName) => {
    setVisibleColumns((prev) => {
      if (!prev) return prev;
      if (prev.includes(fieldName)) return prev.filter((n) => n !== fieldName);
      return [...prev, fieldName];
    });
  };

  const resetColumnsDefault = () => {
    if (schema) setVisibleColumns(schema.fields.slice(0, 6).map((f) => f.field_name));
  };

  const showAllColumns = () => {
    if (schema) setVisibleColumns(schema.fields.map((f) => f.field_name));
  };

  return {
    visibleColumns,
    toggleColumn,
    resetColumnsDefault,
    showAllColumns,
  };
}
