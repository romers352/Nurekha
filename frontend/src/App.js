import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthCallback from "@/components/auth/AuthCallback";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import PricingPage from "@/pages/PricingPage";
import ServicesPage from "@/pages/ServicesPage";
import DashboardLayout from "@/pages/DashboardLayout";
import DashboardOverview from "@/pages/DashboardOverview";
import AgentsPage from "@/pages/AgentsPage";
import BillingPage from "@/pages/BillingPage";
import SupportPage from "@/pages/SupportPage";
import SettingsPage from "@/pages/SettingsPage";
import AgentDashboardLayout from "@/pages/agent/AgentDashboardLayout";
import AgentOverview from "@/pages/agent/AgentOverview";
import ConnectChannelsPage from "@/pages/agent/ConnectChannelsPage";
import TrainAgentPage from "@/pages/agent/TrainAgentPage";
import BusinessChatPage from "@/pages/agent/BusinessChatPage";
import AgentDataPage from "@/pages/agent/AgentDataPage";
import AgentOrdersPage from "@/pages/agent/AgentOrdersPage";
import AgentSettingsPage from "@/pages/agent/AgentSettingsPage";

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id (Emergent Google OAuth callback)
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/services" element={<ServicesPage />} />

      {/* Protected Dashboard */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
      >
        <Route index element={<DashboardOverview />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Protected Agent Dashboard */}
      <Route
        path="/agent/:agentId"
        element={<ProtectedRoute><AgentDashboardLayout /></ProtectedRoute>}
      >
        <Route index element={<AgentOverview />} />
        <Route path="connect" element={<ConnectChannelsPage />} />
        <Route path="train" element={<TrainAgentPage />} />
        <Route path="chat" element={<BusinessChatPage />} />
        <Route path="data" element={<AgentDataPage />} />
        <Route path="orders" element={<AgentOrdersPage />} />
        <Route path="settings" element={<AgentSettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
