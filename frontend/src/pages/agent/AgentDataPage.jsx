import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Upload, Download, Loader2, Search, X,
  Check, ChevronDown, AlertTriangle, CheckCircle, Database,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getBizConfig } from "@/config/businessTypes";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function DataManagementPage() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [schema, setSchema] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Bulk
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvParsing, setCsvParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileRef = useRef(null);

  // Selection for bulk delete
  const [selected, setSelected] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [agentRes, dataRes] = await Promise.all([
        axios.get(`${API}/api/agents/${agentId}`, { withCredentials: true }),
        axios.get(`${API}/api/agents/${agentId}/business-data`, { withCredentials: true }),
      ]);
      setAgent(agentRes.data);
      setItems(dataRes.data);
      const bType = agentRes.data.business_type;
      if (bType) {
        try {
          const schemaRes = await axios.get(`${API}/api/business-types/${bType}/schema`, { withCredentials: true });
          setSchema(schemaRes.data);
        } catch {}
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [agentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const bizConfig = getBizConfig(agent?.business_type);
  const fields = schema?.fields || [];
  const dataLabel = bizConfig?.dataLabel || "Data";

  // Form helpers
  const openCreate = () => {
    setEditingItem(null);
    const empty = {};
    fields.forEach(f => { empty[f.key] = f.default || (f.type === "number" ? 0 : ""); });
    setForm(empty);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    const data = {};
    fields.forEach(f => { data[f.key] = item[f.key] !== undefined ? item[f.key] : (f.default || ""); });
    setForm(data);
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingItem) {
        const { data } = await axios.put(`${API}/api/agents/${agentId}/business-data/${editingItem.item_id}`, form, { withCredentials: true });
        setItems(prev => prev.map(i => i.item_id === editingItem.item_id ? data : i));
      } else {
        const { data } = await axios.post(`${API}/api/agents/${agentId}/business-data`, form, { withCredentials: true });
        setItems(prev => [...prev, data]);
      }
      setFormOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (itemId) => {
    try {
      await axios.delete(`${API}/api/agents/${agentId}/business-data/${itemId}`, { withCredentials: true });
      setItems(prev => prev.filter(i => i.item_id !== itemId));
      setSelected(prev => { const n = new Set(prev); n.delete(itemId); return n; });
    } catch {}
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    try {
      await axios.post(`${API}/api/agents/${agentId}/business-data/bulk-delete`, { item_ids: Array.from(selected) }, { withCredentials: true });
      setItems(prev => prev.filter(i => !selected.has(i.item_id)));
      setSelected(new Set());
    } catch {}
  };

  // CSV
  const downloadTemplate = () => {
    window.open(`${API}/api/agents/${agentId}/business-data/csv-template`, "_blank");
  };

  const handleCsvFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvParsing(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { setCsvParsing(false); return; }
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        const obj = {};
        headers.forEach((h, idx) => {
          const field = fields.find(f => f.key === h);
          let val = vals[idx] || "";
          if (field?.type === "number" && val) val = Number(val);
          obj[h] = val;
        });
        rows.push(obj);
      }
      setCsvData(rows);
      setCsvParsing(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkUpload = async () => {
    if (csvData.length === 0) return;
    setUploading(true);
    try {
      const { data } = await axios.post(`${API}/api/agents/${agentId}/business-data/bulk`, { items: csvData }, { withCredentials: true });
      setUploadResult({ success: true, count: data.count });
      setItems(prev => [...prev, ...(data.items || [])]);
      setCsvData([]);
      setTimeout(() => { setCsvOpen(false); setUploadResult(null); }, 2000);
    } catch (err) {
      setUploadResult({ success: false, error: err.response?.data?.detail || "Upload failed" });
    }
    finally { setUploading(false); }
  };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === filteredItems.length ? new Set() : new Set(filteredItems.map(i => i.item_id)));

  // Filter
  const filteredItems = items.filter(item => {
    if (!search) return true;
    const s = search.toLowerCase();
    return fields.some(f => String(item[f.key] || "").toLowerCase().includes(s));
  });

  // Display columns (first 5 for table)
  const displayFields = fields.slice(0, 6);

  if (loading) return <div className="p-8 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin text-[#A8A29E]" /><span className="text-sm text-[#57534E]">Loading...</span></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="data-management-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">{dataLabel}</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{items.length} items · {agent?.business_type}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setCsvOpen(true)} data-testid="btn-csv-upload" className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-sm text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" /> CSV Upload
          </button>
          <button onClick={downloadTemplate} data-testid="btn-download-template" className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-sm text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Template
          </button>
          <button onClick={openCreate} data-testid="btn-add-item" className="h-9 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add {dataLabel.replace(/s$/, "")}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 bg-[#F5F5F4] rounded-lg border-0 pl-9 pr-3 text-sm outline-none" placeholder={`Search ${dataLabel.toLowerCase()}...`} />
        </div>
        {selected.size > 0 && (
          <button onClick={handleBulkDelete} className="h-9 px-3 bg-[#991B1B] text-white rounded-lg text-xs font-medium hover:bg-[#7F1D1D] flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Delete {selected.size} selected
          </button>
        )}
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
          <Database className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#0C0A09]">{items.length === 0 ? `No ${dataLabel.toLowerCase()} yet` : "No results"}</h3>
          <p className="text-sm text-[#57534E] mt-1 mb-4">{items.length === 0 ? "Add items manually or upload a CSV file." : "Try a different search."}</p>
          {items.length === 0 && (
            <div className="flex gap-2 justify-center">
              <button onClick={openCreate} className="h-9 px-4 bg-[#0C0A09] text-white rounded-lg text-sm">Add Manually</button>
              <button onClick={() => setCsvOpen(true)} className="h-9 px-4 border border-[#E7E5E4] rounded-lg text-sm">CSV Upload</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                  <th className="w-10 px-3 py-3"><input type="checkbox" checked={selected.size === filteredItems.length && filteredItems.length > 0} onChange={toggleAll} className="rounded border-[#D6D3D1]" /></th>
                  {displayFields.map(f => (
                    <th key={f.key} className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium whitespace-nowrap">{f.label}</th>
                  ))}
                  <th className="w-20 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.item_id} className={`border-b border-[#F5F5F4] hover:bg-[#FAFAFA] transition-colors ${selected.has(item.item_id) ? "bg-[#FEFCE8]" : ""}`}>
                    <td className="w-10 px-3 py-3"><input type="checkbox" checked={selected.has(item.item_id)} onChange={() => toggleSelect(item.item_id)} className="rounded border-[#D6D3D1]" /></td>
                    {displayFields.map(f => (
                      <td key={f.key} className="px-4 py-3 text-sm text-[#0C0A09] max-w-[200px] truncate">
                        {f.type === "select" ? (
                          <span className={`inline-flex items-center text-xs rounded-full px-2 py-0.5 ${String(item[f.key]) === "available" || String(item[f.key]) === "in_stock" ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#F5F5F4] text-[#57534E]"}`}>{String(item[f.key] || "—")}</span>
                        ) : f.type === "number" ? (
                          <span className="font-medium">{Number(item[f.key] || 0).toLocaleString()}</span>
                        ) : (
                          String(item[f.key] || "—")
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 text-[#A8A29E] hover:text-[#0C0A09] hover:bg-[#F5F5F4] rounded"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(item.item_id)} className="p-1.5 text-[#A8A29E] hover:text-[#991B1B] hover:bg-[#FEF2F2] rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="item-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingItem ? "Edit" : "Add"} {dataLabel.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1">{f.label}{f.required && " *"}</label>
                {f.type === "textarea" ? (
                  <textarea value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none" />
                ) : f.type === "select" ? (
                  <select value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none">
                    <option value="">Select...</option>
                    {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "number" ? (
                  <input type="number" value={form[f.key] || 0} onChange={e => setForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
                ) : (
                  <input value={form[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setFormOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleSave} disabled={saving} data-testid="save-item-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingItem ? "Update" : "Add"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Dialog */}
      <Dialog open={csvOpen} onOpenChange={(o) => { setCsvOpen(o); if (!o) { setCsvData([]); setUploadResult(null); } }}>
        <DialogContent className="sm:max-w-lg" data-testid="csv-upload-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">CSV Upload</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={downloadTemplate} className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-sm text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download Template
              </button>
              <span className="text-xs text-[#A8A29E]">Use this template for correct format</span>
            </div>

            <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-[#E7E5E4] rounded-xl cursor-pointer hover:border-[#A8A29E] transition-colors">
              <Upload className="w-6 h-6 text-[#A8A29E]" />
              <span className="text-sm text-[#57534E]">Click to select CSV file</span>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvFile} className="hidden" />
            </label>

            {csvParsing && <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Parsing...</span></div>}

            {csvData.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0C0A09]">{csvData.length} rows parsed</span>
                  <button onClick={() => setCsvData([])} className="text-xs text-[#A8A29E] hover:text-[#991B1B]">Clear</button>
                </div>
                <div className="max-h-40 overflow-auto border border-[#E7E5E4] rounded-lg">
                  <table className="w-full text-xs">
                    <thead><tr className="bg-[#FAFAFA]">{Object.keys(csvData[0]).slice(0, 4).map(k => <th key={k} className="text-left px-2 py-1.5 text-[#A8A29E] font-medium">{k}</th>)}{Object.keys(csvData[0]).length > 4 && <th className="px-2 py-1.5 text-[#A8A29E]">...</th>}</tr></thead>
                    <tbody>{csvData.slice(0, 5).map((row, i) => <tr key={i} className="border-t border-[#F5F5F4]">{Object.values(row).slice(0, 4).map((v, j) => <td key={j} className="px-2 py-1.5 text-[#57534E] truncate max-w-[120px]">{String(v)}</td>)}{Object.keys(row).length > 4 && <td className="px-2 py-1.5 text-[#A8A29E]">...</td>}</tr>)}</tbody>
                  </table>
                  {csvData.length > 5 && <div className="text-center py-1 text-[10px] text-[#A8A29E]">...and {csvData.length - 5} more rows</div>}
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${uploadResult.success ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#991B1B]"}`}>
                {uploadResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="text-sm">{uploadResult.success ? `Uploaded ${uploadResult.count} items!` : uploadResult.error}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCsvOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleBulkUpload} disabled={uploading || csvData.length === 0} data-testid="confirm-csv-upload" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Upload ${csvData.length} items`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
