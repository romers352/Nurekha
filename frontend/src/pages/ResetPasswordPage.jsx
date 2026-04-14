import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Lock, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

function PasswordStrength({ password }) {
  const checks = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/];
  const score = checks.filter(r => r.test(password)).length;
  const colors = ["#991B1B", "#92400E", "#CA8A04", "#166534"];
  return (
    <div className="flex gap-1 mt-1.5">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ backgroundColor: i < score ? colors[score - 1] : "#E7E5E4" }} />
      ))}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0C0A09]">Invalid reset link</h2>
          <p className="text-sm text-[#57534E] mt-2">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-sm text-[#0C0A09] font-medium hover:underline mt-4 inline-block">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6" data-testid="reset-password-page">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-card">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-14 h-14 rounded-2xl bg-[#F5F5F4] flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6 text-[#A8A29E]" />
                </div>
                <h2 className="text-xl font-semibold text-[#0C0A09] text-center mt-4">Create new password</h2>

                {error && <p className="text-xs text-[#991B1B] text-center mt-3">{error}</p>}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">New password</label>
                    <div className="relative">
                      <input data-testid="reset-password" type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E]">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Confirm password</label>
                    <input data-testid="reset-confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" />
                    {confirm && password === confirm && (
                      <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3 text-[#166534]" /><span className="text-xs text-[#166534]">Match</span></div>
                    )}
                  </div>
                  <button data-testid="reset-submit" type="submit" disabled={loading} className="w-full h-11 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors disabled:opacity-50 flex items-center justify-center">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save password"}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 text-[#166534]" />
                </div>
                <h2 className="text-xl font-semibold text-[#0C0A09] mt-4">Password updated!</h2>
                <p className="text-sm text-[#57534E] mt-1">Redirecting to sign in...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
