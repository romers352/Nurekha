import { useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const TEXT_TYPES = ["text", "textarea", "email", "phone", "url"];

/**
 * Custom hook for CRUD operations on collection items
 * @param {Object} schema - The collection schema
 * @param {string} agentId - The agent ID
 * @param {Function} onDataChange - Callback to refresh data after changes
 * @returns {Object} - CRUD state and operations
 */
export function useCRUDOperations(schema, agentId, onDataChange) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData({});
    setFormErrors({});
    setFormOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData(item.data || {});
    setFormErrors({});
    setFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!schema) return true;
    
    schema.fields.forEach((field) => {
      const value = formData[field.field_name];
      if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
        errors[field.field_name] = "This field is required";
      }
      if (value) {
        if (field.field_type === "number") {
          const num = parseFloat(value);
          if (field.validation?.min !== undefined && num < field.validation.min)
            errors[field.field_name] = `Minimum value is ${field.validation.min}`;
          if (field.validation?.max !== undefined && num > field.validation.max)
            errors[field.field_name] = `Maximum value is ${field.validation.max}`;
        }
        if (TEXT_TYPES.includes(field.field_type)) {
          const len = String(value).length;
          if (field.validation?.min_length && len < field.validation.min_length)
            errors[field.field_name] = `Minimum length is ${field.validation.min_length}`;
          if (field.validation?.max_length && len > field.validation.max_length)
            errors[field.field_name] = `Maximum length is ${field.validation.max_length}`;
        }
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await axios.put(
          `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items/${editingItem.item_id}`,
          { data: formData },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items`,
          { data: formData },
          { withCredentials: true }
        );
      }
      setFormOpen(false);
      onDataChange();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    try {
      await axios.delete(
        `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items/${itemId}`,
        { withCredentials: true }
      );
      onDataChange();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete item");
    }
  };

  const updateFormField = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) setFormErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  return {
    formOpen,
    setFormOpen,
    editingItem,
    formData,
    formErrors,
    saving,
    openCreateDialog,
    openEditDialog,
    handleSave,
    handleDelete,
    updateFormField,
  };
}
