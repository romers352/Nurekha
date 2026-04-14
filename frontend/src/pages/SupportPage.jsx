import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, AlertTriangle, Loader2, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = { open: "bg-[#FFFBEB] text-[#92400E]", in_progress: "bg-[#EFF6FF] text-[#1E40AF]", resolved: "bg-[#F0FDF4] text-[#166534]", closed: "bg-[#F5F5F4] text-[#57534E]" };
const PRIORITY_COLORS = { low: "text-[#57534E]", medium: "text-[#92400E]", high: "text-[#991B1B]" };

export default function SupportPage() {
  const [tickets, setTickets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const [replyText, setReplyText] = useState("");
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);

  const fetch = async () => { try { const { data } = await axios.get(`${API}/api/support/tickets`, { withCredentials: true }); setTickets(data); } catch {} };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    try { await axios.post(`${API}/api/support/tickets`, form, { withCredentials: true }); setCreateOpen(false); setForm({ subject: "", message: "", priority: "medium" }); fetch(); } catch {} finally { setCreating(false); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/api/support/tickets/${selectedTicket.ticket_id}/reply`, { message: replyText }, { withCredentials: true });
      setSelectedTicket(data);
      setReplyText("");
      fetch();
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="support-page">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-serif text-[28px] text-[#0C0A09]">Support</h1><p className="text-sm text-[#57534E] mt-0.5">{tickets.length} tickets</p></div>
        <button data-testid="create-ticket-btn" onClick={() => setCreateOpen(true)} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"><Plus className="w-4 h-4" /> New Ticket</button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
          <LifeBuoy className="w-10 h-10 text-[#A8A29E] mx-auto" />
          <h3 className="font-serif text-xl text-[#0C0A09] mt-4">No tickets yet</h3>
          <p className="text-sm text-[#57534E] mt-1 max-w-xs mx-auto">Need help? Create a support ticket and our team will respond.</p>
          <button onClick={() => setCreateOpen(true)} className="mt-4 h-10 px-5 bg-[#0C0A09] text-white rounded-lg text-sm font-medium">Create Ticket</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <motion.div key={ticket.ticket_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid={`ticket-${ticket.ticket_id}`} onClick={() => setSelectedTicket(ticket)} className="bg-white border border-[#E7E5E4] rounded-xl p-4 cursor-pointer hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-[#A8A29E]">{ticket.ticket_id}</span>
                    <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>{ticket.status === "open" ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}{ticket.status}</span>
                    <span className={`text-xs font-medium capitalize ${PRIORITY_COLORS[ticket.priority] || ""}`}>{ticket.priority}</span>
                  </div>
                  <h3 className="text-sm font-medium text-[#0C0A09] mt-1">{ticket.subject}</h3>
                  <p className="text-xs text-[#57534E] mt-0.5 line-clamp-1">{ticket.message}</p>
                </div>
                <span className="text-xs text-[#A8A29E] shrink-0 ml-4">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              {ticket.replies?.length > 0 && <div className="flex items-center gap-1 mt-2 text-xs text-[#A8A29E]"><MessageSquare className="w-3 h-3" />{ticket.replies.length} replies</div>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md" data-testid="create-ticket-dialog">
          <DialogHeader><DialogTitle className="font-serif text-xl">New Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Subject</label><input data-testid="ticket-subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Brief description of your issue" /></div>
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Message</label><textarea data-testid="ticket-message" rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" placeholder="Describe your issue in detail..." /></div>
            <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Priority</label><div className="flex gap-2">{["low", "medium", "high"].map(p => (<button key={p} onClick={() => setForm(prev => ({ ...prev, priority: p }))} className={`px-4 py-2 rounded-lg text-sm capitalize ${form.priority === p ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E]"}`}>{p}</button>))}</div></div>
          </div>
          <DialogFooter className="gap-2"><button onClick={() => setCreateOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm">Cancel</button><button data-testid="submit-ticket" onClick={handleCreate} disabled={creating} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}</button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="ticket-detail-dialog">
          {selectedTicket && (<>
            <DialogHeader><DialogTitle className="font-serif text-xl">{selectedTicket.subject}</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="flex gap-2 flex-wrap"><span className="font-mono text-xs text-[#A8A29E]">{selectedTicket.ticket_id}</span><span className={`text-xs rounded-full px-2 py-0.5 ${STATUS_COLORS[selectedTicket.status]}`}>{selectedTicket.status}</span></div>
              <div className="bg-[#FAFAFA] rounded-xl p-4"><p className="text-sm text-[#0C0A09]">{selectedTicket.message}</p><p className="text-xs text-[#A8A29E] mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</p></div>
              {selectedTicket.replies?.map((r, i) => (<div key={i} className="bg-white border border-[#E7E5E4] rounded-xl p-4"><p className="text-xs font-medium text-[#0C0A09]">{r.sender}</p><p className="text-sm text-[#57534E] mt-1">{r.message}</p><p className="text-xs text-[#A8A29E] mt-2">{new Date(r.created_at).toLocaleString()}</p></div>))}
              <div className="flex gap-2"><input data-testid="ticket-reply-input" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReply()} className="flex-1 border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm outline-none" placeholder="Type a reply..." /><button data-testid="send-reply" onClick={handleReply} disabled={sending} className="h-10 px-3 bg-[#0C0A09] text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /></button></div>
            </div>
          </>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
