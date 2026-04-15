import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LifeBuoy, Plus, MessageCircle, Loader2, Paperclip, X, FileText, Image, File, AlertTriangle, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const priorityColors = { low: "bg-[#F0FDF4] text-[#166534]", medium: "bg-[#FFFBEB] text-[#92400E]", high: "bg-[#FEF2F2] text-[#991B1B]" };
const statusColors = { open: "bg-[#EFF6FF] text-[#1E40AF]", in_progress: "bg-[#FFFBEB] text-[#92400E]", resolved: "bg-[#F0FDF4] text-[#166534]", closed: "bg-[#F5F5F4] text-[#57534E]" };

function getFileIcon(type) {
  if (type?.startsWith("image/")) return Image;
  if (type?.includes("pdf")) return FileText;
  return File;
}

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", priority: "medium" });
  const [attachments, setAttachments] = useState([]);
  const [creating, setCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchTickets = useCallback(async () => {
    try {
      const [ticketRes, unreadRes] = await Promise.all([
        axios.get(`${API}/api/support/tickets`, { withCredentials: true }),
        axios.get(`${API}/api/support/tickets/unread-count`, { withCredentials: true }),
      ]);
      setTickets(ticketRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // File attachment handler
  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Maximum 5MB per file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_data: reader.result.split(",")[1], // base64 without prefix
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeAttachment = (idx) => setAttachments(prev => prev.filter((_, i) => i !== idx));

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setCreating(true);
    try {
      // Upload attachments first
      const uploadedFiles = [];
      for (const att of attachments) {
        try {
          const { data } = await axios.post(`${API}/api/support/upload`, att, { withCredentials: true });
          uploadedFiles.push({ file_id: data.file_id, file_name: data.file_name, file_type: data.file_type, file_size: data.file_size });
        } catch {}
      }

      const { data } = await axios.post(`${API}/api/support/tickets`, {
        ...form,
        attachments: uploadedFiles,
      }, { withCredentials: true });
      setTickets(prev => [data, ...prev]);
      setForm({ subject: "", message: "", priority: "medium" });
      setAttachments([]);
      setCreateOpen(false);
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const { data } = await axios.post(`${API}/api/support/tickets/${selectedTicket.ticket_id}/reply`, { message: reply }, { withCredentials: true });
      setTickets(prev => prev.map(t => t.ticket_id === selectedTicket.ticket_id ? data : t));
      setSelectedTicket(data);
      setReply("");
    } catch {}
    finally { setReplying(false); }
  };

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    if (ticket.read_by_user === false) {
      try {
        await axios.patch(`${API}/api/support/tickets/${ticket.ticket_id}/mark-read`, {}, { withCredentials: true });
        setTickets(prev => prev.map(t => t.ticket_id === ticket.ticket_id ? { ...t, read_by_user: true } : t));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl" data-testid="support-page">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09] flex items-center gap-2">
            Support
            {unreadCount > 0 && (
              <span className="ml-2 w-5 h-5 bg-[#991B1B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-[#57534E] mt-0.5">{tickets.length} tickets. Need help? Create a ticket below.</p>
        </div>
        <button onClick={() => setCreateOpen(true)} data-testid="create-ticket-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16">
          <LifeBuoy className="w-12 h-12 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-xl text-[#0C0A09]">No tickets yet</h3>
          <p className="text-sm text-[#57534E] mt-1 mb-4">Create a support ticket if you need help.</p>
          <button onClick={() => setCreateOpen(true)} className="h-10 px-5 bg-[#0C0A09] text-white rounded-lg text-sm">Create Ticket</button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <motion.div
              key={ticket.ticket_id}
              whileHover={{ x: 2 }}
              onClick={() => handleTicketSelect(ticket)}
              data-testid={`ticket-${ticket.ticket_id}`}
              className={`bg-white border rounded-xl p-4 shadow-card cursor-pointer transition-colors hover:border-[#D6D3D1] ${ticket.read_by_user === false ? 'border-[#991B1B] border-l-4' : 'border-[#E7E5E4]'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.read_by_user === false && <span className="w-2 h-2 bg-[#991B1B] rounded-full shrink-0" />}
                    <h3 className="text-sm font-medium text-[#0C0A09] truncate">{ticket.subject}</h3>
                  </div>
                  <p className="text-xs text-[#57534E] truncate">{ticket.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-mono text-[#A8A29E]">{ticket.ticket_id}</span>
                    <span className="text-[10px] text-[#A8A29E]">{new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.attachments?.length > 0 && (
                      <span className="text-[10px] text-[#57534E] flex items-center gap-0.5"><Paperclip className="w-2.5 h-2.5" />{ticket.attachments.length}</span>
                    )}
                    {ticket.replies?.length > 0 && (
                      <span className="text-[10px] text-[#57534E] flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5" />{ticket.replies.length}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <span className={`inline-flex items-center text-[10px] rounded-full px-2 py-0.5 capitalize ${priorityColors[ticket.priority] || ""}`}>{ticket.priority}</span>
                  <span className={`inline-flex items-center text-[10px] rounded-full px-2 py-0.5 capitalize ${statusColors[ticket.status] || ""}`}>{ticket.status?.replace("_", " ")}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setForm({ subject: "", message: "", priority: "medium" }); setAttachments([]); } }}>
        <DialogContent className="sm:max-w-lg" data-testid="create-ticket-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Subject *</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                data-testid="ticket-subject-input"
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none"
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Priority</label>
              <div className="flex gap-2">
                {["low", "medium", "high"].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: p }))}
                    className={`px-4 py-2 text-xs rounded-lg capitalize transition-colors ${form.priority === p ? (p === "high" ? "bg-[#991B1B] text-white" : p === "medium" ? "bg-[#92400E] text-white" : "bg-[#166534] text-white") : "bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                data-testid="ticket-message-input"
                rows={4}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none"
                placeholder="Describe your issue in detail..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Attachments</label>
              <p className="text-xs text-[#57534E] mb-2">Max 5MB per file. Images, PDFs, and documents supported.</p>
              <label className="flex items-center gap-2 px-3 py-3 border-2 border-dashed border-[#E7E5E4] rounded-lg cursor-pointer hover:border-[#A8A29E] transition-colors">
                <Paperclip className="w-4 h-4 text-[#A8A29E]" />
                <span className="text-sm text-[#57534E]">Click to attach files</span>
                <input type="file" multiple onChange={handleFileAdd} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" />
              </label>
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {attachments.map((att, idx) => {
                    const Icon = getFileIcon(att.file_type);
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-[#FAFAFA] border border-[#E7E5E4] rounded-lg px-3 py-2">
                        <Icon className="w-4 h-4 text-[#57534E] shrink-0" />
                        <span className="text-xs text-[#0C0A09] truncate flex-1">{att.file_name}</span>
                        <span className="text-[10px] text-[#A8A29E] shrink-0">{formatSize(att.file_size)}</span>
                        <button onClick={() => removeAttachment(idx)} className="text-[#A8A29E] hover:text-[#991B1B]"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCreateOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.subject.trim() || !form.message.trim()}
              data-testid="submit-ticket-btn"
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <DialogContent className="sm:max-w-lg" data-testid="ticket-detail-dialog">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl pr-8">{selectedTicket.subject}</DialogTitle>
                <div className="flex gap-2 mt-1">
                  <span className={`inline-flex items-center text-xs rounded-full px-2.5 py-0.5 capitalize ${priorityColors[selectedTicket.priority] || ""}`}>{selectedTicket.priority}</span>
                  <span className={`inline-flex items-center text-xs rounded-full px-2.5 py-0.5 capitalize ${statusColors[selectedTicket.status] || ""}`}>{selectedTicket.status?.replace("_", " ")}</span>
                  <span className="text-xs text-[#A8A29E]">{selectedTicket.ticket_id}</span>
                </div>
              </DialogHeader>

              <div className="py-4 max-h-[50vh] overflow-y-auto space-y-4">
                {/* Original message */}
                <div className="bg-[#F5F5F4] rounded-xl p-4">
                  <p className="text-xs text-[#A8A29E] mb-1">{user?.full_name} · {new Date(selectedTicket.created_at).toLocaleString()}</p>
                  <p className="text-sm text-[#0C0A09] whitespace-pre-wrap">{selectedTicket.message}</p>
                  {selectedTicket.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedTicket.attachments.map((att, idx) => {
                        const Icon = getFileIcon(att.file_type);
                        return (
                          <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-white border border-[#E7E5E4] rounded px-2 py-1"><Icon className="w-3 h-3" />{att.file_name}</span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Replies */}
                {selectedTicket.replies?.map((r, i) => (
                  <div key={i} className={`rounded-xl p-4 ${r.sender === user?.full_name ? "bg-[#F5F0EB]" : "bg-white border border-[#E7E5E4]"}`}>
                    <p className="text-xs text-[#A8A29E] mb-1">{r.sender} · {new Date(r.created_at).toLocaleString()}</p>
                    <p className="text-sm text-[#0C0A09] whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== "closed" && (
                <div className="border-t border-[#E7E5E4] pt-4">
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Type your reply..."
                      rows={2}
                      className="flex-1 border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none"
                    />
                    <button
                      onClick={handleReply}
                      disabled={replying || !reply.trim()}
                      className="h-auto px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 self-end"
                    >
                      {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reply"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
