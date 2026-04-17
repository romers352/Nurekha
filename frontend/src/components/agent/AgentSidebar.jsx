import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Plug, Brain, MessageSquare, Settings, ChevronLeft, ChevronRight, ChevronDown, FileText, BookOpen, Database } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBizConfig, getBizLabel } from "@/config/businessTypes";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AgentSidebar() {
  const { agentId } = useParams();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [agent, setAgent] = useState(null);
  const [aiActive, setAiActive] = useState(true);
  const [trainExpanded, setTrainExpanded] = useState(true); // Train Agent submenu state
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

  const businessType = agent?.business_type || "";
  const bizConfig = getBizConfig(businessType);

  // Check if current path is within Train Agent section
  const isInTrainSection = location.pathname.includes('/train') || 
                          location.pathname.includes('/faqs') || 
                          location.pathname.includes('/docs') ||
                          location.pathname.includes('/schema-builder') ||
                          location.pathname.includes('/data');

  // Auto-expand Train Agent if user is in that section
  useEffect(() => {
    if (isInTrainSection) {
      setTrainExpanded(true);
    }
  }, [isInTrainSection]);

  // Build nav items dynamically from config
  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: `/agent/${agentId}` },
    { icon: Plug, label: "Connect Channels", href: `/agent/${agentId}/connect` },
    { 
      icon: Brain, 
      label: "Train Agent", 
      href: `/agent/${agentId}/train`,
      isExpandable: true,
      expanded: trainExpanded,
      onToggle: () => setTrainExpanded(!trainExpanded),
      children: [
        { icon: Database, label: "Schema Builder", href: `/agent/${agentId}/schema-builder` },
        { icon: BookOpen, label: "FAQs", href: `/agent/${agentId}/faqs` },
        { icon: FileText, label: "Documents", href: `/agent/${agentId}/docs` },
        ...(bizConfig?.dataLabel ? [{ icon: bizConfig.dataIcon, label: bizConfig.dataLabel, href: `/agent/${agentId}/data` }] : []),
      ]
    },
    { icon: MessageSquare, label: "Business Chat", href: `/agent/${agentId}/chat` },
    ...(bizConfig?.extraNav?.map(n => ({ icon: n.icon, label: n.label, href: n.href(agentId) })) || []),
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
        <div className="px-4 pt-4 pb-2">
          <Link to="/dashboard/agents" data-testid="back-to-agents" className="flex items-center gap-1 text-sm text-[#57534E] hover:text-[#0C0A09] transition-colors">
            <ChevronLeft className="w-4 h-4" />{!collapsed && "All agents"}
          </Link>
        </div>
        <div className="h-px bg-[#E7E5E4] mx-4" />

        {!collapsed && agent && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F5F0EB] flex items-center justify-center font-serif text-lg text-[#1C1917] shrink-0">{initials}</div>
              <div className="min-w-0">
                <p className="font-serif text-lg text-[#0C0A09] truncate">{agent.name}</p>
                <p className="text-xs text-[#57534E]">{getBizLabel(businessType)}</p>
              </div>
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="mx-3 mb-2 px-3 py-3 bg-[#FAFAFA] rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#0C0A09]">AI Status</span>
              <Switch checked={aiActive} onCheckedChange={toggleAI} data-testid="ai-status-toggle" />
            </div>
            <p className={`text-xs mt-1 ${aiActive ? "text-[#166534]" : "text-[#A8A29E]"}`}>{aiActive ? "Active" : "Paused"}</p>
          </div>
        )}

        {!collapsed && <p className="px-4 pt-3 pb-2 text-[10px] font-medium tracking-[0.15em] text-[#A8A29E] uppercase">Agent Menu</p>}

        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            // Handle expandable items (Train Agent)
            if (item.isExpandable) {
              const hasActiveChild = item.children?.some(child => isActive(child.href));
              const isTrainActive = active || hasActiveChild;
              
              return (
                <div key={item.href}>
                  {/* Parent Item */}
                  <div className="relative">
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link 
                            to={item.href}
                            className={`flex items-center justify-center h-10 rounded-lg transition-colors ${isTrainActive ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"}`}
                          >
                            {isTrainActive && <motion.div layoutId="agentActiveNav" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1C1917] rounded-r" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                            <Icon className="w-[18px] h-[18px] shrink-0" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <button
                        onClick={item.onToggle}
                        className={`w-full flex items-center gap-3 h-10 px-3 rounded-lg transition-colors ${isTrainActive ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"}`}
                      >
                        {isTrainActive && <motion.div layoutId="agentActiveNav" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1C1917] rounded-r" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                        <Icon className="w-[18px] h-[18px] shrink-0" />
                        <span className="text-sm truncate flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${item.expanded ? "" : "-rotate-90"}`} />
                      </button>
                    )}
                  </div>

                  {/* Child Items */}
                  {!collapsed && (
                    <AnimatePresence>
                      {item.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-6 space-y-0.5 mt-0.5">
                            {item.children?.map(child => {
                              const ChildIcon = child.icon;
                              const childActive = isActive(child.href);
                              return (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className={`flex items-center gap-3 h-9 px-3 rounded-lg transition-colors text-sm ${childActive ? "bg-[#FAFAFA] text-[#1C1917] font-medium" : "text-[#78716C] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"}`}
                                >
                                  <ChildIcon className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{child.label}</span>
                                </Link>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              );
            }

            // Regular items
            const linkContent = (
              <Link to={item.href} data-testid={`agent-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`} className={`flex items-center gap-3 h-10 rounded-lg transition-colors relative ${collapsed ? "justify-center px-0" : "px-3"} ${active ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]"}`}>
                {active && <motion.div layoutId="agentActiveNav" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#1C1917] rounded-r" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
            if (collapsed) return <Tooltip key={item.href}><TooltipTrigger asChild>{linkContent}</TooltipTrigger><TooltipContent side="right"><p>{item.label}</p></TooltipContent></Tooltip>;
            return <div key={item.href}>{linkContent}</div>;
          })}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)} className="mx-2 mb-2 h-8 flex items-center justify-center rounded-lg text-[#A8A29E] hover:bg-[#FAFAFA] hover:text-[#0C0A09]">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="border-t border-[#E7E5E4] p-3">
          <Link to="/dashboard" className={`flex items-center gap-2 text-sm text-[#57534E] hover:text-[#0C0A09] ${collapsed ? "justify-center" : ""}`}>
            <LayoutDashboard className="w-4 h-4" />{!collapsed && "Back to Dashboard"}
          </Link>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
