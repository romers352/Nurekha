import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, AlertTriangle, Copy, Globe, Facebook, Instagram, MessageCircle, Music2 } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const CHANNELS = [
  { id: "facebook", name: "Facebook", description: "Automate Messenger conversations", color: "#1877F2", icon: Facebook },
  { id: "instagram", name: "Instagram", description: "Handle DMs on Instagram", color: "#E4405F", icon: Instagram },
  { id: "whatsapp", name: "WhatsApp", description: "Respond on WhatsApp Business", color: "#25D366", icon: MessageCircle },
  { id: "tiktok", name: "TikTok", description: "Engage TikTok DMs automatically", color: "#010101", icon: Music2 },
  { id: "website", name: "Website Widget", description: "Embed on any website", color: "#6366F1", icon: Globe },
];

function ChannelCard({ channel, agentId, connected, channelData, onRefresh }) {
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = channel.icon;

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await axios.post(`${API}/api/agents/${agentId}/channels`, {
        channel_type: channel.id,
        page_name: `My ${channel.name} Page`,
        page_id: `page_${Date.now()}`,
      }, { withCredentials: true });
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!channelData) return;
    try {
      await axios.delete(`${API}/api/agents/${agentId}/channels/${channelData.channel_id}`, { withCredentials: true });
      onRefresh();
    } catch (err) { console.error(err); }
  };

  const embedCode = `<script src="https://nurekha.com/widget.js" data-agent="${agentId}"></script>`;
  const copyEmbed = () => { navigator.clipboard.writeText(embedCode); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-card"
      data-testid={`channel-card-${channel.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: channel.color + "14" }}>
          <Icon className="w-5 h-5" style={{ color: channel.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-xl text-[#0C0A09]">{channel.name}</h3>
          <p className="text-sm text-[#57534E] mt-0.5">{channel.description}</p>
        </div>
      </div>

      <div className="mt-3">
        <AnimatePresence mode="wait">
          {connected ? (
            <motion.div key="connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-0.5 bg-[#F0FDF4] text-[#166534]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#166534] animate-pulse" />
                Connected
              </span>
              {channelData?.page_name && (
                <p className="text-sm font-medium text-[#0C0A09] mt-2">{channelData.page_name}</p>
              )}
              {channelData?.page_id && (
                <p className="font-mono text-xs text-[#A8A29E] mt-0.5">{channelData.page_id}</p>
              )}

              {/* Website embed code */}
              {channel.id === "website" && (
                <div className="mt-3">
                  <div className="bg-[#0C0A09] rounded-xl p-4 relative">
                    <code className="text-xs text-[#86EFAC] font-mono break-all">{embedCode}</code>
                    <button onClick={copyEmbed} data-testid="copy-embed-code" className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {copied && <p className="text-xs text-[#166534] mt-1">Embed code copied!</p>}
                </div>
              )}

              <button onClick={handleDisconnect} data-testid={`disconnect-${channel.id}`} className="mt-3 w-full h-9 border border-[#E7E5E4] rounded-lg text-sm text-[#A8A29E] hover:text-[#991B1B] hover:border-[#FECACA] transition-colors">
                Disconnect
              </button>
            </motion.div>
          ) : (
            <motion.div key="not-connected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-0.5 bg-[#F5F5F4] text-[#57534E]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]" />
                Not connected
              </span>

              {channel.id === "website" && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-0.5 bg-[#EFF6FF] text-[#1E40AF]">
                    Ready to embed
                  </span>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={connecting}
                data-testid={`connect-${channel.id}`}
                className="mt-3 w-full h-10 border border-[#E7E5E4] text-[#0C0A09] rounded-lg text-sm hover:bg-[#0C0A09] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Connect ${channel.name}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ConnectChannelsPage() {
  const { agentId } = useParams();
  const [channels, setChannels] = useState([]);

  const fetchChannels = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/channels`, { withCredentials: true });
      setChannels(data);
    } catch {}
  };

  useEffect(() => { fetchChannels(); }, [agentId]);

  const getChannelData = (channelType) => channels.find(c => c.channel_type === channelType);

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="connect-channels-page">
      <div className="mb-8 pb-6 border-b border-[#E7E5E4]">
        <h1 className="font-serif text-[28px] text-[#0C0A09]">Connect Channels</h1>
        <p className="text-sm text-[#57534E] mt-1">Link your social pages to this agent.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CHANNELS.map((ch, i) => (
          <ChannelCard
            key={ch.id}
            channel={ch}
            agentId={agentId}
            connected={!!getChannelData(ch.id)}
            channelData={getChannelData(ch.id)}
            onRefresh={fetchChannels}
          />
        ))}
      </div>
    </div>
  );
}
