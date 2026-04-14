import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Check, CreditCard, Loader2, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const PLAN_FEATURES = {
  free: ["1,000 messages/month", "2 AI agents", "All 5 channels", "Basic analytics", "Email support"],
  pro: ["10,000 messages/month", "5 AI agents", "All 5 channels", "Advanced analytics", "Priority support", "Custom AI tone"],
  enterprise: ["100,000 messages/month", "10 AI agents", "All 5 channels", "Full analytics dashboard", "Dedicated support", "Custom integrations", "API access"],
};

function PlanCard({ plan, currentPlan, onSelect, loading }) {
  const isCurrent = currentPlan === plan.plan_id;
  const popular = plan.plan_id === "pro";
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-white border rounded-2xl p-6 shadow-card ${popular ? "border-[#0C0A09] ring-1 ring-[#0C0A09]" : "border-[#E7E5E4]"}`}
      data-testid={`plan-card-${plan.plan_id}`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0C0A09] text-white text-xs font-medium px-3 py-1 rounded-full">
          Most Popular
        </span>
      )}
      <h3 className="font-serif text-2xl text-[#0C0A09]">{plan.name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        {plan.price === 0 ? (
          <span className="font-serif text-4xl text-[#0C0A09]">Free</span>
        ) : (
          <>
            <span className="text-sm text-[#57534E]">NPR</span>
            <span className="font-serif text-4xl text-[#0C0A09]">{plan.price.toLocaleString()}</span>
            <span className="text-sm text-[#A8A29E]">/month</span>
          </>
        )}
      </div>
      <ul className="mt-5 space-y-2.5">
        {PLAN_FEATURES[plan.plan_id]?.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-[#57534E]">
            <Check className="w-4 h-4 text-[#166534] shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <button
        data-testid={`select-plan-${plan.plan_id}`}
        onClick={() => onSelect(plan.plan_id)}
        disabled={isCurrent || plan.price === 0 || loading}
        className={`mt-6 w-full h-11 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          isCurrent ? "bg-[#F5F0EB] text-[#0C0A09] cursor-default"
          : plan.price === 0 ? "bg-[#F5F5F4] text-[#A8A29E] cursor-default"
          : "bg-[#0C0A09] text-white hover:bg-[#1C1917]"
        } disabled:opacity-60`}
      >
        {isCurrent ? "Current Plan" : plan.price === 0 ? "Default Plan" : loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Upgrade <ArrowRight className="w-3.5 h-3.5" /></>}
      </button>
    </motion.div>
  );
}

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, histRes] = await Promise.all([
          axios.get(`${API}/api/billing/plans`, { withCredentials: true }),
          axios.get(`${API}/api/billing/history`, { withCredentials: true }),
        ]);
        setPlans(plansRes.data);
        setPayments(histRes.data);
      } catch {}
    })();
  }, []);

  // Handle payment callback
  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const method = searchParams.get("method");
    const status = searchParams.get("status");
    const pidx = searchParams.get("pidx");
    if (paymentId && status === "success") {
      (async () => {
        setVerifying(true);
        try {
          await axios.post(`${API}/api/billing/verify`, { payment_id: paymentId, method, pidx }, { withCredentials: true });
          refreshUser();
          const { data } = await axios.get(`${API}/api/billing/history`, { withCredentials: true });
          setPayments(data);
        } catch {}
        finally { setVerifying(false); }
      })();
    }
  }, [searchParams, refreshUser]);

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePay = async (method) => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/billing/initiate`, { plan_id: selectedPlan, payment_method: method }, { withCredentials: true });
      if (method === "khalti" && data.payment_url) {
        window.location.href = data.payment_url;
      } else if (method === "esewa" && data.esewa_form) {
        // Create and submit form
        const form = document.createElement("form");
        form.method = "POST";
        form.action = data.esewa_form.url;
        Object.entries(data.esewa_form.fields).forEach(([key, val]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = val;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statusColors = {
    completed: "bg-[#F0FDF4] text-[#166534]",
    pending: "bg-[#FFFBEB] text-[#92400E]",
    failed: "bg-[#FEF2F2] text-[#991B1B]",
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="billing-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-1">Billing</h1>
      <p className="text-sm text-[#57534E] mb-8">
        Current plan: <span className="font-medium text-[#0C0A09] capitalize">{user?.plan_id || "free"}</span>
      </p>

      {verifying && (
        <div className="mb-6 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-[#1E40AF] animate-spin" />
          <span className="text-sm text-[#1E40AF]">Verifying your payment...</span>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => (
          <PlanCard key={plan.plan_id} plan={plan} currentPlan={user?.plan_id} onSelect={handleSelectPlan} loading={loading && selectedPlan === plan.plan_id} />
        ))}
      </div>

      {/* Payment Method Modal */}
      {showPayment && selectedPlan && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowPayment(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-modal" onClick={e => e.stopPropagation()} data-testid="payment-method-modal">
            <h3 className="font-serif text-xl text-[#0C0A09]">Choose Payment Method</h3>
            <p className="text-sm text-[#57534E] mt-1">
              Upgrading to <span className="font-medium capitalize">{selectedPlan}</span> — NPR {PLANS[selectedPlan]?.price?.toLocaleString() || plans.find(p => p.plan_id === selectedPlan)?.price?.toLocaleString()}/month
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button data-testid="pay-esewa" onClick={() => handlePay("esewa")} disabled={loading} className="border border-[#E7E5E4] rounded-xl p-4 text-center hover:bg-[#F5F0EB] hover:border-[#0C0A09] transition-colors group">
                <div className="w-10 h-10 bg-[#60BB46]/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-[#60BB46]">e</span>
                </div>
                <p className="text-sm font-medium text-[#0C0A09] mt-2">eSewa</p>
                <p className="text-xs text-[#A8A29E] mt-0.5">Test Mode</p>
              </button>
              <button data-testid="pay-khalti" onClick={() => handlePay("khalti")} disabled={loading} className="border border-[#E7E5E4] rounded-xl p-4 text-center hover:bg-[#F5F0EB] hover:border-[#0C0A09] transition-colors group">
                <div className="w-10 h-10 bg-[#5C2D91]/10 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold text-[#5C2D91]">K</span>
                </div>
                <p className="text-sm font-medium text-[#0C0A09] mt-2">Khalti</p>
                <p className="text-xs text-[#A8A29E] mt-0.5">Test Mode</p>
              </button>
            </div>
            <button onClick={() => setShowPayment(false)} className="mt-4 w-full h-10 border border-[#E7E5E4] rounded-lg text-sm text-[#57534E]">Cancel</button>
          </motion.div>
        </motion.div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-[#0C0A09] mb-4">Payment History</h2>
          <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Date</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Plan</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Amount</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Method</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.payment_id} className="border-b border-[#F5F5F4]">
                    <td className="px-4 py-3 text-sm text-[#57534E]">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0C0A09] capitalize">{p.plan_id}</td>
                    <td className="px-4 py-3 text-sm text-[#57534E]">NPR {p.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-[#57534E] capitalize">{p.method}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 ${statusColors[p.status] || "bg-[#F5F5F4] text-[#57534E]"}`}>
                        {p.status === "completed" ? <CheckCircle className="w-3 h-3" /> : p.status === "failed" ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
