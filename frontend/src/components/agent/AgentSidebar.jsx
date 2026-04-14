import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Plug, Brain, MessageSquare, FolderOpen,
  ShoppingBag, Settings, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AgentSidebar() {
  const { agentId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [agent, setAgent] = useState(null);
  const [aiActive, setAiActive] = useState(true);
  const width = collapsed ? 64 : 256;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/agents/${agentId}`, { withCredentials: true });
        setAgent(data);
        setAiActive(data.status === "active");
      } catch {}
    })();
  }, [agentId]);

  const toggleAI = async () => {
    const newStatus = !aiActive;
    setAiActive(newStatus);
    try {
      await axios.patch(`${API}/api/agents/${agentId}`, { status: newStatus ? "active" : "paused" }, { withCredentials: true });
    } catch {}
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: `/agent/${agentId}` },
    { icon: Plug, label: "Connect Channels", href: `/agent/${agentId}/connect` },
    { icon: Brain, label: "Train Agent", href: `/agent/${agentId}/train` },
    { icon: MessageSquare, label: "Business Chat", href: `/agent/${agentId}/chat` },
    { icon: FolderOpen, label: "Uploaded Data", href: `/agent/${agentId}/data` },
    { icon: ShoppingBag, label: "Orders", href: `/agent/${agentId}/orders` },
    { icon: Settings, label: "Agent Settings", href: `/agent/${agentId}/settings` },
  ];

  const isActive = (href) => {
    if (href === `/agent/${agentId}`) return location.pathname === `/agent/${agentId}`;
    return location.pathname.startsWith(href);
  };

  const initials = (agent?.name || "A").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        data-testid="agent-sidebar"
        animate={{ width }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex flex-col bg-white border-r border-[#E7E5E4] h-screen sticky top-0 overflow-hidden shrink-0"
      >
        {/* Back link */}
        <div className="px-4 pt-4 pb-2">
          <Link to="/dashboard/agents" data-testid="back-to-agents" className="flex items-center gap-1 text-sm text-[#57534E] hover:text-[#0C0A09] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {!collapsed && "All agents"}
          </Link>
        </div>
        <div className="h-px bg-[#E7E5E4] mx-4" />

        {/* Agent Identity */}
        {!collapsed && agent && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center font-serif text-lg text-[#1C1917] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-lg text-[#0C0A09] truncate">{agent.name}</p>
                <p className="font-mono text-xs text-[#A8A29E] truncate">{agentId?.slice(0, 12)}...</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Status Toggle */}
        {!collapsed && (
          <div className="mx-3 mb-2 px-3 py-3 bg-[#FAFAFA] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#0C0A09]">AI Status</span>
              <Switch checked={aiActive} onCheckedChange={toggleAI} data-testid="ai-status-toggle" />
            </div>
            <p className={`text-xs mt-1 transition-colors ${aiActive ? "text-[#166534]" : "text-[#A8A29E]"}`}>
              {aiActive ? "Active" : "Paused"}
            </p>
          </div>
        )}

        {/* Nav Label */}
        {!collapsed && (
          <p className="px-4 pt-3 pb-2 text-[10px] font-medium tracking-[0.15em] text-[#A8A29E] uppercase">Agent Menu</p>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const linkContent = (
              <Link
                to={item.href}
                data-testid={`agent-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`flex items-center gap-3 h-10 rounded-lg transition-colors relative ${collapsed ? "justify-center px-0" : "px-3"} ${active ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"}`}
              >
                {active && <motion.div layoutId="agentActiveNav" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1C1917] rounded-r" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
            if (collapsed) {
              return <Tooltip key={item.href}><TooltipTrigger asChild>{linkContent}</TooltipTrigger><TooltipContent side="right"><p>{item.label}</p></TooltipContent></Tooltip>;
            }
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        {/* Collapse */}
        <button onClick={() => setCollapsed(!collapsed)} data-testid="agent-sidebar-collapse" className="mx-2 mb-2 h-8 flex items-center justify-center rounded-lg text-[#A8A29E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Back to Dashboard */}
        <div className="border-t border-[#E7E5E4] p-3">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm text-[#57534E] hover:text-[#0C0A09] ${collapsed ? "justify-center" : ""}`}>
            <LayoutDashboard className="w-4 h-4" />
            {!collapsed && "Back to Dashboard"}
          </Link>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
