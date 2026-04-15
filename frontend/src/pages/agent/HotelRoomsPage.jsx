import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Hotel, Loader2, X, Users, DollarSign, Wifi } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Family", "Presidential", "Single", "Double", "Twin"];

const emptyRoom = { room_type: "", room_number: "", price_per_night: 0, capacity: 2, amenities: [], description: "", is_available: true };

export default function HotelRoomsPage() {
  const { agentId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState({ ...emptyRoom });
  const [saving, setSaving] = useState(false);
  const [amenityInput, setAmenityInput] = useState("");

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/rooms`, { withCredentials: true });
      setRooms(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, [agentId]);

  const openCreate = () => { setEditingRoom(null); setForm({ ...emptyRoom }); setDialogOpen(true); };
  const openEdit = (room) => { setEditingRoom(room); setForm({ room_type: room.room_type, room_number: room.room_number || "", price_per_night: room.price_per_night, capacity: room.capacity, amenities: room.amenities || [], description: room.description || "", is_available: room.is_available !== false }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.room_type || form.price_per_night <= 0) return;
    setSaving(true);
    try {
      if (editingRoom) {
        const { data } = await axios.put(`${API}/api/agents/${agentId}/rooms/${editingRoom.room_id}`, form, { withCredentials: true });
        setRooms(prev => prev.map(r => r.room_id === editingRoom.room_id ? data : r));
      } else {
        const { data } = await axios.post(`${API}/api/agents/${agentId}/rooms`, form, { withCredentials: true });
        setRooms(prev => [...prev, data]);
      }
      setDialogOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (roomId) => {
    try {
      await axios.delete(`${API}/api/agents/${agentId}/rooms/${roomId}`, { withCredentials: true });
      setRooms(prev => prev.filter(r => r.room_id !== roomId));
    } catch {}
  };

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm(f => ({ ...f, amenities: [...f.amenities, amenityInput.trim()] }));
      setAmenityInput("");
    }
  };

  const removeAmenity = (a) => setForm(f => ({ ...f, amenities: f.amenities.filter(x => x !== a) }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="hotel-rooms-page">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Rooms</h1>
          <p className="text-sm text-[#57534E] mt-0.5">Manage your hotel rooms and availability.</p>
        </div>
        <button onClick={openCreate} data-testid="add-room-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16">
          <Hotel className="w-12 h-12 text-[#D6D3D1] mx-auto mb-3" />
          <h3 className="font-serif text-xl text-[#0C0A09]">No rooms yet</h3>
          <p className="text-sm text-[#57534E] mt-1 mb-4">Add your hotel rooms to manage bookings.</p>
          <button onClick={openCreate} className="h-10 px-5 bg-[#0C0A09] text-white rounded-lg text-sm">Add Room</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {rooms.map(room => (
              <motion.div key={room.room_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card relative group">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(room)} className="p-1.5 bg-white border border-[#E7E5E4] rounded-lg hover:bg-[#FAFAFA]"><Pencil className="w-3.5 h-3.5 text-[#57534E]" /></button>
                  <button onClick={() => handleDelete(room.room_id)} className="p-1.5 bg-white border border-[#E7E5E4] rounded-lg hover:bg-[#FEF2F2]"><Trash2 className="w-3.5 h-3.5 text-[#991B1B]" /></button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${room.is_available ? 'bg-[#166534]' : 'bg-[#991B1B]'}`} />
                  <span className="text-xs text-[#57534E]">{room.is_available ? 'Available' : 'Occupied'}</span>
                  {room.room_number && <span className="text-xs text-[#A8A29E] ml-auto">#{room.room_number}</span>}
                </div>
                <h3 className="font-serif text-lg text-[#0C0A09]">{room.room_type}</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm text-[#57534E]"><DollarSign className="w-3.5 h-3.5" />NPR {room.price_per_night}/night</div>
                  <div className="flex items-center gap-1 text-sm text-[#57534E]"><Users className="w-3.5 h-3.5" />{room.capacity} guests</div>
                </div>
                {room.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {room.amenities.map(a => <span key={a} className="text-xs bg-[#F5F5F4] px-2 py-0.5 rounded-full text-[#57534E]">{a}</span>)}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Room Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" data-testid="room-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Room Type</label>
                <select value={form.room_type} onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none">
                  <option value="">Select...</option>
                  {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Room Number</label>
                <input value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" placeholder="e.g. 101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Price/Night (NPR)</label>
                <input type="number" value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none" placeholder="Room description..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Amenities</label>
              <div className="flex gap-2">
                <input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())} className="flex-1 border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none" placeholder="e.g. WiFi, AC, TV" />
                <button type="button" onClick={addAmenity} className="px-3 py-2 bg-[#F5F5F4] rounded-lg text-sm hover:bg-[#E7E5E4]">Add</button>
              </div>
              {form.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.amenities.map(a => <span key={a} className="inline-flex items-center gap-1 text-xs bg-[#F5F0EB] px-2 py-1 rounded-full text-[#57534E]">{a}<button onClick={() => removeAmenity(a)}><X className="w-3 h-3" /></button></span>)}
                </div>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} className="rounded border-[#D6D3D1]" />
              <span className="text-sm text-[#0C0A09]">Available for booking</span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.room_type || form.price_per_night <= 0} data-testid="save-room-btn" className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingRoom ? 'Update' : 'Add Room'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
