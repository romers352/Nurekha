import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white" data-testid="auth-loading">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#E7E5E4] border-t-[#0C0A09] rounded-full animate-spin" />
          <span className="text-sm text-[#A8A29E]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
