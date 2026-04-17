import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { LayoutDashboard, Plug, Brain, MessageSquare, Settings, ChevronLeft, Menu, X, ChevronDown, FileText, BookOpen, Database } from "lucide-react";
import { getBizConfig, getBizLabel } from "@/config/businessTypes";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AgentMobileNav() {
  const { agentId } = useParams();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState(null);
  const [trainExpanded, setTrainExpanded] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data } = await axios.get(`${API}/api/agents/${agentId}`, { withCredentials: true }); setAgent(data); } catch {}
    })();
  }, [agentId]);

  const businessType = agent?.business_type || "";
  const bizConfig = getBizConfig(businessType);

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: `/agent/${agentId}` },
    { icon: Plug, label: "Connect Channels", href: `/agent/${agentId}/connect` },
    { 
      icon: Brain, 
      label: "Train Agent", 
      href: `/agent/${agentId}/train`,
      isExpandable: true,
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

  const currentPage = navItems.find(n => isActive(n.href));

  return (
    <>
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#E7E5E4] h-14 flex items-center px-4 gap-3">
        <Link to="/dashboard/agents" className="text-[#57534E] hover:text-[#0C0A09]"><ChevronLeft className="w-5 h-5" /></Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0C0A09] truncate">{agent?.name || "Agent"}</p>
          <p className="text-[10px] text-[#A8A29E]">{currentPage?.label || "Overview"}</p>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 text-[#57534E] hover:text-[#0C0A09]">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/20 z-40" onClick={() => setOpen(false)} />
          <div className="lg:hidden fixed top-14 right-0 bottom-0 w-64 bg-white border-l border-[#E7E5E4] z-50 overflow-y-auto shadow-xl">
            {agent && (
              <div className="px-4 py-3 border-b border-[#E7E5E4]">
                <p className="text-xs text-[#A8A29E] uppercase tracking-wide">Agent</p>
                <p className="text-sm font-medium text-[#0C0A09] mt-0.5">{agent.name}</p>
                <p className="text-xs text-[#57534E]">{getBizLabel(businessType)}</p>
              </div>
            )}
            <nav className="p-2 space-y-0.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                // Handle expandable items
                if (item.isExpandable) {
                  const hasActiveChild = item.children?.some(child => isActive(child.href));
                  const isTrainActive = active || hasActiveChild;
                  
                  return (
                    <div key={item.href}>
                      <button
                        onClick={() => setTrainExpanded(!trainExpanded)}
                        className={`w-full flex items-center gap-3 h-11 px-3 rounded-lg transition-colors text-sm ${isTrainActive ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA]"}`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${trainExpanded ? "" : "-rotate-90"}`} />
                      </button>
                      {trainExpanded && (
                        <div className="pl-6 space-y-0.5 mt-0.5">
                          {item.children?.map(child => {
                            const ChildIcon = child.icon;
                            const childActive = isActive(child.href);
                            return (
                              <Link
                                key={child.href}
                                to={child.href}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-colors text-sm ${childActive ? "bg-[#FAFAFA] text-[#1C1917] font-medium" : "text-[#78716C] hover:bg-[#FAFAFA]"}`}
                              >
                                <ChildIcon className="w-4 h-4" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Regular items
                return (
                  <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 h-11 px-3 rounded-lg transition-colors text-sm ${active ? "bg-[#F5F0EB] text-[#1C1917] font-medium" : "text-[#57534E] hover:bg-[#FAFAFA]"}`}>
                    <Icon className="w-[18px] h-[18px]" />{item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-[#E7E5E4] p-3 mt-2">
              <Link to="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm text-[#57534E] hover:text-[#0C0A09]">
                <LayoutDashboard className="w-4 h-4" /> Back to Dashboard
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
