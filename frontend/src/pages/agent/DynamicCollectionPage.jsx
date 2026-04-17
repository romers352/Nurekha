import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Loader2, Search, Grid, List, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DynamicFormField from "@/components/DynamicFormField";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function DynamicCollectionPage() {
  const { agentId } = useParams();
  const [schema, setSchema] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table"); // 'table' or 'card'

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [agentId]);

  const fetchData = async () => {
    try {
      // Get agent's schemas
      const schemasRes = await axios.get(`${API}/api/agents/${agentId}/schemas`, {
        withCredentials: true,
      });

      if (schemasRes.data.length === 0) {
        setLoading(false);
        return;
      }

      // Use first schema (in Phase 5 we'll add collection switcher)
      const firstSchema = schemasRes.data[0];
      setSchema(firstSchema);

      // Fetch items for this collection
      const itemsRes = await axios.get(
        `${API}/api/agents/${agentId}/collections/${firstSchema.collection_name}/items`,
        { withCredentials: true }
      );
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

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
    
    schema.fields.forEach((field) => {
      const value = formData[field.field_name];
      
      // Required validation
      if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
        errors[field.field_name] = "This field is required";
      }

      // Type-specific validations
      if (value) {
        if (field.field_type === "number") {
          const num = parseFloat(value);
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors[field.field_name] = `Minimum value is ${field.validation.min}`;
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors[field.field_name] = `Maximum value is ${field.validation.max}`;
          }
        }

        if (field.field_type === "text" || field.field_type === "textarea") {
          if (field.validation?.min_length && value.length < field.validation.min_length) {
            errors[field.field_name] = `Minimum length is ${field.validation.min_length} characters`;
          }
          if (field.validation?.max_length && value.length > field.validation.max_length) {
            errors[field.field_name] = `Maximum length is ${field.validation.max_length} characters`;
          }
        }

        if (field.field_type === "email" && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[field.field_name] = "Invalid email format";
          }
        }

        if (field.field_type === "url" && value) {
          try {
            new URL(value);
          } catch {
            errors[field.field_name] = "Invalid URL format";
          }
        }
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        // Update
        await axios.put(
          `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items/${editingItem.item_id}`,
          { data: formData },
          { withCredentials: true }
        );
      } else {
        // Create
        await axios.post(
          `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items`,
          { data: formData },
          { withCredentials: true }
        );
      }

      setFormOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to save item", err);
      alert("Failed to save item. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm("Delete this item? This cannot be undone.")) {
      return;
    }

    try {
      await axios.delete(
        `${API}/api/agents/${agentId}/collections/${schema.collection_name}/items/${itemId}`,
        { withCredentials: true }
      );
      fetchData();
    } catch (err) {
      console.error("Failed to delete item", err);
      alert("Failed to delete item");
    }
  };

  const updateFormField = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field
    setFormErrors((prev) => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  };

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return Object.values(item.data || {}).some((val) =>
      String(val).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#57534E]" />
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#0C0A09] mb-2">No Schema Found</h2>
          <p className="text-[#57534E] mb-6">
            This agent doesn't have a data schema yet. Create one in Schema Builder to start managing data.
          </p>
          <a
            href={`/agent/${agentId}/schema-builder`}
            className="inline-block h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917]"
          >
            Go to Schema Builder
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">{schema.display_name}</h1>
            <p className="text-sm text-[#57534E] mt-1">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center border border-[#E7E5E4] rounded-lg bg-white">
              <button
                onClick={() => setView("table")}
                className={`h-10 px-3 rounded-l-lg flex items-center gap-2 ${
                  view === "table" ? "bg-[#F5F0EB] text-[#0C0A09]" : "text-[#57534E] hover:bg-[#FAFAFA]"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("card")}
                className={`h-10 px-3 rounded-r-lg flex items-center gap-2 ${
                  view === "card" ? "bg-[#F5F0EB] text-[#0C0A09]" : "text-[#57534E] hover:bg-[#FAFAFA]"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openCreateDialog}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add {schema.display_name.replace(/s$/, "")}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full h-10 pl-10 pr-4 border border-[#E7E5E4] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1C1917] bg-white"
          />
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <p className="text-[#A8A29E]">
              {items.length === 0
                ? `No ${schema.display_name.toLowerCase()} yet. Click "Add" to create your first item.`
                : "No items match your search."}
            </p>
          </div>
        ) : view === "table" ? (
          <TableView items={filteredItems} schema={schema} onEdit={openEditDialog} onDelete={handleDelete} />
        ) : (
          <CardView items={filteredItems} schema={schema} onEdit={openEditDialog} onDelete={handleDelete} />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${schema.display_name.replace(/s$/, "")}` : `Add ${schema.display_name.replace(/s$/, "")}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {schema.fields.map((field) => (
              <DynamicFormField
                key={field.field_name}
                field={field}
                value={formData[field.field_name]}
                onChange={updateFormField}
                error={formErrors[field.field_name]}
              />
            ))}
          </div>

          <DialogFooter>
            <button
              onClick={() => setFormOpen(false)}
              className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingItem ? "Update" : "Add"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TableView({ items, schema, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
            <tr>
              {schema.fields.slice(0, 5).map((field) => (
                <th key={field.field_name} className="px-4 py-3 text-left text-xs font-medium text-[#57534E]">
                  {field.field_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-[#57534E]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]">
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-[#FAFAFA]">
                {schema.fields.slice(0, 5).map((field) => (
                  <td key={field.field_name} className="px-4 py-3 text-sm text-[#0C0A09]">
                    {renderCellValue(item.data[field.field_name], field.field_type)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onEdit(item)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#F5F5F4] text-[#57534E]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.item_id)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#F5F5F4] text-[#DC2626] ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardView({ items, schema, onEdit, onDelete }) {
  const imageField = schema.fields.find((f) => f.field_type === "image");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const images = item.data[imageField?.field_name];
        const imageUrl = Array.isArray(images) ? images[0] : images;

        return (
          <div key={item.item_id} className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
            {imageUrl && (
              <div className="aspect-video bg-[#F5F5F4]">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              {schema.fields.slice(0, 4).map((field) => {
                const value = item.data[field.field_name];
                if (!value || field.field_type === "image") return null;
                return (
                  <div key={field.field_name} className="mb-2">
                    <p className="text-xs text-[#A8A29E] mb-0.5">
                      {field.field_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-[#0C0A09] font-medium line-clamp-1">
                      {renderCellValue(value, field.field_type)}
                    </p>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E7E5E4]">
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 h-9 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.item_id)}
                  className="flex-1 h-9 border border-[#DC2626] text-[#DC2626] rounded-lg text-sm font-medium hover:bg-[#FEF2F2] flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderCellValue(value, fieldType) {
  if (value === null || value === undefined || value === "") return "-";

  switch (fieldType) {
    case "checkbox":
      return value ? "Yes" : "No";
    case "image":
      const images = Array.isArray(value) ? value : [value];
      return images.length > 0 ? `${images.length} image(s)` : "-";
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "date":
      return new Date(value).toLocaleDateString();
    case "textarea":
      return String(value).substring(0, 100) + (String(value).length > 100 ? "..." : "");
    default:
      return String(value).substring(0, 50) + (String(value).length > 50 ? "..." : "");
  }
}
