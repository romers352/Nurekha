import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Users, Search, Loader2, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = { new: "bg-[#EFF6FF] text-[#1E40AF]", contacted: "bg-[#FFFBEB] text-[#92400E]", qualified: "bg-[#F0FDF4] text-[#166534]", converted: "bg-[#F5F0EB] text-[#1C1917]", lost: "bg-[#FEF2F2] text-[#991B1B]" };

export default function LeadsPage() {
  const { agentId } = useParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", email: "", details: "", source: "manual" });

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get(`${API}/api/agents/${agentId}/leads`, { withCredentials: true }); setLeads(data); } catch {}
      finally { setLoading(false); }
    })();
  }, [agentId]);

  const handleCreate = async () => {
    if (!form.customer_name.trim()) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/api/agents/${agentId}/leads`, form, { withCredentials: true });
      setLeads(prev => [data, ...prev]);
      setDialogOpen(false);
      setForm({ customer_name: "", phone: "", email: "", details: "", source: "manual" });
    } catch {}
    finally { setSaving(false); }
  };

  const handleStatusChange = async (leadId, status) => {
    try {
      const { data } = await axios.patch(`${API}/api/agents/${agentId}/leads/${leadId}/status`, { status }, { withCredentials: true });
      setLeads(prev => prev.map(l => l.lead_id === leadId ? data : l));
    } catch {}
  };

  const filtered = leads.filter(l => {
    if (!filter) return true;
    return l.status === filter;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="leads-page">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Leads</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{leads.length} total leads</p>
        </div>
        <button onClick={() => setDialogOpen(true)} data-testid="add-lead-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Lead</button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["", "new", "contacted", "qualified", "converted", "lost"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === s ? 'bg-[#0C0A09] text-white' : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]'}`}>{s || "All"}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
          <Users className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#0C0A09]">No leads{filter ? ` with status "${filter}"` : ""}</h3>
          <p className="text-sm text-[#57534E] mt-1">Leads from AI chat or manual entry will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Lead ID</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Customer</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Contact</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Details</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Source</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Date</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.lead_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-xs font-mono text-[#57534E]">{l.lead_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0C0A09]">{l.customer_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-[#57534E]">{l.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</span>}{l.email && <span className="flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{l.email}</span>}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#57534E] max-w-[200px] truncate">{l.details || "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E] capitalize">{l.source}</td>
                    <td className="px-4 py-3 text-xs text-[#A8A29E]">{new Date(l.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={l.status} onChange={e => handleStatusChange(l.lead_id, e.target.value)} className={`text-xs rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${STATUS_COLORS[l.status] || ''}`}>
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="converted">Converted</option><option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="lead-dialog">
          <DialogHeader><DialogTitle className="font-serif text-xl">Add Lead</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Customer Name *</label><input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" /></div>
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Email</label><input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Details</label><textarea value={form.details} onChange={e => setForm(f => ({...f, details: e.target.value}))} rows={3} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none" /></div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.customer_name.trim()} data-testid="save-lead-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Lead"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
