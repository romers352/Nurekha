import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const title = titles[location.pathname] || "Dashboard";
  const quota = user?.message_quota || 1000;
  const used = user?.messages_used || 0;
  const remaining = quota - used;
  const pct = Math.min((used / quota) * 100, 100);
  const low = remaining < 100;

  const initials = (user?.full_name || user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

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
      <button data-testid="topbar-notifications" className="relative p-2 text-[#A8A29E] hover:text-[#0C0A09] transition-colors">
        <Bell className="w-5 h-5" />
      </button>

      {/* Avatar Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-testid="topbar-avatar" className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-xs font-medium text-[#0C0A09]">
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem data-testid="topbar-profile">View Profile</DropdownMenuItem>
          <DropdownMenuItem data-testid="topbar-billing">Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem data-testid="topbar-signout" onClick={logout} className="text-[#991B1B]">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
