import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";

function formatError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Email is required");
    if (!password) return setError("Password is required");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(formatError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Column - Dark */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="hidden lg:flex w-[40%] bg-[#0C0A09] flex-col justify-between p-10"
      >
        <Link to="/" className="font-serif text-[28px] text-white">Nurekha</Link>
        <div className="max-w-sm">
          <h2 className="font-serif text-4xl text-white leading-tight">
            Welcome back<br />to Nurekha.
          </h2>
          <p className="text-base text-white/50 mt-4">
            Your agents have been working while you were away.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/[0.08] rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-[#25D366]" />
            <span className="text-sm text-[#D6D3D1]">3,240 messages handled today</span>
          </div>
        </div>
        <div className="bg-white/[0.08] rounded-2xl p-6">
          <p className="text-sm text-[#D6D3D1] italic">&ldquo;Our customers get instant responses even at midnight.&rdquo;</p>
          <p className="text-xs text-[#A8A29E] mt-2">Sita M., Pokhara Hotel</p>
        </div>
      </motion.div>

      {/* Right Column - Form */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="max-w-md w-full px-6 sm:px-8">
          <Link to="/" className="lg:hidden font-serif text-[22px] text-[#0C0A09] block mb-8">Nurekha</Link>
          <h1 className="text-2xl font-semibold text-[#0C0A09]">Sign in</h1>
          <p className="text-sm text-[#57534E] mt-1">Good to see you again.</p>

          {error && (
            <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
              <span className="text-xs text-[#991B1B]">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Email Address</label>
              <input data-testid="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Password</label>
              <div className="relative">
                <input data-testid="login-password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#0C0A09]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-[#D6D3D1] text-[#0C0A09] focus:ring-[#1C1917]" />
                <span className="text-sm text-[#57534E]">Remember me</span>
              </label>
              <Link to="/forgot-password" data-testid="forgot-password-link" className="text-sm text-[#57534E] hover:text-[#0C0A09]">Forgot password?</Link>
            </div>
            <button data-testid="login-submit" type="submit" disabled={loading} className="w-full h-12 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors disabled:opacity-50 flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E7E5E4]" />
            <span className="text-xs text-[#A8A29E]">or</span>
            <div className="flex-1 h-px bg-[#E7E5E4]" />
          </div>

          <button data-testid="login-google" onClick={handleGoogleLogin} className="w-full h-12 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-sm text-[#57534E] text-center mt-6">
            Don't have an account? <Link to="/signup" data-testid="goto-signup" className="text-[#0C0A09] font-medium hover:underline">Sign up free</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
