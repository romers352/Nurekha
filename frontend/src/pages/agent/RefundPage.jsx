import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, Search, Clock, CheckCircle, XCircle, DollarSign,
  ArrowUpRight, AlertTriangle, Loader2, Filter, Package,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function RefundPage() {
  const { agentId } = useParams();
  const [refunds, setRefunds] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState("refunds"); // "refunds" or "eligible"

  const fetchData = async () => {
    try {
      const [refundsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/api/refunds?agent_id=${agentId}`, { withCredentials: true }),
        axios.get(`${API}/api/orders?agent_id=${agentId}`, { withCredentials: true }),
      ]);
      setRefunds(refundsRes.data);
      setOrders(ordersRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [agentId]);

  // Orders eligible for refund (paid, not already refunded)
  const eligibleOrders = orders.filter(
    o => o.payment_status === "paid" && !o.refund_id && o.order_status !== "cancelled"
  );

  const openRefundDialog = (order) => {
    setSelectedOrder(order);
    setRefundAmount(order.total_amount || 0);
    setRefundReason("");
    setRefundDialogOpen(true);
  };

  const handleProcessRefund = async () => {
    if (!selectedOrder || !refundReason.trim()) return;
    setProcessing(true);
    try {
      await axios.post(
        `${API}/api/orders/${selectedOrder.order_id}/refund`,
        { reason: refundReason, amount: refundAmount },
        { withCredentials: true }
      );
      setRefundDialogOpen(false);
      setSelectedOrder(null);
      // Refetch data
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Refund failed");
    }
    finally { setProcessing(false); }
  };

  const filteredRefunds = refunds.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.order_id?.toLowerCase().includes(s) ||
      r.refund_id?.toLowerCase().includes(s) ||
      r.end_user_name?.toLowerCase().includes(s)
    );
  });

  const filteredEligible = eligibleOrders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_id?.toLowerCase().includes(s) ||
      o.end_user_name?.toLowerCase().includes(s)
    );
  });

  const totalRefunded = refunds.reduce((sum, r) => sum + (r.refund_amount || 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="refund-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">Refunds</h1>
          <p className="text-sm text-[#57534E] mt-0.5">Process and manage customer refunds.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#FEF2F2] rounded-lg flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-[#991B1B]" />
            </div>
          </div>
          <p className="font-serif text-2xl text-[#0C0A09]">{refunds.length}</p>
          <p className="text-xs text-[#57534E]">Total Refunds</p>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#FFFBEB] rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#92400E]" />
            </div>
          </div>
          <p className="font-serif text-2xl text-[#0C0A09]">NPR {totalRefunded.toLocaleString()}</p>
          <p className="text-xs text-[#57534E]">Amount Refunded</p>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#1E40AF]" />
            </div>
          </div>
          <p className="font-serif text-2xl text-[#0C0A09]">{eligibleOrders.length}</p>
          <p className="text-xs text-[#57534E]">Eligible for Refund</p>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#F0FDF4] rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-[#166534]" />
            </div>
          </div>
          <p className="font-serif text-2xl text-[#0C0A09]">{orders.length}</p>
          <p className="text-xs text-[#57534E]">Total Orders</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex bg-[#F5F5F4] rounded-lg p-1">
          <button
            onClick={() => setTab("refunds")}
            data-testid="tab-refunds"
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "refunds" ? "bg-white text-[#0C0A09] font-medium shadow-sm" : "text-[#57534E]"}`}
          >
            Processed ({refunds.length})
          </button>
          <button
            onClick={() => setTab("eligible")}
            data-testid="tab-eligible"
            className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === "eligible" ? "bg-white text-[#0C0A09] font-medium shadow-sm" : "text-[#57534E]"}`}
          >
            Eligible ({eligibleOrders.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="refund-search"
            className="w-full h-9 bg-[#F5F5F4] rounded-lg border-0 pl-9 pr-3 text-sm outline-none"
            placeholder="Search by order ID, refund ID, or customer..."
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white border border-[#E7E5E4] rounded-xl animate-pulse" />)}
        </div>
      ) : tab === "refunds" ? (
        /* Processed Refunds */
        filteredRefunds.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
            <RotateCcw className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[#0C0A09]">{refunds.length === 0 ? "No refunds yet" : "No matching refunds"}</h3>
            <p className="text-sm text-[#57534E] mt-1">Processed refunds will appear here.</p>
            {eligibleOrders.length > 0 && (
              <button onClick={() => setTab("eligible")} className="mt-4 text-sm text-[#0C0A09] font-medium hover:underline flex items-center gap-1 mx-auto">
                View eligible orders <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Refund ID</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Order ID</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Customer</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Amount</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Reason</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Date</th>
                    <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map(r => (
                    <tr key={r.refund_id || r.order_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-[#0C0A09] font-medium">{r.refund_id}</td>
                      <td className="px-4 py-3 text-xs font-mono text-[#57534E]">{r.order_id}</td>
                      <td className="px-4 py-3 text-sm text-[#0C0A09]">{r.end_user_name}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#991B1B]">NPR {(r.refund_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-[#57534E] max-w-[200px] truncate">{r.refund_reason || "—"}</td>
                      <td className="px-4 py-3 text-xs text-[#A8A29E]">{new Date(r.updated_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 bg-[#FEF2F2] text-[#991B1B]">
                          <CheckCircle className="w-3 h-3" /> Refunded
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Eligible Orders */
        filteredEligible.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E7E5E4] rounded-xl">
            <CheckCircle className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
            <h3 className="font-serif text-lg text-[#0C0A09]">{eligibleOrders.length === 0 ? "No eligible orders" : "No matching orders"}</h3>
            <p className="text-sm text-[#57534E] mt-1">Only paid orders can be refunded.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredEligible.map(order => (
                <motion.div
                  key={order.order_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-[#0C0A09]">{order.order_id}</span>
                      <span className="inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 bg-[#F0FDF4] text-[#166534]">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    </div>
                    <p className="text-sm text-[#57534E] mt-1">{order.end_user_name} — {order.items?.length || 0} items</p>
                    <p className="text-xs text-[#A8A29E] mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-base font-semibold text-[#0C0A09]">NPR {order.total_amount?.toLocaleString()}</span>
                    <button
                      data-testid={`process-refund-${order.order_id}`}
                      onClick={() => openRefundDialog(order)}
                      className="h-9 px-4 bg-[#991B1B] text-white rounded-lg text-sm font-medium hover:bg-[#7F1D1D] transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Process Refund
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      )}

      {/* Refund Processing Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={(open) => { setRefundDialogOpen(open); if (!open) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-md" data-testid="refund-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#991B1B]" /> Process Refund
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="py-4 space-y-4">
              {/* Order Summary */}
              <div className="bg-[#F5F5F4] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#A8A29E]">{selectedOrder.order_id}</span>
                  <span className="text-xs text-[#57534E]">{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium text-[#0C0A09] mt-1">{selectedOrder.end_user_name}</p>
                <div className="mt-2 space-y-1">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-[#57534E]">
                      <span>{item.name} × {item.quantity}</span>
                      <span>NPR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E7E5E4]">
                  <span className="text-sm font-medium text-[#0C0A09]">Order Total</span>
                  <span className="text-sm font-semibold text-[#0C0A09]">NPR {selectedOrder.total_amount?.toLocaleString()}</span>
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Refund Amount (NPR)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={e => setRefundAmount(Number(e.target.value))}
                  data-testid="refund-amount-input"
                  max={selectedOrder.total_amount}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none"
                />
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => setRefundAmount(selectedOrder.total_amount)} className={`text-xs px-2 py-0.5 rounded ${refundAmount === selectedOrder.total_amount ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E]"}`}>Full</button>
                  <button onClick={() => setRefundAmount(Math.round(selectedOrder.total_amount * 0.5))} className={`text-xs px-2 py-0.5 rounded ${refundAmount === Math.round(selectedOrder.total_amount * 0.5) ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E]"}`}>50%</button>
                  <button onClick={() => setRefundAmount(Math.round(selectedOrder.total_amount * 0.25))} className={`text-xs px-2 py-0.5 rounded ${refundAmount === Math.round(selectedOrder.total_amount * 0.25) ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E]"}`}>25%</button>
                </div>
                {refundAmount > selectedOrder.total_amount && (
                  <p className="text-xs text-[#991B1B] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Cannot exceed order total</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Reason *</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  data-testid="refund-reason-input"
                  rows={3}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] outline-none resize-none"
                  placeholder="e.g. Customer requested return, defective product..."
                />
              </div>

              {/* Warning */}
              <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-xs text-[#92400E]">This action will mark the order as refunded and cancel it. This cannot be undone.</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <button onClick={() => setRefundDialogOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]">Cancel</button>
            <button
              onClick={handleProcessRefund}
              disabled={processing || !refundReason.trim() || refundAmount <= 0 || refundAmount > (selectedOrder?.total_amount || 0)}
              data-testid="confirm-refund-btn"
              className="h-10 px-4 bg-[#991B1B] text-white rounded-lg text-sm font-medium hover:bg-[#7F1D1D] disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-3.5 h-3.5" /> Process Refund</>}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
