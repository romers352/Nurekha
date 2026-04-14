import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace("#", "?")).get("session_id");

    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await axios.post(
          `${API}/api/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );
        setUser(data);
        navigate("/dashboard", { replace: true, state: { user: data } });
      } catch {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white" data-testid="auth-callback">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#E7E5E4] border-t-[#0C0A09] rounded-full animate-spin" />
        <span className="text-sm text-[#A8A29E]">Signing you in...</span>
      </div>
    </div>
  );
}
