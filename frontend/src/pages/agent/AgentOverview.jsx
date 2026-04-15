import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Plug, Brain, ShoppingBag, ArrowRight, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const itemV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const contV = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const CHART_COLORS = ["#0C0A09", "#57534E", "#A8A29E", "#D6D3D1"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E7E5E4] rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-[#0C0A09]">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-[#57534E] mt-0.5">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AgentOverview() {
  const { agentId } = useParams();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/api/agents/${agentId}/stats`, { withCredentials: true });
        setStats(data);
      } catch {}
    })();
  }, [agentId]);

  const s = stats || { name: "Agent", channel_count: 0, conversation_count: 0, message_count: 0, faq_count: 0, product_count: 0, message_distribution: [], daily_activity: [] };

  const cards = [
    { label: "Total Messages Used", value: s.message_count, icon: BarChart3, href: `/agent/${agentId}/chat`, color: "#1877F2" },
    { label: "Channels Connected", value: s.channel_count, icon: Plug, href: `/agent/${agentId}/connect`, color: "#6366F1" },
    { label: "Conversations", value: s.conversation_count, icon: MessageSquare, href: `/agent/${agentId}/chat`, color: "#25D366" },
    { label: "FAQs Trained", value: s.faq_count, icon: Brain, href: `/agent/${agentId}/train`, color: "#E4405F" },
    { label: "Products", value: s.product_count, icon: ShoppingBag, href: `/agent/${agentId}/train`, color: "#0C0A09" },
  ];

  const pieData = (s.message_distribution || []).filter(d => d.value > 0);
  const barData = s.daily_activity || [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="agent-overview">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] text-[#0C0A09]">{s.name || "Agent Overview"}</h1>
        <p className="text-sm text-[#57534E] mt-1">Monitor and manage your AI agent.{s.business_type ? ` Type: ${s.business_type}` : ""}</p>
      </div>

      <motion.div variants={contV} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} variants={itemV} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: c.color + "12" }}>
                <Icon className="w-4 h-4" style={{ color: c.color }} />
              </div>
              <p className="font-serif text-2xl text-[#0C0A09]">{c.value}</p>
              <p className="text-xs text-[#57534E] mt-0.5">{c.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Daily Activity */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-card">
          <h3 className="font-semibold text-[#0C0A09] mb-1">Activity Over Time</h3>
          <p className="text-xs text-[#57534E] mb-4">Messages over the last 7 days</p>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#A8A29E" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messages" fill="#0C0A09" radius={[4, 4, 0, 0]} maxBarSize={40} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#A8A29E]">No activity data yet.</div>
          )}
        </motion.div>

        {/* Pie Chart - Message Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-[#E7E5E4] rounded-xl p-6 shadow-card">
          <h3 className="font-semibold text-[#0C0A09] mb-1">Message Distribution</h3>
          <p className="text-xs text-[#57534E] mb-4">By sender type</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-[#A8A29E]">
              <div className="text-center">
                <MessageSquare className="w-8 h-8 text-[#D6D3D1] mx-auto mb-2" />
                <p>Start conversations to see message distribution.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Connect Channels", desc: "Link your Facebook, Instagram, WhatsApp pages", href: `/agent/${agentId}/connect`, icon: Plug },
          { title: "Train Your Agent", desc: "Add FAQs, products, and business info", href: `/agent/${agentId}/train`, icon: Brain },
          { title: "View Conversations", desc: "See and manage customer messages", href: `/agent/${agentId}/chat`, icon: MessageSquare },
        ].map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.href} data-testid={`quick-${action.title.toLowerCase().replace(/\s+/g, "-")}`} className="bg-white border border-[#E7E5E4] rounded-xl p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all group">
              <Icon className="w-5 h-5 text-[#57534E] mb-3" />
              <h3 className="font-semibold text-[#0C0A09] text-sm">{action.title}</h3>
              <p className="text-xs text-[#57534E] mt-1">{action.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0C0A09] mt-3 group-hover:underline">
                Go <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
