import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Bot, Check, Loader2, ArrowRight, Clock, CheckCircle, XCircle, Zap } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [creditPacks, setCreditPacks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [buying, setBuying] = useState(null);
  const [showPayMethod, setShowPayMethod] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [creditsRes, histRes] = await Promise.all([
          axios.get(`${API}/api/billing/credits`, { withCredentials: true }),
          axios.get(`${API}/api/billing/history`, { withCredentials: true }),
        ]);
        setCreditPacks(creditsRes.data);
        setPayments(histRes.data);
      } catch {}
    })();
  }, []);

  // Handle payment callback
  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const method = searchParams.get("method");
    const status = searchParams.get("status");
    if (paymentId && status === "success") {
      (async () => {
        setVerifying(true);
        try { await axios.post(`${API}/api/billing/verify`, { payment_id: paymentId, method, pidx: searchParams.get("pidx") }, { withCredentials: true }); refreshUser(); } catch {}
        finally { setVerifying(false); }
      })();
    }
  }, [searchParams, refreshUser]);

  const handleBuy = async (packId, method) => {
    setBuying(packId);
    try {
      await axios.post(`${API}/api/billing/buy-credits`, { pack_id: packId, payment_method: method }, { withCredentials: true });
      refreshUser();
      const { data } = await axios.get(`${API}/api/billing/history`, { withCredentials: true });
      setPayments(data);
      setShowPayMethod(null);
    } catch {}
    finally { setBuying(null); }
  };

  const msgPacks = creditPacks.filter(p => p.type === "messages");
  const agentPacks = creditPacks.filter(p => p.type === "agent");
  const statusColors = { completed: "bg-[#F0FDF4] text-[#166534]", pending: "bg-[#FFFBEB] text-[#92400E]", failed: "bg-[#FEF2F2] text-[#991B1B]" };

  return (
    <div className="p-6 lg:p-8 max-w-5xl" data-testid="billing-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-1">Billing</h1>
      <p className="text-sm text-[#57534E] mb-6">Buy message credits and agent slots.</p>

      {verifying && <div className="mb-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3 flex items-center gap-2"><Loader2 className="w-4 h-4 text-[#1E40AF] animate-spin" /><span className="text-sm text-[#1E40AF]">Verifying payment...</span></div>}

      {/* Current Usage */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#57534E]" /><span className="text-sm text-[#57534E]">Message Credits</span></div>
          <p className="font-serif text-3xl text-[#0C0A09] mt-2">{((user?.message_quota || 1000) - (user?.messages_used || 0)).toLocaleString()}</p>
          <p className="text-xs text-[#A8A29E] mt-0.5">{(user?.messages_used || 0).toLocaleString()} used of {(user?.message_quota || 1000).toLocaleString()}</p>
          <div className="mt-2 w-full h-1.5 bg-[#F5F5F4] rounded-full overflow-hidden"><div className="h-full bg-[#0C0A09] rounded-full" style={{ width: `${Math.min(((user?.messages_used || 0) / (user?.message_quota || 1000)) * 100, 100)}%` }} /></div>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
          <div className="flex items-center gap-2"><Bot className="w-4 h-4 text-[#57534E]" /><span className="text-sm text-[#57534E]">Agent Slots</span></div>
          <p className="font-serif text-3xl text-[#0C0A09] mt-2">{(user?.plan_id === "enterprise" ? 10 : user?.plan_id === "pro" ? 5 : 2) + (user?.extra_agents || 0)}</p>
          <p className="text-xs text-[#A8A29E] mt-0.5">Available slots</p>
        </div>
      </div>

      {/* Message Packs */}
      <h2 className="text-lg font-semibold text-[#0C0A09] mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Buy Message Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {msgPacks.map(pack => (
          <motion.div key={pack.pack_id} whileHover={{ y: -2 }} data-testid={`buy-${pack.pack_id}`} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
            <h3 className="font-semibold text-[#0C0A09]">{pack.name}</h3>
            <div className="flex items-baseline gap-1 mt-2"><span className="text-sm text-[#57534E]">NPR</span><span className="font-serif text-3xl text-[#0C0A09]">{pack.price.toLocaleString()}</span></div>
            <p className="text-xs text-[#A8A29E] mt-0.5">NPR {(pack.price / pack.amount).toFixed(2)} per message</p>
            {showPayMethod === pack.pack_id ? (
              <div className="mt-3 space-y-2">
                <button onClick={() => handleBuy(pack.pack_id, "khalti")} disabled={buying === pack.pack_id} className="w-full h-9 border border-[#E7E5E4] rounded-lg text-xs hover:bg-[#FAFAFA] flex items-center justify-center gap-1">{buying === pack.pack_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay with Khalti"}</button>
                <button onClick={() => handleBuy(pack.pack_id, "esewa")} disabled={buying === pack.pack_id} className="w-full h-9 border border-[#E7E5E4] rounded-lg text-xs hover:bg-[#FAFAFA] flex items-center justify-center gap-1">{buying === pack.pack_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay with eSewa"}</button>
                <button onClick={() => setShowPayMethod(null)} className="w-full text-xs text-[#A8A29E]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowPayMethod(pack.pack_id)} className="mt-3 w-full h-10 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center justify-center gap-1">Buy <ArrowRight className="w-3.5 h-3.5" /></button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Agent Packs */}
      <h2 className="text-lg font-semibold text-[#0C0A09] mb-4 flex items-center gap-2"><Bot className="w-5 h-5" /> Add Agent Slots</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mb-8">
        {agentPacks.map(pack => (
          <motion.div key={pack.pack_id} whileHover={{ y: -2 }} data-testid={`buy-${pack.pack_id}`} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
            <h3 className="font-semibold text-[#0C0A09]">{pack.name}</h3>
            <div className="flex items-baseline gap-1 mt-2"><span className="text-sm text-[#57534E]">NPR</span><span className="font-serif text-3xl text-[#0C0A09]">{pack.price.toLocaleString()}</span><span className="text-xs text-[#A8A29E]">one-time</span></div>
            {showPayMethod === pack.pack_id ? (
              <div className="mt-3 space-y-2">
                <button onClick={() => handleBuy(pack.pack_id, "khalti")} disabled={buying === pack.pack_id} className="w-full h-9 border border-[#E7E5E4] rounded-lg text-xs hover:bg-[#FAFAFA]">{buying === pack.pack_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay with Khalti"}</button>
                <button onClick={() => handleBuy(pack.pack_id, "esewa")} disabled={buying === pack.pack_id} className="w-full h-9 border border-[#E7E5E4] rounded-lg text-xs hover:bg-[#FAFAFA]">{buying === pack.pack_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pay with eSewa"}</button>
                <button onClick={() => setShowPayMethod(null)} className="w-full text-xs text-[#A8A29E]">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowPayMethod(pack.pack_id)} className="mt-3 w-full h-10 border border-[#E7E5E4] text-[#0C0A09] rounded-lg text-sm hover:bg-[#0C0A09] hover:text-white transition-colors">Add Slots</button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#0C0A09] mb-4">Payment History</h2>
          <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
            <table className="w-full"><thead><tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]"><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Date</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Item</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Amount</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Method</th><th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th></tr></thead>
              <tbody>{payments.map(p => (<tr key={p.payment_id} className="border-b border-[#F5F5F4]"><td className="px-4 py-3 text-sm text-[#57534E]">{new Date(p.created_at).toLocaleDateString()}</td><td className="px-4 py-3 text-sm font-medium text-[#0C0A09] capitalize">{p.pack_id || p.plan_id}</td><td className="px-4 py-3 text-sm text-[#57534E]">NPR {p.amount?.toLocaleString()}</td><td className="px-4 py-3 text-sm text-[#57534E] capitalize">{p.method}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 ${statusColors[p.status] || "bg-[#F5F5F4] text-[#57534E]"}`}>{p.status === "completed" ? <CheckCircle className="w-3 h-3" /> : p.status === "failed" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}{p.status}</span></td></tr>))}</tbody></table>
          </div>
        </div>
      )}
    </div>
  );
}
