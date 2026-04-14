import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { User, Shield, Bell, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [profile, setProfile] = useState({ full_name: user?.full_name || "", mobile: user?.mobile || "", business_name: user?.business_name || "" });
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const saveProfile = async () => {
    setSaving(true); setError("");
    try { await axios.put(`${API}/api/auth/profile`, profile, { withCredentials: true }); setSaved("profile"); refreshUser(); setTimeout(() => setSaved(""), 2000); } catch (e) { setError(e.response?.data?.detail || "Error saving"); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setError("");
    if (pwForm.new_password.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setError("Passwords do not match"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/api/auth/change-password`, { current_password: pwForm.current_password, new_password: pwForm.new_password }, { withCredentials: true });
      setSaved("password"); setPwForm({ current_password: "", new_password: "", confirm_password: "" }); setTimeout(() => setSaved(""), 2000);
    } catch (e) { setError(e.response?.data?.detail || "Error changing password"); } finally { setSaving(false); }
  };

  const sections = [
    { key: "profile", label: "Profile", icon: User },
    { key: "security", label: "Security", icon: Shield },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl" data-testid="settings-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-1">Settings</h1>
      <p className="text-sm text-[#57534E] mb-8">Manage your account preferences.</p>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-48 shrink-0 hidden md:block">
          <nav className="space-y-1">{sections.map(s => { const Icon = s.icon; return (<button key={s.key} onClick={() => setActiveSection(s.key)} data-testid={`settings-nav-${s.key}`} className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm transition-colors ${activeSection === s.key ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA]"}`}><Icon className="w-4 h-4" />{s.label}</button>); })}</nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {error && <div className="mb-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-3 text-xs text-[#991B1B]">{error}</div>}

          {activeSection === "profile" && (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6">
              <h2 className="text-base font-semibold text-[#0C0A09] mb-5">Profile Information</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Full Name</label><input data-testid="settings-name" value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Email</label><input disabled value={user?.email || ""} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm bg-[#FAFAFA] text-[#A8A29E]" /></div>
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Mobile</label><input data-testid="settings-mobile" value={profile.mobile} onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Business Name</label><input data-testid="settings-business" value={profile.business_name} onChange={e => setProfile(p => ({ ...p, business_name: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
              </div>
              <div className="mt-5 flex items-center gap-3"><button data-testid="save-profile" onClick={saveProfile} disabled={saving} className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}</button>{saved === "profile" && <span className="text-xs text-[#166534] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}</div>
            </div>
          )}

          {activeSection === "security" && (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6">
              <h2 className="text-base font-semibold text-[#0C0A09] mb-5">Change Password</h2>
              <div className="space-y-4 max-w-sm">
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Current Password</label><div className="relative"><input data-testid="current-pw" type={showPw ? "text" : "password"} value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /><button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A8A29E]">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">New Password</label><input data-testid="new-pw" type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
                <div><label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Confirm New Password</label><input data-testid="confirm-new-pw" type="password" value={pwForm.confirm_password} onChange={e => setPwForm(p => ({ ...p, confirm_password: e.target.value }))} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" /></div>
              </div>
              <div className="mt-5 flex items-center gap-3"><button data-testid="change-pw-btn" onClick={changePassword} disabled={saving} className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}</button>{saved === "password" && <span className="text-xs text-[#166534] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Password changed</span>}</div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6">
              <h2 className="text-base font-semibold text-[#0C0A09] mb-5">Notification Preferences</h2>
              <div className="space-y-4">
                {[{ label: "New messages", desc: "Get notified when customers send messages" }, { label: "New orders", desc: "Get notified for new customer orders" }, { label: "Low message quota", desc: "Alert when quota is running low" }, { label: "Agent status changes", desc: "When an agent goes offline or has errors" }, { label: "Weekly summary", desc: "Weekly report of your business performance" }].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#F5F5F4] last:border-0">
                    <div><p className="text-sm font-medium text-[#0C0A09]">{item.label}</p><p className="text-xs text-[#57534E]">{item.desc}</p></div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
