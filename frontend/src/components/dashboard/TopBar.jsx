import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, CreditCard, Check } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const titles = {
  "/dashboard": "Overview",
  "/dashboard/agents": "My Agents",
  "/dashboard/billing": "Billing",
  "/dashboard/support": "Support",
  "/dashboard/settings": "Settings",
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const title = titles[location.pathname] || "Dashboard";
  const quota = user?.message_quota || 1000;
  const used = user?.messages_used || 0;
  const remaining = quota - used;
  const pct = Math.min((used / quota) * 100, 100);
  const low = remaining < 100;

  const initials = (user?.full_name || user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        axios.get(`${API}/api/notifications`, { withCredentials: true }),
        axios.get(`${API}/api/notifications/unread-count`, { withCredentials: true }),
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`${API}/api/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => n.notification_id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/api/notifications/mark-all-read`, {}, { withCredentials: true });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div data-testid="topbar" className="h-[60px] bg-white border-b border-[#E7E5E4] sticky top-0 z-40 flex items-center px-6 gap-4">
      {/* Title */}
      <h1 className="font-serif text-xl text-[#0C0A09] flex-1">{title}</h1>

      {/* Quota */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-20 h-1 bg-[#F5F5F4] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: low ? "#991B1B" : "#0C0A09" }} />
        </div>
        <span className="text-xs text-[#57534E] whitespace-nowrap">{used} / {quota}</span>
      </div>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          data-testid="topbar-notifications"
          onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) fetchNotifications(); }}
          className="relative p-2 text-[#A8A29E] hover:text-[#0C0A09] transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#991B1B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#E7E5E4] rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E7E5E4] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0C0A09]">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#57534E] hover:text-[#0C0A09] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-6 h-6 text-[#D6D3D1] mx-auto mb-2" />
                  <p className="text-xs text-[#A8A29E]">No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif.notification_id}
                    onClick={() => !notif.read && markAsRead(notif.notification_id)}
                    className={`px-4 py-3 border-b border-[#F5F5F4] hover:bg-[#FAFAFA] cursor-pointer transition-colors ${!notif.read ? "bg-[#FEFCE8]" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.read && <span className="w-2 h-2 bg-[#991B1B] rounded-full mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0C0A09]">{notif.title}</p>
                        <p className="text-xs text-[#57534E] mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-[#A8A29E] mt-1">{formatTime(notif.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-testid="topbar-avatar" className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-xs font-medium text-[#0C0A09]">
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem data-testid="topbar-profile" onClick={() => navigate("/dashboard/settings")}>
            <User className="w-4 h-4 mr-2" /> View Profile
          </DropdownMenuItem>
          <DropdownMenuItem data-testid="topbar-billing" onClick={() => navigate("/dashboard/billing")}>
            <CreditCard className="w-4 h-4 mr-2" /> Billing
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="topbar-signout" onClick={logout} className="text-[#991B1B]">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
