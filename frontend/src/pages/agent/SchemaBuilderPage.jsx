import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Save, Loader2, Settings2, AlertCircle, Copy, Edit3, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const MAX_COLLECTIONS = 2;

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

/* ─── Sortable Schema Card ─── */
function SortableSchemaCard({ schema, onEdit, onRename, onDuplicate, onDelete, atLimit, busyAction }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schema.collection_name,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-[#E7E5E4] rounded-xl p-6 hover:shadow-sm transition-shadow"
      data-testid={`schema-card-${schema.collection_name}`}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 text-[#A8A29E] hover:text-[#57534E] cursor-grab active:cursor-grabbing touch-none"
            title="Drag to reorder"
            data-testid={`drag-handle-${schema.collection_name}`}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-[#0C0A09] truncate">{schema.display_name}</h3>
            <p className="text-xs text-[#A8A29E] mt-0.5 font-mono truncate">{schema.collection_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onRename(schema)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#57534E]"
            title="Rename"
            data-testid={`rename-schema-${schema.collection_name}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(schema)}
            disabled={atLimit || busyAction === schema.collection_name}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#57534E] disabled:opacity-40 disabled:cursor-not-allowed"
            title={atLimit ? `Max ${MAX_COLLECTIONS} collections reached` : "Duplicate"}
            data-testid={`duplicate-schema-${schema.collection_name}`}
          >
            {busyAction === schema.collection_name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(schema)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#57534E]"
            title="Edit fields"
            data-testid={`edit-schema-${schema.collection_name}`}
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(schema)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#DC2626]"
            title="Delete"
            data-testid={`delete-schema-${schema.collection_name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#FAFAFA] rounded-lg px-3 py-2">
          <p className="text-xs text-[#A8A29E]">Items</p>
          <p className="text-lg font-semibold text-[#0C0A09]" data-testid={`item-count-${schema.collection_name}`}>
            {schema.item_count ?? 0}
          </p>
        </div>
        <div className="bg-[#FAFAFA] rounded-lg px-3 py-2">
          <p className="text-xs text-[#A8A29E]">Fields</p>
          <p className="text-lg font-semibold text-[#0C0A09]">{schema.fields?.length ?? 0}</p>
        </div>
      </div>

      <div className="space-y-1 border-t border-[#F5F5F4] pt-3">
        <p className="text-[10px] font-medium tracking-wide text-[#A8A29E] uppercase mb-1.5">Fields</p>
        {schema.fields?.slice(0, 4).map((field, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-[#0C0A09] font-medium truncate">{field.field_name}</span>
            <span className="text-[#A8A29E] shrink-0">({field.field_type})</span>
            {field.required && <span className="text-[#DC2626] text-[10px]">*</span>}
          </div>
        ))}
        {schema.fields?.length > 4 && (
          <p className="text-[#A8A29E] text-xs">+{schema.fields.length - 4} more</p>
        )}
      </div>
    </div>
  );
}

export default function SchemaBuilderPage() {
  const { agentId } = useParams();
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [busyAction, setBusyAction] = useState(null);

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameNewCollection, setRenameNewCollection] = useState("");
  const [renameNewDisplay, setRenameNewDisplay] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Duplicate dialog state
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicateNewCollection, setDuplicateNewCollection] = useState("");
  const [duplicateNewDisplay, setDuplicateNewDisplay] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Form state
  const [collectionName, setCollectionName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSchemas = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/schemas`, { withCredentials: true });
      setSchemas(data);
    } catch (err) {
      console.error("Failed to fetch schemas", err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const atLimit = schemas.length >= MAX_COLLECTIONS;

  const openCreateDialog = () => {
    if (atLimit) {
      alert(`Maximum of ${MAX_COLLECTIONS} collections per agent reached. Delete or rename an existing one first.`);
      return;
    }
    setEditingSchema(null);
    setCollectionName("");
    setDisplayName("");
    setFields([{ field_name: "", field_type: "text", required: false, unique: false, validation: {}, dropdown_options: [] }]);
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
    setFields([...fields, { _key: `f_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, field_name: "", field_type: "text", required: false, unique: false, validation: {}, dropdown_options: [] }]);
  };

  const removeField = (index) => setFields(fields.filter((_, i) => i !== index));

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const updateValidation = (index, key, value) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], validation: { ...updated[index].validation, [key]: value } };
    setFields(updated);
  };

  const handleSave = () => {
    if (!collectionName.trim()) { alert("Collection name is required"); return; }
    const invalidFields = fields.filter((f) => !f.field_name.trim());
    if (invalidFields.length > 0) { alert("All fields must have a name"); return; }

    if (editingSchema) setConfirmDialogOpen(true);
    else saveSchema();
  };

  const saveSchema = async () => {
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/schemas`,
        {
          collection_name: collectionName.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: displayName.trim() || collectionName.trim(),
          fields: fields.map((f) => {
            const { _key, ...clean } = f;
            return { ...clean, field_name: clean.field_name.trim().toLowerCase().replace(/\s+/g, "_") };
          }),
        },
        { withCredentials: true }
      );
      setDialogOpen(false);
      setConfirmDialogOpen(false);
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to save schema");
    } finally {
      setSaving(false);
    }
  };

  const initializeDefaultSchema = async () => {
    setInitializing(true);
    try {
      await axios.post(`${API}/api/agents/${agentId}/schemas/initialize-default`, {}, { withCredentials: true });
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to initialize default schema");
    } finally {
      setInitializing(false);
    }
  };

  const handleDelete = async (schema) => {
    const msg = (schema.item_count || 0) > 0
      ? `Delete "${schema.display_name}" and ALL ${schema.item_count} items? This cannot be undone.`
      : `Delete "${schema.display_name}"? This cannot be undone.`;
    if (!confirm(msg)) return;

    try {
      await axios.delete(`${API}/api/agents/${agentId}/schemas/${schema.collection_name}`, { withCredentials: true });
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete schema");
    }
  };

  /* ── Rename ── */
  const openRenameDialog = (schema) => {
    setRenameTarget(schema);
    setRenameNewCollection(schema.collection_name);
    setRenameNewDisplay(schema.display_name);
    setRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    const payload = {};
    const cleanedKey = renameNewCollection.trim().toLowerCase().replace(/\s+/g, "_");
    if (cleanedKey && cleanedKey !== renameTarget.collection_name) {
      payload.new_collection_name = cleanedKey;
    }
    if (renameNewDisplay.trim() && renameNewDisplay.trim() !== renameTarget.display_name) {
      payload.new_display_name = renameNewDisplay.trim();
    }
    if (Object.keys(payload).length === 0) {
      setRenameDialogOpen(false);
      return;
    }

    setRenaming(true);
    try {
      await axios.put(
        `${API}/api/agents/${agentId}/schemas/${renameTarget.collection_name}/rename`,
        payload,
        { withCredentials: true }
      );
      setRenameDialogOpen(false);
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to rename collection");
    } finally {
      setRenaming(false);
    }
  };

  /* ── Duplicate ── */
  const openDuplicateDialog = (schema) => {
    if (atLimit) {
      alert(`Maximum of ${MAX_COLLECTIONS} collections per agent reached.`);
      return;
    }
    setDuplicateTarget(schema);
    setDuplicateNewCollection(`${schema.collection_name}_copy`);
    setDuplicateNewDisplay(`${schema.display_name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicate = async () => {
    if (!duplicateTarget) return;
    setDuplicating(true);
    setBusyAction(duplicateTarget.collection_name);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/schemas/${duplicateTarget.collection_name}/duplicate`,
        {
          new_collection_name: duplicateNewCollection.trim().toLowerCase().replace(/\s+/g, "_"),
          new_display_name: duplicateNewDisplay.trim(),
        },
        { withCredentials: true }
      );
      setDuplicateDialogOpen(false);
      fetchSchemas();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to duplicate collection");
    } finally {
      setDuplicating(false);
      setBusyAction(null);
    }
  };

  /* ── Drag Reorder ── */
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = schemas.findIndex((s) => s.collection_name === active.id);
    const newIndex = schemas.findIndex((s) => s.collection_name === over.id);
    const reordered = arrayMove(schemas, oldIndex, newIndex);
    setSchemas(reordered); // optimistic update

    try {
      await axios.patch(
        `${API}/api/agents/${agentId}/schemas/reorder`,
        { order: reordered.map((s) => s.collection_name) },
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Failed to save reorder", err);
      fetchSchemas(); // revert
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
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="schema-builder-page">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">Schema Builder</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Create custom data structures — {schemas.length}/{MAX_COLLECTIONS} collections used
            </p>
          </div>
          <div className="flex items-center gap-2">
            {schemas.length === 0 && (
              <button
                onClick={initializeDefaultSchema}
                disabled={initializing}
                className="h-10 px-4 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2"
                data-testid="init-default-schema-btn"
              >
                {initializing && <Loader2 className="w-4 h-4 animate-spin" />}
                Initialize Default Schema
              </button>
            )}
            <button
              onClick={openCreateDialog}
              disabled={atLimit}
              className={`h-10 px-4 rounded-lg text-sm font-medium flex items-center gap-2 ${
                atLimit ? "bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed" : "bg-[#0C0A09] text-white hover:bg-[#1C1917]"
              }`}
              data-testid="new-collection-btn"
              title={atLimit ? `Max ${MAX_COLLECTIONS} collections reached` : "New collection"}
            >
              <Plus className="w-4 h-4" />
              New Collection
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {schemas.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <Settings2 className="w-12 h-12 text-[#D6D3D1] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#0C0A09] mb-2">No collections yet</h3>
            <p className="text-[#A8A29E] mb-6">Create your first custom data collection to get started</p>
            <button
              onClick={openCreateDialog}
              className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Collection
            </button>
          </div>
        ) : (
          <>
            {schemas.length > 1 && (
              <p className="text-xs text-[#A8A29E] mb-3 flex items-center gap-1.5">
                <GripVertical className="w-3 h-3" />
                Drag cards to reorder — this updates the sidebar order too
              </p>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={schemas.map((s) => s.collection_name)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schemas.map((schema) => (
                    <SortableSchemaCard
                      key={schema.collection_name}
                      schema={schema}
                      onEdit={openEditDialog}
                      onRename={openRenameDialog}
                      onDuplicate={openDuplicateDialog}
                      onDelete={handleDelete}
                      atLimit={atLimit}
                      busyAction={busyAction}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {atLimit && (
              <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FDE047] rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#CA8A04] shrink-0 mt-0.5" />
                <div className="text-xs text-[#78350F]">
                  <p className="font-medium mb-0.5">Collection limit reached ({MAX_COLLECTIONS}/{MAX_COLLECTIONS})</p>
                  <p>Delete an existing collection to add a new one, or use duplicate to copy an existing schema.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Schema Create/Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSchema ? "Edit Collection Fields" : "Create New Collection"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Collection Name *</label>
                <input
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., products, categories"
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                  disabled={editingSchema !== null}
                  data-testid="input-collection-name"
                />
                <p className="text-xs text-[#A8A29E] mt-1">
                  {editingSchema ? "Use Rename to change this" : "Lowercase, underscores only"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., Products, Categories"
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                  data-testid="input-display-name"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[#0C0A09]">Fields ({fields.length}/20)</label>
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
                  <div key={field._key || `idx_${index}`} className="border border-[#E7E5E4] rounded-lg p-4 bg-[#FAFAFA]">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">Field Name *</label>
                            <input
                              value={field.field_name}
                              onChange={(e) => updateField(index, "field_name", e.target.value)}
                              placeholder="e.g., product_name, price"
                              className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">Field Type *</label>
                            <select
                              value={field.field_type}
                              onChange={(e) => updateField(index, "field_type", e.target.value)}
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

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={field.required} onChange={(e) => updateField(index, "required", e.target.checked)} className="rounded" />
                            Required
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked={field.unique} onChange={(e) => updateField(index, "unique", e.target.checked)} className="rounded" />
                            Unique (No duplicates)
                          </label>
                        </div>

                        {field.field_type === "dropdown" && (
                          <div>
                            <label className="block text-xs font-medium text-[#0C0A09] mb-1">Dropdown Options (comma-separated)</label>
                            <input
                              value={field.dropdown_options?.join(", ") || ""}
                              onChange={(e) => updateField(index, "dropdown_options", e.target.value.split(",").map((s) => s.trim()))}
                              placeholder="Option 1, Option 2, Option 3"
                              className="w-full border border-[#E7E5E4] rounded-lg px-2 py-1.5 text-sm outline-none"
                            />
                          </div>
                        )}

                        {(field.field_type === "text" || field.field_type === "textarea") && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">Min Length</label>
                              <input type="number" value={field.validation?.min_length || ""} onChange={(e) => updateValidation(index, "min_length", parseInt(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">Max Length</label>
                              <input type="number" value={field.validation?.max_length || ""} onChange={(e) => updateValidation(index, "max_length", parseInt(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none" />
                            </div>
                          </div>
                        )}

                        {field.field_type === "number" && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">Min Value</label>
                              <input type="number" value={field.validation?.min || ""} onChange={(e) => updateValidation(index, "min", parseFloat(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#57534E] mb-1">Max Value</label>
                              <input type="number" value={field.validation?.max || ""} onChange={(e) => updateValidation(index, "max", parseFloat(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded px-2 py-1 text-xs outline-none" />
                            </div>
                          </div>
                        )}
                      </div>

                      <button onClick={() => removeField(index)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-[#DC2626] flex-shrink-0" title="Remove field">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 border border-dashed border-[#E7E5E4] rounded-lg">
                  <p className="text-sm text-[#A8A29E]">No fields added yet. Click "Add Field" to start.</p>
                </div>
              )}
            </div>

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
            <button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || fields.length === 0 || !collectionName.trim()}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
              data-testid="save-schema-btn"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <Save className="w-4 h-4" />
              {editingSchema ? "Update Schema" : "Create Schema"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirm Update Dialog ─── */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#F59E0B]" />
              Confirm Schema Update
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-[#57534E]">You are about to update this schema. This may affect existing data:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-[#78716C]">
              <li>Adding new fields: Existing items won't have values for new fields</li>
              <li>Removing fields: Data in removed fields will be lost</li>
              <li>Changing field types: May cause data format issues</li>
            </ul>
          </div>
          <DialogFooter>
            <button onClick={() => setConfirmDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={saveSchema} disabled={saving} className="h-10 px-4 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#D97706] disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Yes, Update Schema
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Rename Dialog ─── */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Display Name</label>
              <input
                value={renameNewDisplay}
                onChange={(e) => setRenameNewDisplay(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                data-testid="rename-display-input"
              />
              <p className="text-xs text-[#A8A29E] mt-1">Shown in sidebar and page titles. Safe to change.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Internal Key</label>
              <input
                value={renameNewCollection}
                onChange={(e) => setRenameNewCollection(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                data-testid="rename-key-input"
              />
              <p className="text-xs text-[#A8A29E] mt-1">Lowercase, underscores. Used in URLs.</p>
            </div>
            {renameTarget && renameNewCollection.trim().toLowerCase().replace(/\s+/g, "_") !== renameTarget.collection_name && (
              <div className="flex items-start gap-3 p-3 bg-[#FEF3C7] border border-[#FDE047] rounded-lg">
                <AlertCircle className="w-4 h-4 text-[#CA8A04] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[#78350F]">
                  <p className="font-medium mb-0.5">Data migration will happen</p>
                  <p>All {renameTarget.item_count || 0} items in this collection will be re-tagged with the new key. URLs will change.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setRenameDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]">Cancel</button>
            <button
              onClick={handleRename}
              disabled={renaming}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
              data-testid="rename-confirm-btn"
            >
              {renaming && <Loader2 className="w-4 h-4 animate-spin" />}
              Rename
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Duplicate Dialog ─── */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Duplicate Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-[#57534E]">
              Create a copy of <span className="font-medium text-[#0C0A09]">{duplicateTarget?.display_name}</span>. Fields will be copied, but data will start empty.
            </p>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">New Display Name</label>
              <input
                value={duplicateNewDisplay}
                onChange={(e) => setDuplicateNewDisplay(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                data-testid="duplicate-display-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">New Internal Key</label>
              <input
                value={duplicateNewCollection}
                onChange={(e) => setDuplicateNewCollection(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                data-testid="duplicate-key-input"
              />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDuplicateDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]">Cancel</button>
            <button
              onClick={handleDuplicate}
              disabled={duplicating || !duplicateNewCollection.trim()}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
              data-testid="duplicate-confirm-btn"
            >
              {duplicating && <Loader2 className="w-4 h-4 animate-spin" />}
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

