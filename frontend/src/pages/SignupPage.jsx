import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, CheckCircle, X, Loader2 } from "lucide-react";

const BUSINESS_TYPES = [
  "E-commerce", "Hotel", "Salon/Spa", "Restaurant",
  "Healthcare", "Real Estate", "Travel", "Education", "Other",
];

function formatError(detail) {
  if (detail == null) return "Something went wrong.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(" ");
  if (detail?.msg) return detail.msg;
  return String(detail);
}

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

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", mobile: "", email: "", business_name: "", business_types: [], password: "", confirm_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleType = (t) => {
    set("business_types", form.business_types.includes(t)
      ? form.business_types.filter(x => x !== t)
      : [...form.business_types, t]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name || form.full_name.length < 2) return setError("Full name is required (min 2 chars)");
    if (!/^(98|97)\d{8}$/.test(form.mobile)) return setError("Enter a valid Nepal mobile number (98/97 + 8 digits)");
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    if (!form.business_name) return setError("Business name is required");
    if (form.business_types.length === 0) return setError("Select at least one business type");
    if (form.password.length < 8) return setError("Password must be at least 8 characters");
    if (!/[A-Z]/.test(form.password)) return setError("Password needs at least one uppercase letter");
    if (!/[0-9]/.test(form.password)) return setError("Password needs at least one number");
    if (form.password !== form.confirm_password) return setError("Passwords do not match");
    if (!terms) return setError("You must agree to the Terms of Service");

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        mobile: form.mobile,
        business_name: form.business_name,
        business_types: form.business_types,
        password: form.password,
      });
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
    <div className="min-h-screen flex" data-testid="signup-page">
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
            Start automating your customer conversations.
          </h2>
          <div className="mt-8 space-y-3">
            {["1,000 messages completely free", "2 AI agents included", "All social channels supported", "No credit card required"].map(t => (
              <div key={t} className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-[#A8A29E] shrink-0" />
                <span className="text-sm text-[#D6D3D1]">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/[0.08] rounded-2xl p-6">
          <p className="text-sm text-[#D6D3D1] italic">&ldquo;Nurekha doubled our response rate overnight.&rdquo;</p>
          <p className="text-xs text-[#A8A29E] mt-2">Ramesh S., Kathmandu Boutique</p>
        </div>
      </motion.div>

      {/* Right Column - Form */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-md mx-auto px-6 sm:px-8 py-10 lg:py-12">
          <Link to="/" className="lg:hidden font-serif text-[22px] text-[#0C0A09] block mb-8">Nurekha</Link>
          <h1 className="text-2xl font-semibold text-[#0C0A09]">Create your account</h1>
          <p className="text-sm text-[#57534E] mt-1">Join 200+ Nepali businesses.</p>

          {error && (
            <motion.div initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 flex items-start gap-2">
              <X className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" />
              <span className="text-xs text-[#991B1B]">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Full Name</label>
              <input data-testid="signup-fullname" value={form.full_name} onChange={e => set("full_name", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Your full name" />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Mobile Number</label>
              <div className="flex border border-[#E7E5E4] rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1C1917]">
                <span className="bg-[#F5F5F4] border-r border-[#E7E5E4] px-3 flex items-center text-sm text-[#57534E] shrink-0">+977</span>
                <input data-testid="signup-mobile" value={form.mobile} onChange={e => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} className="flex-1 px-3 py-2.5 text-sm outline-none" placeholder="98XXXXXXXX" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Email Address</label>
              <input data-testid="signup-email" type="email" value={form.email} onChange={e => set("email", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="you@example.com" />
            </div>

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Business Name</label>
              <input data-testid="signup-business" value={form.business_name} onChange={e => set("business_name", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Your business name" />
            </div>

            {/* Business Types */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Business Type</label>
              {form.business_types.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {form.business_types.map(t => (
                    <span key={t} className="bg-[#F5F0EB] text-[#1C1917] text-xs rounded-full px-2.5 py-1 inline-flex items-center gap-1">
                      {t}
                      <button type="button" onClick={() => toggleType(t)} className="hover:text-[#991B1B]"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" data-testid="signup-types-toggle" onClick={() => setTypesOpen(!typesOpen)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm text-left text-[#A8A29E] hover:bg-[#FAFAFA]">
                {form.business_types.length > 0 ? `${form.business_types.length} selected` : "Select business types..."}
              </button>
              {typesOpen && (
                <div className="mt-1 border border-[#E7E5E4] rounded-xl bg-white shadow-lg z-50 overflow-hidden">
                  {BUSINESS_TYPES.map(t => (
                    <button key={t} type="button" data-testid={`type-${t.toLowerCase().replace(/[\s\/]+/g, "-")}`} onClick={() => toggleType(t)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#FAFAFA] ${form.business_types.includes(t) ? "bg-[#F5F0EB]" : ""}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${form.business_types.includes(t) ? "bg-[#0C0A09] border-[#0C0A09]" : "border-[#D6D3D1]"}`}>
                        {form.business_types.includes(t) && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Password</label>
              <div className="relative">
                <input data-testid="signup-password" type={showPassword ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Min 8 chars, 1 uppercase, 1 number" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#0C0A09]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && <PasswordStrength password={form.password} />}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input data-testid="signup-confirm" type={showConfirm ? "text" : "password"} value={form.confirm_password} onChange={e => set("confirm_password", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" placeholder="Confirm your password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#0C0A09]">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirm_password && form.password === form.confirm_password && (
                <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3 text-[#166534]" /><span className="text-xs text-[#166534]">Passwords match</span></div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" data-testid="signup-terms" checked={terms} onChange={e => setTerms(e.target.checked)} className="mt-1 rounded border-[#D6D3D1] text-[#0C0A09] focus:ring-[#1C1917]" />
              <span className="text-xs text-[#57534E]">I agree to the <Link to="/terms" className="underline hover:text-[#0C0A09]">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-[#0C0A09]">Privacy Policy</Link></span>
            </label>

            {/* Submit */}
            <button data-testid="signup-submit" type="submit" disabled={loading} className="w-full h-12 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors disabled:opacity-50 flex items-center justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E7E5E4]" />
            <span className="text-xs text-[#A8A29E]">or</span>
            <div className="flex-1 h-px bg-[#E7E5E4]" />
          </div>

          {/* Google */}
          <button data-testid="signup-google" onClick={handleGoogleLogin} className="w-full h-12 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA] transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="text-sm text-[#57534E] text-center mt-6">
            Already have an account? <Link to="/login" data-testid="goto-login" className="text-[#0C0A09] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
