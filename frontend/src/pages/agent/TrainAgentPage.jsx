import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, HelpCircle, FileText, ShoppingBag, MessageSquare, Plus, Pencil, Trash2,
  CloudUpload, Globe, Loader2, CheckCircle, X, Upload, Download, Send,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

/* ─── Business Info Tab ─── */
function BusinessInfoTab({ agentId }) {
  const [info, setInfo] = useState({ description: "", contact_phone: "", contact_email: "", address: "", response_tone: "friendly", response_language: "english", business_hours: {} });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => { try { const { data } = await axios.get(`${API}/api/agents/${agentId}/training/business-info`, { withCredentials: true }); if (data) setInfo(prev => ({ ...prev, ...data })); } catch (err) { console.error("Failed to load business-info", err); } })();
  }, [agentId]);

  const save = async () => {
    setSaving(true);
    try { await axios.put(`${API}/api/agents/${agentId}/training/business-info`, info, { withCredentials: true }); setSaved(true); setTimeout(() => setSaved(false), 2000); } catch {}
    finally { setSaving(false); }
  };
  const set = (k, v) => setInfo(p => ({ ...p, [k]: v }));
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const toggleDay = (day) => { const hrs = { ...info.business_hours }; if (hrs[day]) { delete hrs[day]; } else { hrs[day] = { open: "09:00", close: "18:00" }; } set("business_hours", hrs); };

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 lg:p-8 max-w-3xl" data-testid="business-info-tab">
      <h3 className="text-lg font-semibold text-[#0C0A09] mb-4">About your business</h3>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Business Description</label><textarea data-testid="biz-description" rows={4} value={info.description} onChange={e => set("description", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" placeholder="Describe your business and what you offer..." /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Contact Phone</label><input data-testid="biz-phone" value={info.contact_phone} onChange={e => set("contact_phone", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Contact Email</label><input data-testid="biz-email" value={info.contact_email} onChange={e => set("contact_email", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
        </div>
        <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Address</label><input data-testid="biz-address" value={info.address} onChange={e => set("address", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
      </div>
      <h3 className="text-lg font-semibold text-[#0C0A09] mt-8 mb-4">Business Hours</h3>
      <div className="space-y-2">{DAYS.map(day => (<div key={day} className="flex items-center gap-4 h-10"><span className="w-24 text-sm text-[#57534E]">{day}</span><Switch checked={!!info.business_hours[day]} onCheckedChange={() => toggleDay(day)} /><AnimatePresence>{info.business_hours[day] && (<motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex items-center gap-2 overflow-hidden"><input type="time" value={info.business_hours[day]?.open || "09:00"} onChange={e => set("business_hours", { ...info.business_hours, [day]: { ...info.business_hours[day], open: e.target.value } })} className="border border-[#E7E5E4] rounded-lg px-2 py-1 text-sm" /><span className="text-xs text-[#A8A29E]">to</span><input type="time" value={info.business_hours[day]?.close || "18:00"} onChange={e => set("business_hours", { ...info.business_hours, [day]: { ...info.business_hours[day], close: e.target.value } })} className="border border-[#E7E5E4] rounded-lg px-2 py-1 text-sm" /></motion.div>)}</AnimatePresence></div>))}</div>
      <h3 className="text-lg font-semibold text-[#0C0A09] mt-8 mb-4">AI Tone</h3>
      <div className="grid grid-cols-3 gap-3">{["professional", "friendly", "casual"].map(tone => (<button key={tone} data-testid={`tone-${tone}`} onClick={() => set("response_tone", tone)} className={`border rounded-xl p-4 text-left transition-colors ${info.response_tone === tone ? "border-[#0C0A09] bg-[#F5F0EB]" : "border-[#E7E5E4] hover:bg-[#FAFAFA]"}`}><p className="text-sm font-medium text-[#0C0A09] capitalize">{tone}</p><p className="text-xs text-[#57534E] mt-0.5">{tone === "professional" ? "Formal and business-like" : tone === "friendly" ? "Warm and approachable" : "Relaxed and conversational"}</p></button>))}</div>
      <h3 className="text-lg font-semibold text-[#0C0A09] mt-8 mb-4">Response Language</h3>
      <div className="flex gap-2">{["english", "nepali", "both"].map(lang => (<button key={lang} data-testid={`lang-${lang}`} onClick={() => set("response_language", lang)} className={`px-4 py-2 rounded-full text-sm transition-colors ${info.response_language === lang ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]"}`}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</button>))}</div>
      <div className="mt-8 flex items-center gap-3"><button data-testid="save-business-info" onClick={save} disabled={saving} className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}</button>{saved && <span className="text-xs text-[#166534] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}</div>
    </div>
  );
}

/* ─── FAQs Tab with Bulk Upload ─── */
function FAQsTab({ agentId }) {
  const [faqs, setFaqs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchFaqs = async () => { try { const { data } = await axios.get(`${API}/api/agents/${agentId}/training/faqs`, { withCredentials: true }); setFaqs(data); } catch {} };
  useEffect(() => { fetchFaqs(); }, [agentId]);

  const openCreate = () => { setEditFaq(null); setQ(""); setA(""); setDialogOpen(true); };
  const openEdit = (faq) => { setEditFaq(faq); setQ(faq.question); setA(faq.answer); setDialogOpen(true); };

  const handleSave = async () => {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    try {
      if (editFaq) { await axios.put(`${API}/api/agents/${agentId}/training/faqs/${editFaq.faq_id}`, { question: q, answer: a }, { withCredentials: true }); }
      else { await axios.post(`${API}/api/agents/${agentId}/training/faqs`, { question: q, answer: a }, { withCredentials: true }); }
      setDialogOpen(false); fetchFaqs();
    } catch (err) { console.error("Save failed", err); } finally { setSaving(false); }
  };

  const handleDelete = async (faqId) => { try { await axios.delete(`${API}/api/agents/${agentId}/training/faqs/${faqId}`, { withCredentials: true }); fetchFaqs(); } catch (err) { console.error("Failed to delete FAQ", err); } };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const faqsData = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 2) {
        faqsData.push({ question: parts[0].replace(/"/g, "").trim(), answer: parts.slice(1).join(",").replace(/"/g, "").trim() });
      }
    }
    if (faqsData.length > 0) {
      try { await axios.post(`${API}/api/agents/${agentId}/training/faqs/bulk`, { faqs: faqsData }, { withCredentials: true }); fetchFaqs(); } catch (err) { console.error("Failed to bulk-upload FAQs", err); }
    }
    setImporting(false);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "question,answer\n\"What are your business hours?\",\"We are open Monday to Friday, 9 AM to 6 PM.\"\n\"Do you deliver?\",\"Yes, we deliver across Kathmandu valley.\"";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "faqs_template.csv"; a.click();
  };

  return (
    <div data-testid="faqs-tab">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-[#57534E]">{faqs.length} FAQs</p>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} data-testid="download-faq-template" className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-xs text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Template</button>
          <label className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-xs text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> {importing ? "Importing..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" data-testid="faq-csv-input" />
          </label>
          <button data-testid="add-faq-btn" onClick={openCreate} className="h-9 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"><Plus className="w-4 h-4" /> Add FAQ</button>
        </div>
      </div>
      {faqs.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E7E5E4] rounded-xl"><HelpCircle className="w-8 h-8 text-[#A8A29E] mx-auto" /><p className="text-sm text-[#57534E] mt-3">No FAQs yet. Add questions or import from CSV.</p></div>
      ) : (
        <div className="space-y-2">{faqs.map(faq => (<div key={faq.faq_id} data-testid={`faq-item-${faq.faq_id}`} className="bg-white border border-[#E7E5E4] rounded-xl p-4 group"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#0C0A09]">{faq.question}</p><p className="text-sm text-[#57534E] mt-1 line-clamp-2">{faq.answer}</p></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-3"><button onClick={() => openEdit(faq)} className="p-1.5 text-[#A8A29E] hover:text-[#0C0A09]"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(faq.faq_id)} className="p-1.5 text-[#A8A29E] hover:text-[#991B1B]"><Trash2 className="w-3.5 h-3.5" /></button></div></div></div>))}</div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-lg" data-testid="faq-dialog"><DialogHeader><DialogTitle className="font-serif text-xl">{editFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Question</label><textarea data-testid="faq-question" rows={2} value={q} onChange={e => setQ(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" /><p className="text-xs text-[#A8A29E] mt-1">{q.length} characters</p></div><div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Answer</label><textarea data-testid="faq-answer" rows={4} value={a} onChange={e => setA(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" /><p className="text-xs text-[#A8A29E] mt-1">{a.length} characters</p></div></div><DialogFooter className="gap-2"><button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm">Cancel</button><button data-testid="save-faq-btn" onClick={handleSave} disabled={saving || !q.trim() || !a.trim()} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save FAQ"}</button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

/* ─── Documents Tab ─── */
function DocumentsTab({ agentId }) {
  const [docs, setDocs] = useState([]);
  const [url, setUrl] = useState("");
  const fetchDocs = async () => { try { const { data } = await axios.get(`${API}/api/agents/${agentId}/training/documents`, { withCredentials: true }); setDocs(data); } catch (err) { console.error("Failed to load documents", err); } };
  useEffect(() => { fetchDocs(); }, [agentId]);
  const handleUpload = async (e) => { const files = e.target.files; if (!files) return; for (const file of files) { await axios.post(`${API}/api/agents/${agentId}/training/documents`, { name: file.name, doc_type: "file", size: file.size }, { withCredentials: true }); } fetchDocs(); };
  const handleScrape = async () => { if (!url.trim()) return; await axios.post(`${API}/api/agents/${agentId}/training/documents`, { name: url, doc_type: "url", url }, { withCredentials: true }); setUrl(""); fetchDocs(); };
  const handleDelete = async (docId) => { await axios.delete(`${API}/api/agents/${agentId}/training/documents/${docId}`, { withCredentials: true }); fetchDocs(); };

  return (
    <div data-testid="documents-tab">
      <label className="block border-2 border-dashed border-[#D6D3D1] rounded-2xl p-12 text-center bg-[#FAFAFA] hover:bg-[#F5F0EB] hover:border-[#A8A29E] transition-colors cursor-pointer"><CloudUpload className="w-12 h-12 text-[#D6D3D1] mx-auto" /><p className="text-base text-[#57534E] mt-3">Drop files here or click to browse</p><p className="text-xs text-[#A8A29E] mt-1">PDF, DOCX, TXT, CSV, XLSX - max 10MB each</p><input type="file" multiple accept=".pdf,.docx,.txt,.csv,.xlsx" onChange={handleUpload} className="hidden" data-testid="doc-upload-input" /></label>
      <div className="mt-4 flex gap-2"><div className="flex-1 relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" /><input data-testid="scrape-url" value={url} onChange={e => setUrl(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Or scrape a website URL" onKeyDown={e => e.key === "Enter" && handleScrape()} /></div><button data-testid="scrape-btn" onClick={handleScrape} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA]">Scrape</button></div>
      {docs.length > 0 && (<div className="mt-6 space-y-2">{docs.map(doc => (<div key={doc.doc_id} data-testid={`doc-item-${doc.doc_id}`} className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center gap-4"><FileText className="w-5 h-5 text-[#57534E] shrink-0" /><div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#0C0A09] truncate">{doc.name}</p><p className="text-xs text-[#A8A29E]">{doc.doc_type} {doc.size ? `- ${(doc.size / 1024).toFixed(1)}KB` : ""}</p></div><span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 bg-[#F0FDF4] text-[#166534]"><CheckCircle className="w-3 h-3" /> Ready</span><button onClick={() => handleDelete(doc.doc_id)} className="p-1.5 text-[#A8A29E] hover:text-[#991B1B]"><Trash2 className="w-3.5 h-3.5" /></button></div>))}</div>)}
    </div>
  );
}

/* ─── Products Tab with Detailed Form + Bulk Upload ─── */
function ProductsTab({ agentId }) {
  const [products, setProducts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", price: 0, stock: 0, category: "", description: "", image_url: "", sku: "", variants: [] });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchProducts = async () => { try { const { data } = await axios.get(`${API}/api/agents/${agentId}/training/products`, { withCredentials: true }); setProducts(data); } catch (err) { console.error("Failed to load products", err); } };
  useEffect(() => { fetchProducts(); }, [agentId]);

  const openCreate = () => { setEditProduct(null); setForm({ name: "", price: 0, stock: 0, category: "", description: "", image_url: "", sku: "", variants: [] }); setDialogOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, price: p.price || 0, stock: p.stock || 0, category: p.category || "", description: p.description || "", image_url: p.image_url || "", sku: p.sku || "", variants: p.variants || [] }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editProduct) { await axios.put(`${API}/api/agents/${agentId}/training/products/${editProduct.product_id}`, form, { withCredentials: true }); }
      else { await axios.post(`${API}/api/agents/${agentId}/training/products`, form, { withCredentials: true }); }
      setDialogOpen(false); fetchProducts();
    } catch (err) { console.error("Save failed", err); } finally { setSaving(false); }
  };

  const handleDelete = async (productId) => { await axios.delete(`${API}/api/agents/${agentId}/training/products/${productId}`, { withCredentials: true }); fetchProducts(); };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    const productsData = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 2) { productsData.push({ name: parts[0].replace(/"/g, "").trim(), price: parseFloat(parts[1]) || 0, stock: parseInt(parts[2]) || 0, category: (parts[3] || "").replace(/"/g, "").trim(), description: (parts[4] || "").replace(/"/g, "").trim() }); }
    }
    if (productsData.length > 0) { try { await axios.post(`${API}/api/agents/${agentId}/training/products/bulk`, { products: productsData }, { withCredentials: true }); fetchProducts(); } catch (err) { console.error("Failed to bulk-upload products", err); } }
    setImporting(false); e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "name,price,stock,category,description\n\"Nepali Tea Set\",1500,50,\"Beverages\",\"Traditional Nepali tea set with 6 cups\"\n\"Pashmina Shawl\",3500,20,\"Clothing\",\"Handwoven pashmina from Nepal\"";
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "products_template.csv"; a.click();
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div data-testid="products-tab">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-[#57534E]">{products.length} products</p>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} data-testid="download-product-template" className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-xs text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Template</button>
          <label className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-xs text-[#57534E] hover:bg-[#FAFAFA] flex items-center gap-1.5 cursor-pointer"><Upload className="w-3.5 h-3.5" /> {importing ? "Importing..." : "Import CSV"}<input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" data-testid="product-csv-input" /></label>
          <button data-testid="add-product-btn" onClick={openCreate} className="h-9 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Product</button>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E7E5E4] rounded-xl"><ShoppingBag className="w-8 h-8 text-[#A8A29E] mx-auto" /><p className="text-sm text-[#57534E] mt-3">No products yet. Add products or import from CSV.</p></div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <table className="w-full"><thead><tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]"><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Product</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">SKU</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Price (NPR)</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium hidden sm:table-cell">Stock</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium hidden md:table-cell">Category</th><th className="w-20"></th></tr></thead>
            <tbody>{products.map(p => (<tr key={p.product_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA]">
              <td className="px-4 py-3"><div className="flex items-center gap-3">{p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#E7E5E4]" /> : <div className="w-10 h-10 rounded-lg bg-[#F5F5F4] flex items-center justify-center"><ShoppingBag className="w-4 h-4 text-[#A8A29E]" /></div>}<div><p className="text-sm font-medium text-[#0C0A09]">{p.name}</p>{p.description && <p className="text-xs text-[#A8A29E] line-clamp-1">{p.description}</p>}</div></div></td>
              <td className="px-4 py-3 text-xs font-mono text-[#A8A29E]">{p.sku || "-"}</td>
              <td className="px-4 py-3 text-sm text-[#57534E]">NPR {p.price?.toLocaleString()}</td>
              <td className={`px-4 py-3 text-sm hidden sm:table-cell ${(p.stock || 0) < 5 ? "text-[#991B1B] font-medium" : "text-[#57534E]"}`}>{p.stock || 0}</td>
              <td className="px-4 py-3 text-sm text-[#57534E] hidden md:table-cell">{p.category || "-"}</td>
              <td className="px-2 py-3 flex items-center gap-1"><button onClick={() => openEdit(p)} className="p-1.5 text-[#A8A29E] hover:text-[#0C0A09]"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(p.product_id)} className="p-1.5 text-[#A8A29E] hover:text-[#991B1B]"><Trash2 className="w-3.5 h-3.5" /></button></td>
            </tr>))}</tbody></table>
        </div>
      )}
      {/* Detailed Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="product-dialog"><DialogHeader><DialogTitle className="font-serif text-xl">{editProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          {form.image_url && <img src={form.image_url} alt="" className="w-full h-40 object-cover rounded-xl border border-[#E7E5E4]" />}
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Image URL</label><input data-testid="product-image" value={form.image_url} onChange={e => set("image_url", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="https://example.com/image.jpg" /></div>
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Product Name *</label><input data-testid="product-name" value={form.name} onChange={e => set("name", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">SKU</label><input data-testid="product-sku" value={form.sku} onChange={e => set("sku", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="e.g. TEA-001" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Price (NPR) *</label><input data-testid="product-price" type="number" value={form.price} onChange={e => set("price", parseFloat(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div><div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Stock</label><input data-testid="product-stock" type="number" value={form.stock} onChange={e => set("stock", parseInt(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div></div>
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Category</label><input data-testid="product-category" value={form.category} onChange={e => set("category", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
          <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Description</label><textarea data-testid="product-desc" rows={3} value={form.description} onChange={e => set("description", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" /></div>
        </div>
        <DialogFooter className="gap-2"><button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm">Cancel</button><button data-testid="save-product-btn" onClick={handleSave} disabled={saving || !form.name.trim()} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editProduct ? "Update Product" : "Add Product")}</button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}

/* ─── Test Agent Tab ─── */
function TestAgentTab({ agentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/agents/${agentId}/test-chat`, { message: input }, { withCredentials: true });
      const aiMsg = { id: Date.now() + 1, role: "assistant", content: data.response, source: data.source };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "assistant", content: "Error getting response. Please try again." }]);
    }
    finally { setLoading(false); }
  };

  const clearChat = () => setMessages([]);

  return (
    <div data-testid="test-agent-tab" className="flex flex-col h-[calc(100vh-220px)] max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div><h3 className="text-sm font-semibold text-[#0C0A09]">Test your agent</h3><p className="text-xs text-[#A8A29E]">Simulate a customer conversation using your trained data</p></div>
        <button onClick={clearChat} data-testid="clear-test-chat" className="h-8 px-3 border border-[#E7E5E4] rounded-lg text-xs text-[#57534E] hover:bg-[#FAFAFA]">Clear chat</button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white border border-[#E7E5E4] rounded-2xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 text-[#D6D3D1] mx-auto" />
              <p className="text-sm text-[#A8A29E] mt-3">Send a message to test your agent</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {["What are your business hours?", "Show me your products", "I want to place an order", "Hello"].map(q => (
                  <button key={q} onClick={() => { setInput(q); }} className="text-xs bg-[#F5F5F4] text-[#57534E] rounded-full px-3 py-1.5 hover:bg-[#E7E5E4]">{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-[#0C0A09] text-white rounded-l-2xl rounded-tr-2xl" : "bg-[#F5F5F4] text-[#0C0A09] rounded-r-2xl rounded-tl-2xl"} px-4 py-3`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.source && <p className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/40" : "text-[#A8A29E]"}`}>Source: {msg.source}</p>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2"><div className="bg-[#F5F5F4] rounded-2xl px-4 py-3 inline-flex gap-1">{[0, 1, 2].map(i => (<span key={i} className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]" style={{ animation: `typing 0.6s ease-in-out ${i * 0.15}s infinite alternate` }} />))}<style>{`@keyframes typing { 0% { transform: translateY(0); } 100% { transform: translateY(-4px); } }`}</style></div></div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-[#E7E5E4] p-3 flex gap-2">
          <input data-testid="test-chat-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} className="flex-1 h-10 bg-[#F5F5F4] rounded-xl px-4 text-sm outline-none" placeholder="Type a message to test..." />
          <button data-testid="test-chat-send" onClick={sendMessage} disabled={!input.trim() || loading} className="w-10 h-10 rounded-xl bg-[#0C0A09] text-white flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Train Agent Page (Business Info Only) ─── */
export default function TrainAgentPage() {
  const { agentId } = useParams();

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <h1 className="font-serif text-[28px] text-[#0C0A09]">Train Agent</h1>
        <p className="text-sm text-[#57534E] mt-1">Configure your AI agent's business information and behavior.</p>
      </div>
      <div className="px-6 lg:px-8 pb-8">
        <BusinessInfoTab agentId={agentId} />
      </div>
    </div>
  );
}
