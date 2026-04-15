import { Outlet } from "react-router-dom";
import AgentSidebar from "@/components/agent/AgentSidebar";
import AgentMobileNav from "@/components/agent/AgentMobileNav";

export default function AgentDashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]" data-testid="agent-dashboard-layout">
      <AgentSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <AgentMobileNav />
        <Outlet />
      </div>
    </div>
  );
}
