import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Save, Loader2, Settings2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const FIELD_TYPES = [
  { value: "text", label: "Text (Short)", icon: "Aa" },
  { value: "textarea", label: "Text Area (Long)", icon: "¶" },
  { value: "number", label: "Number", icon: "123" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "dropdown", label: "Dropdown", icon: "▼" },
  { value: "checkbox", label: "Checkbox (Yes/No)", icon: "☑" },
  { value: "image", label: "Images (up to 6)", icon: "🖼" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "url", label: "URL/Link", icon: "🔗" },
];

export default function SchemaBuilderPage() {
  const { agentId } = useParams();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  
  // Form state
  const [collectionName, setCollectionName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchemas();
  }, [agentId]);

  const fetchSchemas = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/schemas`, {
        withCredentials: true,
      });
      setSchemas(data);
    } catch (err) {
      console.error("Failed to fetch schemas", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSchema(null);
    setCollectionName("");
    setDisplayName("");
    setFields([
      {
        field_name: "",
        field_type: "text",
        required: false,
        unique: false,
        validation: {},
        dropdown_options: []
      }
    ]);
    setDialogOpen(true);
  };

  const openEditDialog = (schema) => {
    setEditingSchema(schema);
    setCollectionName(schema.collection_name);
    setDisplayName(schema.display_name);
    setFields(schema.fields || []);
    setDialogOpen(true);
  };

  const addField = () => {
    if (fields.length >= 20) {
      alert("Maximum 20 fields allowed per collection");
      return;
    }
    setFields([
      ...fields,
      {
        field_name: "",
        field_type: "text",
        required: false,
        unique: false,
        validation: {},
        dropdown_options: []
      }
    ]);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const updateValidation = (index, key, value) => {
    const updated = [...fields];
    updated[index] = {
      ...updated[index],
      validation: { ...updated[index].validation, [key]: value }
    };
    setFields(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!collectionName.trim()) {
      alert("Collection name is required");
      return;
    }

    const invalidFields = fields.filter(f => !f.field_name.trim());
    if (invalidFields.length > 0) {
      alert("All fields must have a name");
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/schemas`,
        {
          collection_name: collectionName.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: displayName.trim() || collectionName.trim(),
          fields: fields.map(f => ({
            ...f,
            field_name: f.field_name.trim().toLowerCase().replace(/\s+/g, "_")
          }))
        },
        { withCredentials: true }
      );
      
      setDialogOpen(false);
      fetchSchemas();
    } catch (err) {
      console.error("Failed to save schema", err);
      alert(err.response?.data?.detail || "Failed to save schema");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (collectionName) => {
    if (!confirm(`Delete "${collectionName}" schema and ALL its data? This cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${API}/api/agents/${agentId}/schemas/${collectionName}`,
        { withCredentials: true }
      );
      fetchSchemas();
    } catch (err) {
      console.error("Failed to delete schema", err);
      alert("Failed to delete schema");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#57534E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">Schema Builder</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Create custom data structures for your agent
            </p>
          </div>
          <button
            onClick={openCreateDialog}
            className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {schemas.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <Settings2 className="w-12 h-12 text-[#D6D3D1] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0C0A09] mb-2">No collections yet</h3>
            <p className="text-[#A8A29E] mb-6">
              Create your first custom data collection to get started
            </p>
            <button
              onClick={openCreateDialog}
              className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemas.map((schema) => (
              <div
                key={schema.collection_name}
                className="bg-white border border-[#E7E5E4] rounded-xl p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0C0A09]">
                      {schema.display_name}
                    </h3>
                    <p className="text-xs text-[#A8A29E] mt-0.5">
                      {schema.collection_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditDialog(schema)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#57534E]"
                      title="Edit"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(schema.collection_name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#DC2626]"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#57534E] mb-2">
                    {schema.fields?.length || 0} fields
                  </p>
                  <div className="space-y-1">
                    {schema.fields?.slice(0, 5).map((field, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-[#0C0A09] font-medium">
                          {field.field_name}
                        </span>
                        <span className="text-[#A8A29E]">({field.field_type})</span>
                        {field.required && (
                          <span className="text-[#DC2626] text-[10px]">*required</span>
                        )}
                      </div>
                    ))}
                    {schema.fields?.length > 5 && (
                      <p className="text-[#A8A29E] text-xs">
                        +{schema.fields.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schema Builder Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSchema ? "Edit Collection" : "Create New Collection"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Collection Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">
                  Collection Name *
                </label>
                <input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., products, categories"
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                  disabled={editingSchema !== null}
                />
                <p className="text-xs text-[#A8A29E] mt-1">
                  Lowercase, underscores only
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">
                  Display Name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Products, Categories"
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Fields */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[#0C0A09]">
                  Fields ({fields.length}/20)
                </label>
                <button
                  onClick={addField}
                  disabled={fields.length >= 20}
                  className="h-8 px-3 bg-[#F5F5F4] text-[#0C0A09] rounded-lg text-xs font-medium hover:bg-[#E7E5E4] disabled:opacity-40 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={index}
                    className="border border-[#E7E5E4] rounded-lg p-4 bg-[#FAFAFA]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        {/* Field Name & Type */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">
                              Field Name *
                            </label>
                            <input
                              value={field.field_name}
                              onChange={(e) =>
                                updateField(index, "field_name", e.target.value)
                              }
                              placeholder="e.g., product_name, price"
                              className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">
                              Field Type *
                            </label>
                            <select
                              value={field.field_type}
                              onChange={(e) =>
                                updateField(index, "field_type", e.target.value)
                              }
                              className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm outline-none"
                            >
                              {FIELD_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.icon} {type.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateField(index, "required", e.target.checked)
                              }
                              className="rounded"
                            />
                            Required
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={field.unique}
                              onChange={(e) =>
                                updateField(index, "unique", e.target.checked)
                              }
                              className="rounded"
                            />
                            Unique (No duplicates)
                          </label>
                        </div>

                        {/* Dropdown Options */}
                        {field.field_type === "dropdown" && (
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">
                              Dropdown Options (comma-separated)
                            </label>
                            <input
                              value={field.dropdown_options?.join(", ") || ""}
                              onChange={(e) =>
                                updateField(
                                  index,
                                  "dropdown_options",
                                  e.target.value.split(",").map((s) => s.trim())
                                )
                              }
                              placeholder="Option 1, Option 2, Option 3"
                              className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                        )}

                        {/* Validation Rules */}
                        {(field.field_type === "text" || field.field_type === "textarea") && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">
                                Min Length
                              </label>
                              <input
                                type="number"
                                value={field.validation?.min_length || ""}
                                onChange={(e) =>
                                  updateValidation(index, "min_length", parseInt(e.target.value) || 0)
                                }
                                className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">
                                Max Length
                              </label>
                              <input
                                type="number"
                                value={field.validation?.max_length || ""}
                                onChange={(e) =>
                                  updateValidation(index, "max_length", parseInt(e.target.value) || 0)
                                }
                                className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {field.field_type === "number" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">
                                Min Value
                              </label>
                              <input
                                type="number"
                                value={field.validation?.min || ""}
                                onChange={(e) =>
                                  updateValidation(index, "min", parseFloat(e.target.value) || 0)
                                }
                                className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">
                                Max Value
                              </label>
                              <input
                                type="number"
                                value={field.validation?.max || ""}
                                onChange={(e) =>
                                  updateValidation(index, "max", parseFloat(e.target.value) || 0)
                                }
                                className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeField(index)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#DC2626] flex-shrink-0"
                        title="Remove field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 border border-dashed border-[#E7E5E4] rounded-lg">
                  <p className="text-sm text-[#A8A29E]">
                    No fields added yet. Click "Add Field" to start.
                  </p>
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] border border-[#FDE047] rounded-lg">
              <AlertCircle className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#78350F]">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Maximum 20 fields per collection</li>
                  <li>Field names will be converted to lowercase with underscores</li>
                  <li>Deleting a collection will delete ALL its data</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || fields.length === 0 || !collectionName.trim()}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {editingSchema ? "Update Schema" : "Create Schema"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
