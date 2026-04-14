import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Bot, CreditCard, LifeBuoy, Settings,
  LogOut, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Bot, label: "My Agents", href: "/dashboard/agents" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: LifeBuoy, label: "Support", href: "/dashboard/support" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function ClientSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 64 : 256;

  const isActive = (href) => {
    if (href === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(href);
  };

  const initials = (user?.full_name || user?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        data-testid="client-sidebar"
        animate={{ width }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col bg-white border-r border-[#E7E5E4] h-screen sticky top-0 overflow-hidden shrink-0"
      >
        {/* Logo */}
        <div className="px-4 pt-6 pb-2">
          {!collapsed ? (
            <div>
              <Link to="/" className="font-serif text-xl text-[#0C0A09]">Nurekha</Link>
              <p className="text-xs text-[#A8A29E] mt-0.5 truncate">{user?.business_name || "Dashboard"}</p>
            </div>
          ) : (
            <Link to="/" className="font-serif text-xl text-[#0C0A09] block text-center">N</Link>
          )}
        </div>

        <div className="h-px bg-[#E7E5E4] mx-4 my-2" />

        {/* Nav Label */}
        {!collapsed && (
          <p className="px-4 pt-3 pb-2 text-[10px] font-medium tracking-[0.15em] text-[#A8A29E] uppercase">
            Workspace
          </p>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const linkContent = (
              <Link
                to={item.href}
                data-testid={`sidebar-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 h-10 rounded-lg transition-colors relative ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-[#F5F0EB] text-[#1C1917] font-medium"
                    : "text-[#57534E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1C1917] rounded-r"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          data-testid="sidebar-collapse-toggle"
          onClick={() => setCollapsed(!collapsed)}
          className="mx-2 mb-2 h-8 flex items-center justify-center rounded-lg text-[#A8A29E] hover:bg-[#FAFAFA] hover:text-[#0C0A09] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User Section */}
        <div className="border-t border-[#E7E5E4] p-3">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-xs font-medium text-[#0C0A09] shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0C0A09] truncate">{user?.full_name || user?.name}</p>
                <p className="text-xs text-[#A8A29E] truncate">{user?.email}</p>
              </div>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  data-testid="sidebar-logout"
                  onClick={logout}
                  className="text-[#A8A29E] hover:text-[#991B1B] transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>Sign out</p></TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
