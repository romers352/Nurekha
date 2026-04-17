import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, ClipboardList, Search, Loader2, Phone, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { downloadCSV, filenameTimestamp } from "@/lib/csvExport";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = { open: "bg-[#EFF6FF] text-[#1E40AF]", in_progress: "bg-[#FFFBEB] text-[#92400E]", resolved: "bg-[#F0FDF4] text-[#166534]", closed: "bg-[#F5F5F4] text-[#57534E]" };
const PRIORITY_COLORS = { low: "bg-[#F0FDF4] text-[#166534]", medium: "bg-[#FFFBEB] text-[#92400E]", high: "bg-[#FEF2F2] text-[#991B1B]" };

export default function CustomerTicketsPage() {
  const { agentId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_name: "", phone: "", issue: "", category: "general", priority: "medium" });

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get(`${API}/api/agents/${agentId}/customer-tickets`, { withCredentials: true }); setTickets(data); } catch {}
      finally { setLoading(false); }
    })();
  }, [agentId]);

  const handleCreate = async () => {
    if (!form.customer_name.trim() || !form.issue.trim()) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/api/agents/${agentId}/customer-tickets`, form, { withCredentials: true });
      setTickets(prev => [data, ...prev]);
      setDialogOpen(false);
      setForm({ customer_name: "", phone: "", issue: "", category: "general", priority: "medium" });
    } catch {}
    finally { setSaving(false); }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      const { data } = await axios.patch(`${API}/api/agents/${agentId}/customer-tickets/${ticketId}/status`, { status }, { withCredentials: true });
      setTickets(prev => prev.map(t => t.ticket_id === ticketId ? data : t));
    } catch {}
  };

  const filtered = tickets.filter(t => !filter || t.status === filter);

  const handleExportCSV = () => {
    const rows = filtered.map(t => ({
      ticket_id: t.ticket_id,
      customer_name: t.customer_name,
      phone: t.phone || "",
      issue: t.issue || "",
      category: t.category || "",
      priority: t.priority || "",
      status: t.status || "",
      created_at: t.created_at ? new Date(t.created_at).toISOString() : "",
    }));
    downloadCSV(`tickets_${filenameTimestamp()}.csv`, rows, [
      { key: "ticket_id", header: "Ticket ID" },
      { key: "customer_name", header: "Customer" },
      { key: "phone", header: "Phone" },
      { key: "issue", header: "Issue" },
      { key: "category", header: "Category" },
      { key: "priority", header: "Priority" },
      { key: "status", header: "Status" },
      { key: "created_at", header: "Created At" },
    ]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="customer-tickets-page">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Customer Tickets</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{tickets.length} total tickets</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={tickets.length === 0}
            data-testid="export-csv-btn"
            className="h-10 px-4 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setDialogOpen(true)} data-testid="add-ticket-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"><Plus className="w-4 h-4" /> Add Ticket</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["", "open", "in_progress", "resolved", "closed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === s ? 'bg-[#0C0A09] text-white' : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]'}`}>{s ? s.replace("_", " ") : "All"}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
          <ClipboardList className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#0C0A09]">No tickets{filter ? ` with status "${filter.replace('_',' ')}"` : ""}</h3>
          <p className="text-sm text-[#57534E] mt-1">Customer support tickets from AI chat will appear here.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Ticket ID</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Customer</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Issue</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Category</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Priority</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Date</th>
                <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
              </tr></thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.ticket_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-xs font-mono text-[#57534E]">{t.ticket_id}</td>
                    <td className="px-4 py-3"><p className="text-sm font-medium text-[#0C0A09]">{t.customer_name}</p>{t.phone && <p className="text-xs text-[#A8A29E] flex items-center gap-1"><Phone className="w-3 h-3" />{t.phone}</p>}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E] max-w-[250px] truncate">{t.issue}</td>
                    <td className="px-4 py-3 text-xs text-[#57534E] capitalize">{t.category}</td>
                    <td className="px-4 py-3"><span className={`text-xs rounded-full px-2.5 py-0.5 ${PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span></td>
                    <td className="px-4 py-3 text-xs text-[#A8A29E]">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <select value={t.status} onChange={e => handleStatusChange(t.ticket_id, e.target.value)} className={`text-xs rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${STATUS_COLORS[t.status] || ''}`}>
                        <option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option>
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
        <DialogContent className="sm:max-w-md" data-testid="ticket-create-dialog">
          <DialogHeader><DialogTitle className="font-serif text-xl">Add Ticket</DialogTitle></DialogHeader>
          <div className="py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Customer Name *</label><input value={form.customer_name} onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" /></div>
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Issue *</label><textarea value={form.issue} onChange={e => setForm(f => ({...f, issue: e.target.value}))} rows={3} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Category</label><select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm outline-none"><option value="general">General</option><option value="billing">Billing</option><option value="technical">Technical</option><option value="service">Service</option></select></div>
              <div><label className="block text-sm font-medium text-[#0C0A09] mb-1">Priority</label><select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm outline-none"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.customer_name.trim() || !form.issue.trim()} data-testid="save-ticket-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Ticket"}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
