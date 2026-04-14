import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bot, CreditCard, LifeBuoy, Settings } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Bot, label: "Agents", href: "/dashboard/agents" },
  { icon: CreditCard, label: "Billing", href: "/dashboard/billing" },
  { icon: LifeBuoy, label: "Support", href: "/dashboard/support" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const isActive = (href) => href === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(href);

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[60px] bg-white/95 backdrop-blur-md border-t border-[#E7E5E4]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
            >
              <Icon className={`w-[22px] h-[22px] ${active ? "text-[#1C1917]" : "text-[#A8A29E]"}`} />
              <span className={`text-[10px] ${active ? "text-[#1C1917] font-medium" : "text-[#A8A29E]"}`}>{item.label}</span>
              {active && (
                <motion.div
                  layoutId="mobileActiveTab"
                  className="absolute top-1 w-1 h-1 rounded-full bg-[#1C1917]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
