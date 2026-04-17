import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus, Pencil, Trash2, Loader2, Search, Grid, List, AlertCircle,
  Upload, Filter, X, ChevronDown, Columns, Image as ImageIcon, Check
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DynamicFormField from "@/components/DynamicFormField";
import CSVUploadDialog from "@/components/CSVUploadDialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const TEXT_TYPES = ["text", "textarea", "email", "phone", "url"];

export default function DynamicCollectionPage() {
  const { agentId, collectionName } = useParams();
  const navigate = useNavigate();
  const [schema, setSchema] = useState(null);
  const [allSchemas, setAllSchemas] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({}); // { field_name: {...} }
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Column visibility (for table view) — persisted in localStorage
  const [visibleColumns, setVisibleColumns] = useState(null); // null until schema loaded
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef(null);

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch schemas and items
  const fetchData = useCallback(async () => {
    try {
      // Get agent's schemas
      const schemasRes = await axios.get(`${API}/api/agents/${agentId}/schemas`, {
        withCredentials: true,
      });

      setAllSchemas(schemasRes.data || []);

      if (schemasRes.data.length === 0) {
        setLoading(false);
        return;
      }

      // Find schema by collection name (if provided) or use first
      let targetSchema;
      if (collectionName) {
        targetSchema = schemasRes.data.find(s => s.collection_name === collectionName);
      }
      if (!targetSchema) {
        targetSchema = schemasRes.data[0];
      }
      
      setSchema(targetSchema);

      // Fetch items for this collection
      const itemsRes = await axios.get(
        `${API}/api/agents/${agentId}/collections/${targetSchema.collection_name}/items`,
        { withCredentials: true }
      );
      setItems(itemsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  }, [agentId, collectionName]);

  useEffect(() => {
    fetchData();
    // Reset filters/search when switching collection
    setSearch("");
    setActiveFilters({});
    setFilterOpen(false);
  }, [agentId, collectionName, fetchData]);

  // NOTE: localStorage here stores ONLY column-visibility preferences
  // (list of non-sensitive schema field names, e.g. ["name","price","sku"]).
  // No PII, tokens, or auth data is ever stored here. This is safe.
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
    } catch (e) { /* ignore */ }
    // Default: first 6 columns
    setVisibleColumns(schema.fields.slice(0, 6).map((f) => f.field_name));
  }, [schema, agentId]);

  // Persist visible columns
  useEffect(() => {
    if (!schema || !visibleColumns) return;
    const storageKey = `cols:${agentId}:${schema.collection_name}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
    } catch (e) { /* ignore */ }
  }, [visibleColumns, schema, agentId]);

  // Close switcher + columns menu on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) setSwitcherOpen(false);
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target)) setColumnsMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const switchCollection = (targetName) => {
    setSwitcherOpen(false);
    navigate(`/agent/${agentId}/collection/${targetName}`);
  };

  /* ───────── Filter logic ───────── */
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

  const updateFilter = (fieldName, patch) => {
    setActiveFilters((prev) => ({ ...prev, [fieldName]: { ...(prev[fieldName] || {}), ...patch } }));
  };
  const clearFilter = (fieldName) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };
  const clearAllFilters = () => setActiveFilters({});

  /* ───────── CRUD handlers ───────── */
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
      fetchData();
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
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete item");
    }
  };

  const updateFormField = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (formErrors[fieldName]) setFormErrors((prev) => ({ ...prev, [fieldName]: null }));
  };

  /* ───────── Column visibility ───────── */
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
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="dynamic-collection-page">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="min-w-0 flex-1">
            <div className="relative inline-block" ref={switcherRef}>
              <button
                onClick={() => setSwitcherOpen(!switcherOpen)}
                className="flex items-center gap-2 group"
                data-testid="collection-switcher-btn"
              >
                <h1 className="font-serif text-[28px] text-[#0C0A09] truncate">{schema.display_name}</h1>
                {allSchemas.length > 1 && (
                  <ChevronDown className={`w-5 h-5 text-[#57534E] group-hover:text-[#0C0A09] transition-transform ${switcherOpen ? "rotate-180" : ""}`} />
                )}
              </button>
              {switcherOpen && allSchemas.length > 1 && (
                <div
                  className="absolute top-full left-0 mt-2 w-72 bg-white border border-[#E7E5E4] rounded-xl shadow-lg z-20 overflow-hidden"
                  data-testid="collection-switcher-dropdown"
                >
                  <div className="px-3 py-2 border-b border-[#F5F5F4] bg-[#FAFAFA]">
                    <p className="text-[10px] font-medium tracking-wide text-[#A8A29E] uppercase">Switch Collection</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-1">
                    {allSchemas.map((s) => {
                      const isActive = s.collection_name === schema.collection_name;
                      return (
                        <button
                          key={s.collection_name}
                          onClick={() => switchCollection(s.collection_name)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-[#FAFAFA] transition-colors flex items-center justify-between gap-2 ${
                            isActive ? "bg-[#F5F0EB]" : ""
                          }`}
                          data-testid={`switch-to-${s.collection_name}`}
                        >
                          <div className="min-w-0">
                            <p className={`text-sm truncate ${isActive ? "font-medium text-[#0C0A09]" : "text-[#57534E]"}`}>
                              {s.display_name}
                            </p>
                            <p className="text-xs text-[#A8A29E] font-mono truncate">{s.collection_name}</p>
                          </div>
                          <span className="text-xs text-[#A8A29E] bg-[#F5F5F4] rounded-full px-2 py-0.5 shrink-0">
                            {s.item_count ?? 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-[#57534E] mt-1">
              {filteredItems.length === items.length
                ? `${items.length} ${items.length === 1 ? "item" : "items"}`
                : `${filteredItems.length} of ${items.length} ${items.length === 1 ? "item" : "items"}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center border border-[#E7E5E4] rounded-lg bg-white" data-testid="view-toggle">
              <button
                onClick={() => setView("table")}
                className={`h-10 px-3 rounded-l-lg flex items-center gap-2 ${
                  view === "table" ? "bg-[#F5F0EB] text-[#0C0A09]" : "text-[#57534E] hover:bg-[#FAFAFA]"
                }`}
                title="Table view"
                data-testid="view-toggle-table"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("card")}
                className={`h-10 px-3 rounded-r-lg flex items-center gap-2 ${
                  view === "card" ? "bg-[#F5F0EB] text-[#0C0A09]" : "text-[#57534E] hover:bg-[#FAFAFA]"
                }`}
                title="Card view"
                data-testid="view-toggle-card"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            {/* Columns visibility (only in table view) */}
            {view === "table" && (
              <div className="relative" ref={columnsMenuRef}>
                <button
                  onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
                  className="h-10 px-3 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2"
                  data-testid="columns-toggle-btn"
                >
                  <Columns className="w-4 h-4" />
                  Columns
                  <span className="text-xs text-[#A8A29E]">
                    {visibleColumns?.length ?? 0}/{schema.fields.length}
                  </span>
                </button>
                {columnsMenuOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#E7E5E4] rounded-xl shadow-lg z-20 overflow-hidden"
                    data-testid="columns-popover"
                  >
                    <div className="px-3 py-2 border-b border-[#F5F5F4] bg-[#FAFAFA] flex items-center justify-between">
                      <p className="text-[10px] font-medium tracking-wide text-[#A8A29E] uppercase">Visible Columns</p>
                      <div className="flex items-center gap-1">
                        <button onClick={showAllColumns} className="text-[10px] text-[#57534E] hover:text-[#0C0A09] underline">All</button>
                        <button onClick={resetColumnsDefault} className="text-[10px] text-[#57534E] hover:text-[#0C0A09] underline">Reset</button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
                      {schema.fields.map((f) => {
                        const checked = visibleColumns?.includes(f.field_name);
                        return (
                          <label
                            key={f.field_name}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-[#FAFAFA] cursor-pointer"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? "bg-[#0C0A09] border-[#0C0A09]" : "border-[#D6D3D1] bg-white"}`}>
                              {checked && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <input
                              type="checkbox"
                              checked={!!checked}
                              onChange={() => toggleColumn(f.field_name)}
                              className="hidden"
                            />
                            <span className="text-sm text-[#0C0A09] flex-1 truncate">{humanizeName(f.field_name)}</span>
                            <span className="text-[10px] text-[#A8A29E]">{f.field_type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`h-10 px-3 border rounded-lg text-sm font-medium flex items-center gap-2 ${
                filterOpen || activeFilterCount > 0
                  ? "bg-[#F5F0EB] border-[#E7E5E4] text-[#0C0A09]"
                  : "bg-white border-[#E7E5E4] text-[#0C0A09] hover:bg-[#FAFAFA]"
              }`}
              data-testid="filter-toggle-btn"
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-[#0C0A09] text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCsvDialogOpen(true)}
              className="h-10 px-4 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              CSV Upload
            </button>

            <button
              onClick={openCreateDialog}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"
              data-testid="add-item-btn"
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
            placeholder="Search all fields…"
            className="w-full h-10 pl-10 pr-10 border border-[#E7E5E4] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1C1917] bg-white"
            data-testid="search-input"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#0C0A09]"
              data-testid="clear-search-btn"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {filterOpen && (
          <div className="mt-3 bg-white border border-[#E7E5E4] rounded-xl p-4" data-testid="filter-panel">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium tracking-wide text-[#57534E] uppercase">Advanced Filters</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#DC2626] hover:underline"
                  data-testid="clear-all-filters-btn"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {schema.fields.map((field) => (
                <FilterControl
                  key={field.field_name}
                  field={field}
                  value={activeFilters[field.field_name]}
                  onChange={(patch) => updateFilter(field.field_name, patch)}
                  onClear={() => clearFilter(field.field_name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap" data-testid="active-filter-chips">
            {Object.entries(activeFilters).map(([fieldName, f]) => {
              const field = schema.fields.find((x) => x.field_name === fieldName);
              if (!field) return null;
              const chipText = describeFilter(field, f);
              if (!chipText) return null;
              return (
                <span
                  key={fieldName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F5F0EB] border border-[#E7E5E4] rounded-full text-xs text-[#0C0A09]"
                >
                  <span className="font-medium">{humanizeName(fieldName)}:</span>
                  <span className="text-[#57534E]">{chipText}</span>
                  <button onClick={() => clearFilter(fieldName)} className="ml-0.5 text-[#78716C] hover:text-[#0C0A09]">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <p className="text-[#A8A29E]">
              {items.length === 0
                ? `No ${schema.display_name.toLowerCase()} yet. Click "Add" to create your first item.`
                : "No items match your search or filters."}
            </p>
            {(search || activeFilterCount > 0) && items.length > 0 && (
              <button
                onClick={() => { setSearch(""); clearAllFilters(); }}
                className="mt-3 text-sm text-[#0C0A09] underline hover:no-underline"
              >
                Clear search & filters
              </button>
            )}
          </div>
        ) : view === "table" ? (
          <TableView
            items={filteredItems}
            schema={schema}
            visibleColumns={visibleColumns || []}
            onEdit={openEditDialog}
            onDelete={handleDelete}
          />
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

      <CSVUploadDialog
        open={csvDialogOpen}
        onClose={() => setCsvDialogOpen(false)}
        agentId={agentId}
        collectionName={schema.collection_name}
        onSuccess={fetchData}
      />
    </div>
  );
}

/* ───────── Filter Control (per-field input) ───────── */
function FilterControl({ field, value, onChange, onClear }) {
  const label = humanizeName(field.field_name);
  const hasValue = value && (value.text || value.value || value.min || value.max || value.from || value.to);

  const baseWrapper = "border border-[#E7E5E4] rounded-lg p-3 bg-[#FAFAFA]";

  if (TEXT_TYPES.includes(field.field_type)) {
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <input
          type="text"
          value={value?.text || ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Contains…"
          className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
          data-testid={`filter-${field.field_name}`}
        />
      </div>
    );
  }

  if (field.field_type === "number") {
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value?.min ?? ""}
            onChange={(e) => onChange({ min: e.target.value })}
            placeholder="Min"
            className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
            data-testid={`filter-${field.field_name}-min`}
          />
          <span className="text-xs text-[#A8A29E]">–</span>
          <input
            type="number"
            value={value?.max ?? ""}
            onChange={(e) => onChange({ max: e.target.value })}
            placeholder="Max"
            className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
            data-testid={`filter-${field.field_name}-max`}
          />
        </div>
      </div>
    );
  }

  if (field.field_type === "date") {
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value?.from || ""}
            onChange={(e) => onChange({ from: e.target.value })}
            className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
            data-testid={`filter-${field.field_name}-from`}
          />
          <span className="text-xs text-[#A8A29E]">–</span>
          <input
            type="date"
            value={value?.to || ""}
            onChange={(e) => onChange({ to: e.target.value })}
            className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
            data-testid={`filter-${field.field_name}-to`}
          />
        </div>
      </div>
    );
  }

  if (field.field_type === "dropdown") {
    const opts = field.dropdown_options || [];
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <select
          value={value?.value || ""}
          onChange={(e) => onChange({ value: e.target.value })}
          className="w-full h-9 px-2 border border-[#E7E5E4] bg-white rounded-md text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
          data-testid={`filter-${field.field_name}`}
        >
          <option value="">Any</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.field_type === "checkbox") {
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <div className="flex items-center gap-1 bg-white rounded-md border border-[#E7E5E4] p-0.5">
          {[
            { v: "any", l: "Any" },
            { v: "yes", l: "Yes" },
            { v: "no", l: "No" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => onChange({ value: opt.v })}
              className={`flex-1 h-8 text-xs rounded ${
                (value?.value || "any") === opt.v ? "bg-[#0C0A09] text-white" : "text-[#57534E] hover:bg-[#FAFAFA]"
              }`}
              data-testid={`filter-${field.field_name}-${opt.v}`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.field_type === "image") {
    return (
      <div className={baseWrapper}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium text-[#0C0A09]">{label}</label>
          {hasValue && <button onClick={onClear} className="text-[10px] text-[#78716C] hover:text-[#DC2626]">clear</button>}
        </div>
        <div className="flex items-center gap-1 bg-white rounded-md border border-[#E7E5E4] p-0.5">
          {[
            { v: "any", l: "Any" },
            { v: "has", l: "Has images" },
            { v: "none", l: "No images" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => onChange({ value: opt.v })}
              className={`flex-1 h-8 text-xs rounded ${
                (value?.value || "any") === opt.v ? "bg-[#0C0A09] text-white" : "text-[#57534E] hover:bg-[#FAFAFA]"
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

/* ───────── Table View ───────── */
function TableView({ items, schema, visibleColumns, onEdit, onDelete }) {
  const cols = schema.fields.filter((f) => visibleColumns.includes(f.field_name));

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden" data-testid="table-view">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          <thead className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
            <tr>
              {cols.map((field) => (
                <th key={field.field_name} className="px-4 py-3 text-left text-xs font-medium text-[#57534E] whitespace-nowrap">
                  {humanizeName(field.field_name)}
                  {field.required && <span className="text-[#DC2626] ml-0.5">*</span>}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-[#57534E] sticky right-0 bg-[#FAFAFA]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E7E5E4]">
            {items.map((item) => (
              <tr key={item.item_id} className="hover:bg-[#FAFAFA]">
                {cols.map((field) => (
                  <td key={field.field_name} className="px-4 py-3 text-sm text-[#0C0A09] max-w-xs">
                    <div className="truncate">{renderCellValue(item.data?.[field.field_name], field.field_type)}</div>
                  </td>
                ))}
                <td className="px-4 py-3 text-right sticky right-0 bg-white">
                  <button
                    onClick={() => onEdit(item)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#F5F5F4] text-[#57534E]"
                    data-testid={`edit-item-${item.item_id}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.item_id)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-[#F5F5F4] text-[#DC2626] ml-1"
                    data-testid={`delete-item-${item.item_id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cols.length === 0 && (
        <div className="p-6 text-center text-sm text-[#A8A29E]">
          No columns selected. Use the "Columns" menu to show fields.
        </div>
      )}
    </div>
  );
}

/* ───────── Card View ───────── */
function CardView({ items, schema, onEdit, onDelete }) {
  const imageField = schema.fields.find((f) => f.field_type === "image");
  // Key fields: first 4 non-image, non-textarea-heavy fields
  const keyFields = schema.fields.filter((f) => f.field_type !== "image").slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="card-view">
      {items.map((item) => {
        const raw = imageField ? item.data?.[imageField.field_name] : null;
        const images = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const imageUrl = images[0] ? resolveImageUrl(images[0]) : null;

        return (
          <div
            key={item.item_id}
            className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
          >
            {imageField ? (
              <div className="aspect-video bg-[#F5F5F4] relative">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D6D3D1]">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                {images.length > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] rounded-full px-2 py-0.5 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {images.length}
                  </span>
                )}
              </div>
            ) : null}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex-1">
                {keyFields.map((field) => {
                  const value = item.data?.[field.field_name];
                  if (value === undefined || value === null || value === "") return null;
                  return (
                    <div key={field.field_name} className="mb-2">
                      <p className="text-xs text-[#A8A29E] mb-0.5">{humanizeName(field.field_name)}</p>
                      <p className="text-sm text-[#0C0A09] font-medium line-clamp-1">
                        {renderCellValue(value, field.field_type)}
                      </p>
                    </div>
                  );
                })}
              </div>
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

/* ───────── Helpers ───────── */
function humanizeName(name) {
  return String(name || "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function resolveImageUrl(src) {
  if (!src) return null;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/")) return `${API}${src}`;
  return src;
}

function renderCellValue(value, fieldType) {
  if (value === null || value === undefined || value === "") return "-";

  switch (fieldType) {
    case "checkbox":
      return value ? "Yes" : "No";
    case "image": {
      const images = Array.isArray(value) ? value : [value];
      return images.length > 0 ? `${images.length} image${images.length === 1 ? "" : "s"}` : "-";
    }
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "date":
      return new Date(value).toLocaleDateString();
    case "textarea":
      return String(value).substring(0, 100) + (String(value).length > 100 ? "…" : "");
    default:
      return String(value).substring(0, 80) + (String(value).length > 80 ? "…" : "");
  }
}

function describeFilter(field, f) {
  if (!f) return null;
  if (TEXT_TYPES.includes(field.field_type)) return f.text ? `"${f.text}"` : null;
  if (field.field_type === "number") {
    const min = f.min !== undefined && f.min !== "" ? f.min : null;
    const max = f.max !== undefined && f.max !== "" ? f.max : null;
    if (min === null && max === null) return null;
    if (min !== null && max !== null) return `${min} – ${max}`;
    if (min !== null) return `≥ ${min}`;
    return `≤ ${max}`;
  }
  if (field.field_type === "date") {
    if (f.from && f.to) return `${f.from} → ${f.to}`;
    if (f.from) return `from ${f.from}`;
    if (f.to) return `until ${f.to}`;
    return null;
  }
  if (field.field_type === "dropdown") return f.value || null;
  if (field.field_type === "checkbox") return !f.value || f.value === "any" ? null : f.value === "yes" ? "Yes" : "No";
  if (field.field_type === "image") return !f.value || f.value === "any" ? null : f.value === "has" ? "Has images" : "No images";
  return null;
}
