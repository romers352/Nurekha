import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, BarChart3, Gauge, Bot, ArrowUpRight } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function StatCard({ label, value, icon: Icon, trend, trendUp, danger }) {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#57534E]">{label}</span>
        <div className="w-8 h-8 bg-[#F5F5F4] rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#57534E]" />
        </div>
      </div>
      <p className={`font-serif text-3xl font-bold mt-2 ${danger ? "text-[#991B1B]" : "text-[#0C0A09]"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trendUp ? "text-[#166534]" : "text-[#991B1B]"}`}>
          <ArrowUpRight className={`w-3 h-3 ${!trendUp ? "rotate-90" : ""}`} />
          {trend}
        </div>
      )}
    </motion.div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          axios.get(`${API}/api/dashboard/stats`, { withCredentials: true }),
          axios.get(`${API}/api/agents`, { withCredentials: true }),
        ]);
        setStats(statsRes.data);
        setAgents(agentsRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    })();
  }, []);

  const s = stats || { message_quota: user?.message_quota || 1000, messages_used: user?.messages_used || 0, remaining: (user?.message_quota || 1000) - (user?.messages_used || 0), active_agents: 0 };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="dashboard-overview">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] text-[#0C0A09]">Overview</h1>
        <p className="text-sm text-[#57534E] mt-1">Welcome back, {user?.full_name || user?.name || "there"}.</p>
      </div>

      {/* Stat Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Messages" value={s.message_quota} icon={MessageCircle} />
        <StatCard label="Messages Used" value={s.messages_used} icon={BarChart3} trend="+12% this week" trendUp />
        <StatCard label="Remaining" value={s.remaining} icon={Gauge} danger={s.remaining < 100} />
        <StatCard label="Active Agents" value={s.active_agents} icon={Bot} />
      </motion.div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-card">
          <h3 className="font-semibold text-[#0C0A09]">Quick Start</h3>
          <p className="text-sm text-[#57534E] mt-1">Create your first AI agent and connect it to your social pages.</p>
          <a href="/dashboard/agents" data-testid="quick-create-agent" className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#0C0A09] hover:underline">
            Create Agent <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-card">
          <h3 className="font-semibold text-[#0C0A09]">Message Quota</h3>
          <p className="text-sm text-[#57534E] mt-1">You have {s.remaining.toLocaleString()} messages remaining on your {user?.plan_id || "free"} plan.</p>
          <div className="mt-3 w-full h-2 bg-[#F5F5F4] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((s.messages_used / s.message_quota) * 100, 100)}%`, backgroundColor: s.remaining < 100 ? "#991B1B" : "#0C0A09" }} />
          </div>
        </motion.div>
      </div>

      {/* Recent Agents */}
      {agents.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#0C0A09] mb-4">Your Agents</h2>
          <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-card">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Agent</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium hidden md:table-cell">Agent ID</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium">Status</th>
                  <th className="text-left text-xs uppercase tracking-wide text-[#A8A29E] px-4 py-3 font-medium hidden sm:table-cell">Messages</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent.agent_id} className="border-b border-[#F5F5F4] hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-[#0C0A09]">{agent.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[#A8A29E] hidden md:table-cell">{agent.agent_id.slice(0, 12)}...</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-0.5 ${agent.status === "active" ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#F5F5F4] text-[#57534E]"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${agent.status === "active" ? "bg-[#166534]" : "bg-[#A8A29E]"}`} />
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#57534E] hidden sm:table-cell">{agent.messages_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
