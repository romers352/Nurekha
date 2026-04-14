import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Plug, Brain, ShoppingBag, FolderOpen, ArrowRight } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const itemV = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const contV = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

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

  const s = stats || { name: "Agent", channel_count: 0, conversation_count: 0, message_count: 0, faq_count: 0, product_count: 0 };

  const cards = [
    { label: "Channels Connected", value: s.channel_count, icon: Plug, href: `/agent/${agentId}/connect`, color: "#6366F1" },
    { label: "Conversations", value: s.conversation_count, icon: MessageSquare, href: `/agent/${agentId}/chat`, color: "#25D366" },
    { label: "Total Messages", value: s.message_count, icon: MessageSquare, href: `/agent/${agentId}/chat`, color: "#1877F2" },
    { label: "FAQs Trained", value: s.faq_count, icon: Brain, href: `/agent/${agentId}/train`, color: "#E4405F" },
    { label: "Products", value: s.product_count, icon: ShoppingBag, href: `/agent/${agentId}/train`, color: "#0C0A09" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="agent-overview">
      <div className="mb-8">
        <h1 className="font-serif text-[28px] text-[#0C0A09]">{s.name || "Agent Overview"}</h1>
        <p className="text-sm text-[#57534E] mt-1">Monitor and manage your AI agent.</p>
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
