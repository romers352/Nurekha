import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, CheckCircle, ChevronLeft, Loader2 } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError("Email is required");
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6" data-testid="forgot-password-page">
      <div className="w-full max-w-md">
        <Link to="/login" data-testid="back-to-login" className="inline-flex items-center gap-1 text-sm text-[#57534E] hover:text-[#0C0A09] mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to sign in
        </Link>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-card">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F4] flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6 text-[#A8A29E]" />
                </div>
                <h2 className="text-xl font-semibold text-[#0C0A09] text-center mt-4">Reset your password</h2>
                <p className="text-sm text-[#57534E] text-center mt-1">Enter your email and we'll send a link. Expires in 1 hour.</p>

                {error && <p className="text-xs text-[#991B1B] text-center mt-3">{error}</p>}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <input data-testid="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="you@example.com" />
                  <button data-testid="forgot-submit" type="submit" disabled={loading} className="w-full h-11 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors disabled:opacity-50 flex items-center justify-center">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#166534]" />
                </div>
                <h2 className="text-xl font-semibold text-[#0C0A09] mt-4">Check your inbox!</h2>
                <p className="text-sm text-[#57534E] mt-1">Sent to <span className="font-medium text-[#0C0A09]">{email}</span></p>
                <button
                  data-testid="resend-btn"
                  disabled={countdown > 0}
                  onClick={handleSubmit}
                  className="mt-5 text-sm text-[#57534E] hover:text-[#0C0A09] disabled:opacity-50"
                >
                  {countdown > 0 ? `Resend in 00:${String(countdown).padStart(2, "0")}` : "Resend link"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
