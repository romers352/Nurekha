import { Outlet } from "react-router-dom";
import ClientSidebar from "@/components/dashboard/ClientSidebar";
import TopBar from "@/components/dashboard/TopBar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#FAFAFA]" data-testid="dashboard-layout">
      <ClientSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
