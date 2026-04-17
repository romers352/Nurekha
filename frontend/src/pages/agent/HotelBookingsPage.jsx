import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, CalendarCheck, Search, Loader2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { downloadCSV, filenameTimestamp } from "@/lib/csvExport";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_COLORS = {
  pending: "bg-[#FFFBEB] text-[#92400E]",
  confirmed: "bg-[#F0FDF4] text-[#166534]",
  checked_in: "bg-[#EFF6FF] text-[#1E40AF]",
  checked_out: "bg-[#F5F5F4] text-[#57534E]",
  cancelled: "bg-[#FEF2F2] text-[#991B1B]",
};

export default function HotelBookingsPage() {
  const { agentId } = useParams();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ guest_name: "", guest_email: "", guest_phone: "", room_id: "", check_in: "", check_out: "", total_amount: 0, notes: "" });

  const fetchData = async () => {
    try {
      const [bRes, rRes] = await Promise.all([
        axios.get(`${API}/api/bookings?agent_id=${agentId}`, { withCredentials: true }),
        axios.get(`${API}/api/agents/${agentId}/rooms`, { withCredentials: true }),
      ]);
      setBookings(bRes.data);
      setRooms(rRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [agentId]);

  const handleCreate = async () => {
    if (!form.guest_name || !form.room_id || !form.check_in || !form.check_out) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`${API}/api/bookings`, { ...form, agent_id: agentId }, { withCredentials: true });
      setBookings(prev => [data, ...prev]);
      setDialogOpen(false);
      setForm({ guest_name: "", guest_email: "", guest_phone: "", room_id: "", check_in: "", check_out: "", total_amount: 0, notes: "" });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const { data } = await axios.patch(`${API}/api/bookings/${bookingId}/status`, { status: newStatus }, { withCredentials: true });
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? data : b));
    } catch (err) { console.error(err); }
  };

  const getRoomName = (roomId) => rooms.find(r => r.room_id === roomId)?.room_type || "Unknown";

  const filteredBookings = bookings.filter(b => {
    if (!filter) return true;
    return b.booking_status === filter;
  });

  const handleExportCSV = () => {
    const rows = filteredBookings.map(b => ({
      booking_id: b.booking_id,
      guest_name: b.guest_name || "",
      guest_email: b.guest_email || "",
      guest_phone: b.guest_phone || "",
      room: getRoomName(b.room_id),
      check_in: b.check_in || "",
      check_out: b.check_out || "",
      total_amount: b.total_amount ?? "",
      status: b.booking_status || "",
      notes: b.notes || "",
      created_at: b.created_at ? new Date(b.created_at).toISOString() : "",
    }));
    downloadCSV(`bookings_${filenameTimestamp()}.csv`, rows, [
      { key: "booking_id", header: "Booking ID" },
      { key: "guest_name", header: "Guest" },
      { key: "guest_email", header: "Email" },
      { key: "guest_phone", header: "Phone" },
      { key: "room", header: "Room" },
      { key: "check_in", header: "Check-in" },
      { key: "check_out", header: "Check-out" },
      { key: "total_amount", header: "Total" },
      { key: "status", header: "Status" },
      { key: "notes", header: "Notes" },
      { key: "created_at", header: "Created At" },
    ]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="hotel-bookings-page">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Bookings</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{bookings.length} total bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={bookings.length === 0}
            data-testid="export-csv-btn"
            className="h-10 px-4 border border-[#E7E5E4] bg-white text-[#0C0A09] rounded-lg text-sm font-medium hover:bg-[#FAFAFA] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={() => setDialogOpen(true)} data-testid="create-booking-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Booking
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {["", "pending", "confirmed", "checked_in", "checked_out", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 text-xs rounded-full transition-colors ${filter === s ? 'bg-[#0C0A09] text-white' : 'bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]'}`}>
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <CalendarCheck className="w-12 h-12 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-xl text-[#0C0A09]">No bookings{filter ? ` with status "${filter}"` : ""}</h3>
          <p className="text-sm text-[#57534E] mt-1">Create your first booking to get started.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Booking ID</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Guest</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Room</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Check In</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Check Out</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Amount</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.booking_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[#57534E]">{b.booking_id}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#0C0A09]">{b.guest_name}</p>
                      {b.guest_phone && <p className="text-xs text-[#A8A29E]">{b.guest_phone}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#57534E]">{getRoomName(b.room_id)}</td>
                    <td className="px-4 py-3 text-sm text-[#57534E]">{b.check_in}</td>
                    <td className="px-4 py-3 text-sm text-[#57534E]">{b.check_out}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0C0A09]">NPR {b.total_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs rounded-full px-2.5 py-0.5 capitalize ${STATUS_COLORS[b.booking_status] || ''}`}>
                        {b.booking_status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select value={b.booking_status} onChange={e => handleStatusChange(b.booking_id, e.target.value)} className="text-xs border border-[#E7E5E4] rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#1C1917] outline-none">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="checked_in">Checked In</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="booking-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">New Booking</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Guest Name *</label>
              <input value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" placeholder="Guest full name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Email</label>
                <input value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" placeholder="Email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Phone</label>
                <input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" placeholder="Phone" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Room *</label>
              <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none">
                <option value="">Select room...</option>
                {rooms.filter(r => r.is_available).map(r => <option key={r.room_id} value={r.room_id}>{r.room_type} {r.room_number ? `#${r.room_number}` : ''} - NPR {r.price_per_night}/night</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Check In *</label>
                <input type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Check Out *</label>
                <input type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Total Amount (NPR)</label>
              <input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: Number(e.target.value) }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none" placeholder="Special requests..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleCreate} disabled={saving || !form.guest_name || !form.room_id || !form.check_in || !form.check_out} data-testid="save-booking-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Booking"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
