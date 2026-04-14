import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Plus, Clock, CheckCircle, Truck, Package, XCircle,
  ChevronDown, ArrowRight, Loader2, Search,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "#92400E", bg: "#FFFBEB", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "#166534", bg: "#F0FDF4", label: "Confirmed" },
  processing: { icon: Package, color: "#1E40AF", bg: "#EFF6FF", label: "Processing" },
  shipped: { icon: Truck, color: "#6366F1", bg: "#EEF2FF", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "#166534", bg: "#F0FDF4", label: "Delivered" },
  cancelled: { icon: XCircle, color: "#991B1B", bg: "#FEF2F2", label: "Cancelled" },
};

const NEXT_STATUS = { pending: "confirmed", confirmed: "processing", processing: "shipped", shipped: "delivered" };

function OrderRow({ order, onStatusUpdate, onView }) {
  const sc = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;
  const Icon = sc.icon;
  const nextStatus = NEXT_STATUS[order.order_status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid={`order-row-${order.order_id}`}
      className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-[#0C0A09]">{order.order_id}</span>
          <span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5" style={{ backgroundColor: sc.bg, color: sc.color }}>
            <Icon className="w-3 h-3" />
            {sc.label}
          </span>
        </div>
        <p className="text-sm text-[#57534E] mt-1">{order.end_user_name} - {order.items?.length || 0} items</p>
        <p className="text-xs text-[#A8A29E] mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-base font-semibold text-[#0C0A09]">NPR {order.total_amount?.toLocaleString()}</span>
        {nextStatus && order.order_status !== "cancelled" && (
          <button
            data-testid={`advance-${order.order_id}`}
            onClick={() => onStatusUpdate(order.order_id, nextStatus)}
            className="h-8 px-3 bg-[#0C0A09] text-white rounded-lg text-xs font-medium hover:bg-[#1C1917] flex items-center gap-1"
          >
            {STATUS_CONFIG[nextStatus]?.label} <ArrowRight className="w-3 h-3" />
          </button>
        )}
        {order.order_status !== "cancelled" && order.order_status !== "delivered" && (
          <button
            data-testid={`cancel-${order.order_id}`}
            onClick={() => onStatusUpdate(order.order_id, "cancelled")}
            className="h-8 px-3 border border-[#FECACA] text-[#991B1B] rounded-lg text-xs hover:bg-[#FEF2F2]"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}

function StatusTimeline({ history }) {
  if (!history || history.length === 0) return null;
  return (
    <div className="space-y-3 mt-4">
      {history.map((h, i) => {
        const sc = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
        const Icon = sc.icon;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: sc.bg }}>
                <Icon className="w-3 h-3" style={{ color: sc.color }} />
              </div>
              {i < history.length - 1 && <div className="w-px h-6 bg-[#E7E5E4]" />}
            </div>
            <div>
              <p className="text-sm font-medium text-[#0C0A09] capitalize">{sc.label}</p>
              <p className="text-xs text-[#A8A29E]">{new Date(h.timestamp).toLocaleString()}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AgentOrdersPage() {
  const { agentId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [form, setForm] = useState({ end_user_name: "", items: [{ name: "", quantity: 1, price: 0 }], payment_method: "cod", delivery_address: "", notes: "" });
  const [creating, setCreating] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${API}/api/orders?agent_id=${agentId}`, { withCredentials: true });
      setOrders(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [agentId]);

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await axios.patch(`${API}/api/orders/${orderId}/status`, { status }, { withCredentials: true });
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: "", quantity: 1, price: 0 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, value) => setForm(p => ({ ...p, items: p.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }));

  const totalAmount = form.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleCreate = async () => {
    if (!form.end_user_name.trim() || form.items.length === 0) return;
    setCreating(true);
    try {
      await axios.post(`${API}/api/orders`, {
        agent_id: agentId,
        end_user_name: form.end_user_name,
        items: form.items.filter(i => i.name.trim()),
        total_amount: totalAmount,
        payment_method: form.payment_method,
        delivery_address: form.delivery_address,
        notes: form.notes,
      }, { withCredentials: true });
      setCreateOpen(false);
      setForm({ end_user_name: "", items: [{ name: "", quantity: 1, price: 0 }], payment_method: "cod", delivery_address: "", notes: "" });
      fetchOrders();
    } catch {}
    finally { setCreating(false); }
  };

  const filtered = orders.filter(o => {
    if (filter !== "all" && o.order_status !== filter) return false;
    if (search && !o.order_id.toLowerCase().includes(search.toLowerCase()) && !o.end_user_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusCounts = orders.reduce((acc, o) => { acc[o.order_status] = (acc[o.order_status] || 0) + 1; return acc; }, {});

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="agent-orders-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Orders</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{orders.length} total orders</p>
        </div>
        <button data-testid="create-order-btn" onClick={() => setCreateOpen(true)} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map(s => (
          <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)} className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${filter === s ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]"}`}>
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label} {s === "all" ? `(${orders.length})` : statusCounts[s] ? `(${statusCounts[s]})` : ""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
        <input data-testid="order-search" value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-sm h-9 bg-[#F5F5F4] rounded-lg border-0 pl-9 pr-3 text-sm outline-none" placeholder="Search orders..." />
      </div>

      {/* Order List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-shimmer" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
          <ShoppingBag className="w-8 h-8 text-[#A8A29E] mx-auto" />
          <p className="text-sm text-[#57534E] mt-3">{orders.length === 0 ? "No orders yet" : "No matching orders"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderRow key={order.order_id} order={order} onStatusUpdate={handleStatusUpdate} onView={() => setDetailOrder(order)} />
          ))}
        </div>
      )}

      {/* Create Order Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="create-order-dialog">
          <DialogHeader><DialogTitle className="font-serif text-xl">Create Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Customer Name</label>
              <input data-testid="order-customer" value={form.end_user_name} onChange={e => setForm(p => ({ ...p, end_user_name: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Customer name" />
            </div>

            {/* Items */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Items</label>
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input data-testid={`item-name-${i}`} value={item.name} onChange={e => updateItem(i, "name", e.target.value)} className="flex-1 border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm outline-none" placeholder="Item name" />
                  <input data-testid={`item-qty-${i}`} type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className="w-16 border border-[#E7E5E4] rounded-lg px-2 py-2 text-sm outline-none text-center" />
                  <input data-testid={`item-price-${i}`} type="number" min="0" value={item.price} onChange={e => updateItem(i, "price", parseFloat(e.target.value) || 0)} className="w-24 border border-[#E7E5E4] rounded-lg px-2 py-2 text-sm outline-none" placeholder="Price" />
                  {form.items.length > 1 && <button onClick={() => removeItem(i)} className="text-[#A8A29E] hover:text-[#991B1B]"><XCircle className="w-4 h-4" /></button>}
                </div>
              ))}
              <button onClick={addItem} className="text-xs text-[#0C0A09] font-medium hover:underline mt-1">+ Add item</button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E7E5E4]">
              <span className="text-sm text-[#57534E]">Total</span>
              <span className="text-lg font-semibold text-[#0C0A09]">NPR {totalAmount.toLocaleString()}</span>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: "cod", label: "Cash on Delivery" }, { id: "esewa", label: "eSewa" }, { id: "khalti", label: "Khalti" }, { id: "bank", label: "Bank Transfer" }].map(m => (
                  <button key={m.id} data-testid={`pay-method-${m.id}`} onClick={() => setForm(p => ({ ...p, payment_method: m.id }))} className={`border rounded-lg p-3 text-sm text-left transition-colors ${form.payment_method === m.id ? "border-[#0C0A09] bg-[#F5F0EB]" : "border-[#E7E5E4] hover:bg-[#FAFAFA]"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Delivery Address</label>
              <textarea data-testid="order-address" rows={2} value={form.delivery_address} onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Notes</label>
              <textarea data-testid="order-notes" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm outline-none resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCreateOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm">Cancel</button>
            <button data-testid="submit-order" onClick={handleCreate} disabled={creating || !form.end_user_name.trim()} className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Order"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
