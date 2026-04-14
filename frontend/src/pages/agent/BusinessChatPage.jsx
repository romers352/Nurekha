import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Send, Paperclip, PauseCircle,
  ArrowUp, ChevronLeft, Facebook, Instagram, MessageCircle, Music2, Globe,
  Wifi, WifiOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API.replace("https://", "wss://").replace("http://", "ws://");

const channelIcons = { facebook: Facebook, instagram: Instagram, whatsapp: MessageCircle, tiktok: Music2, website: Globe };
const channelColors = { facebook: "#1877F2", instagram: "#E4405F", whatsapp: "#25D366", tiktok: "#010101", website: "#6366F1" };

function ConversationItem({ conv, active, onClick }) {
  const ChannelIcon = channelIcons[conv.channel] || Globe;
  const initials = (conv.end_user_name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const time = conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <button
      onClick={onClick}
      data-testid={`conv-item-${conv.conv_id}`}
      className={`w-full h-16 px-3 flex items-center gap-2.5 border-b border-[#F5F5F4] cursor-pointer transition-colors text-left ${active ? "bg-[#F5F0EB] border-l-2 border-l-[#0C0A09]" : "hover:bg-[#FAFAFA]"}`}
    >
      {/* Avatar + Channel badge */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#F5F5F4] flex items-center justify-center text-xs font-medium text-[#0C0A09]">
          {initials}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: channelColors[conv.channel] || "#6366F1" }}>
          <ChannelIcon className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Name & last message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0C0A09] truncate">{conv.end_user_name}</p>
        <p className="text-xs text-[#A8A29E] truncate">{conv.last_message || "No messages yet"}</p>
      </div>

      {/* Time & AI dot */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-[#A8A29E]">{time}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${conv.ai_enabled ? "bg-[#22C55E]" : "bg-[#D6D3D1]"}`} />
      </div>
    </button>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.sender_type === "user";
  const isAI = msg.sender_type === "ai";
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 max-w-[70%]">
        <div className="w-7 h-7 rounded-full bg-[#F5F5F4] flex items-center justify-center text-[10px] font-medium text-[#57534E] shrink-0 mt-1">U</div>
        <div>
          <div className="bg-white border border-[#E7E5E4] rounded-r-2xl rounded-tl-2xl px-4 py-2.5">
            <p className="text-sm text-[#0C0A09] leading-relaxed">{msg.content}</p>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1 ml-1">{time}</p>
        </div>
      </motion.div>
    );
  }

  if (isAI) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[70%]">
          <div className="bg-[#0C0A09] rounded-l-2xl rounded-tr-2xl px-4 py-2.5">
            <span className="inline-block bg-white/10 text-white/60 text-[10px] px-1.5 rounded mb-1">AI</span>
            <p className="text-sm text-white leading-relaxed">{msg.content}</p>
          </div>
          <p className="text-xs text-[#A8A29E] mt-1 text-right">{time}</p>
        </div>
      </motion.div>
    );
  }

  // Agent message
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
      <div className="max-w-[70%]">
        <div className="bg-[#F5F0EB] border border-[#E7E5E4] rounded-l-2xl rounded-tr-2xl px-4 py-2.5">
          <span className="text-[10px] text-[#A8A29E] block mb-0.5">You</span>
          <p className="text-sm text-[#0C0A09] leading-relaxed">{msg.content}</p>
        </div>
        <p className="text-xs text-[#A8A29E] mt-1 text-right">{time}</p>
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 max-w-[70%]">
      <div className="w-7 h-7 rounded-full bg-[#F5F5F4] shrink-0 mt-1" />
      <div className="bg-white border border-[#E7E5E4] rounded-2xl px-4 py-3 inline-flex gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#A8A29E]" style={{ animation: `typing 0.6s ease-in-out ${i * 0.15}s infinite alternate` }} />
        ))}
        <style>{`@keyframes typing { 0% { transform: translateY(0); } 100% { transform: translateY(-4px); } }`}</style>
      </div>
    </div>
  );
}

export default function BusinessChatPage() {
  const { agentId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [showList, setShowList] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/conversations`, { withCredentials: true });
      setConversations(data);
    } catch {}
  }, [agentId]);

  const fetchMessages = async (convId) => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/conversations/${convId}/messages`, { withCredentials: true });
      setMessages(data);
    } catch {}
  };

  // WebSocket connection
  useEffect(() => {
    if (!activeConv) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
      return;
    }

    const convId = activeConv.conv_id;
    const ws = new WebSocket(`${WS_URL}/ws/chat/${convId}`);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setMessages(prev => {
          if (prev.some(m => m.msg_id === msg.msg_id)) return prev;
          return [...prev, msg];
        });
        fetchConversations();
      } catch {}
    };

    return () => {
      ws.close();
      setWsConnected(false);
    };
  }, [activeConv, fetchConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (activeConv) fetchMessages(activeConv.conv_id); }, [activeConv]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const selectConv = (conv) => {
    setActiveConv(conv);
    setShowList(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeConv) return;
    setSending(true);

    // Try WebSocket first
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ content: inputText, sender_type: "agent" }));
      setInputText("");
      setSending(false);
      return;
    }

    // Fallback to HTTP
    try {
      await axios.post(`${API}/api/agents/${agentId}/conversations/${activeConv.conv_id}/messages`, { content: inputText, sender_type: "agent" }, { withCredentials: true });
      setInputText("");
      fetchMessages(activeConv.conv_id);
      fetchConversations();
    } catch {}
    finally { setSending(false); }
  };

  const toggleAI = async () => {
    if (!activeConv) return;
    const newVal = !activeConv.ai_enabled;
    setActiveConv(prev => ({ ...prev, ai_enabled: newVal }));
    try {
      await axios.patch(`${API}/api/agents/${agentId}/conversations/${activeConv.conv_id}`, { ai_enabled: newVal }, { withCredentials: true });
    } catch {}
  };

  const createDemoConv = async () => {
    const names = ["Aarav Sharma", "Sita Thapa", "Rajesh Gurung", "Maya Rai", "Bikram KC"];
    const channels = ["facebook", "instagram", "whatsapp", "tiktok", "website"];
    const name = names[Math.floor(Math.random() * names.length)];
    const ch = channels[Math.floor(Math.random() * channels.length)];
    try {
      await axios.post(`${API}/api/agents/${agentId}/conversations`, { end_user_name: name, channel: ch }, { withCredentials: true });
      fetchConversations();
    } catch {}
  };

  const filtered = conversations.filter(c => {
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    if (search && !c.end_user_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filters = ["all", "facebook", "instagram", "whatsapp", "tiktok", "website"];
  const filterLabels = { all: "All", facebook: "FB", instagram: "IG", whatsapp: "WA", tiktok: "TT", website: "Web" };

  return (
    <div className="h-[calc(100vh-0px)] flex overflow-hidden" data-testid="business-chat-page">
      {/* Panel 1: Conversation List */}
      <div className={`w-full lg:w-[280px] border-r border-[#E7E5E4] bg-white flex flex-col shrink-0 ${!showList ? "hidden lg:flex" : "flex"}`}>
        {/* Search */}
        <div className="p-3 border-b border-[#E7E5E4]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input data-testid="chat-search" value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 bg-[#F5F5F4] rounded-lg border-0 pl-9 pr-3 text-sm outline-none" placeholder="Search conversations..." />
          </div>
          {/* Channel filters */}
          <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-hide">
            {filters.map(f => (
              <button key={f} data-testid={`filter-${f}`} onClick={() => setChannelFilter(f)} className={`h-7 px-3 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors ${channelFilter === f ? "bg-[#0C0A09] text-white" : "bg-[#F5F5F4] text-[#57534E]"}`}>
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare className="w-8 h-8 text-[#A8A29E] mx-auto" />
              <p className="text-sm text-[#57534E] mt-3">No conversations yet</p>
              <button data-testid="create-demo-conv" onClick={createDemoConv} className="mt-3 text-xs text-[#0C0A09] font-medium hover:underline">
                Create demo conversation
              </button>
            </div>
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.conv_id}
                conv={conv}
                active={activeConv?.conv_id === conv.conv_id}
                onClick={() => selectConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Panel 2: Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 ${showList ? "hidden lg:flex" : "flex"}`}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="h-14 bg-white border-b border-[#E7E5E4] flex items-center px-4 gap-3 shrink-0">
              <button onClick={() => setShowList(true)} className="lg:hidden p-1 text-[#57534E]" data-testid="back-to-list">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-[#F5F5F4] flex items-center justify-center text-xs font-medium text-[#0C0A09]">
                {(activeConv.end_user_name || "U")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0C0A09] truncate">{activeConv.end_user_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1" data-testid="ws-status">
                  {wsConnected ? <Wifi className="w-3 h-3 text-[#166534]" /> : <WifiOff className="w-3 h-3 text-[#A8A29E]" />}
                  <span className={`text-[10px] ${wsConnected ? "text-[#166534]" : "text-[#A8A29E]"}`}>
                    {wsConnected ? "Live" : "Offline"}
                  </span>
                </div>
                <span className={`text-xs ${activeConv.ai_enabled ? "text-[#166534]" : "text-[#A8A29E]"}`}>
                  {activeConv.ai_enabled ? "AI handling" : "AI paused"}
                </span>
                <Switch checked={activeConv.ai_enabled} onCheckedChange={toggleAI} data-testid="chat-ai-toggle" />
              </div>
            </div>

            {/* AI Paused Banner */}
            <AnimatePresence>
              {!activeConv.ai_enabled && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 36, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-center overflow-hidden shrink-0">
                  <PauseCircle className="w-3.5 h-3.5 text-[#D97706] mr-1.5" />
                  <span className="text-xs text-[#92400E]">You are handling this conversation.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FAFAFA]">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-[#A8A29E]">No messages yet. Send the first message.</p>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.msg_id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-white border-t border-[#E7E5E4] p-3 shrink-0">
              <div className="flex items-end gap-2">
                <button className="w-9 h-9 rounded-lg bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4] flex items-center justify-center shrink-0">
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  data-testid="chat-input"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-32 bg-[#F5F5F4] rounded-xl px-4 py-2.5 text-sm border-0 outline-none resize-none"
                  placeholder="Type a message..."
                />
                <button
                  data-testid="send-message-btn"
                  onClick={sendMessage}
                  disabled={!inputText.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-[#0C0A09] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-[#D6D3D1] mx-auto" />
              <p className="text-base text-[#57534E] mt-3">Select a conversation</p>
              <p className="text-sm text-[#A8A29E] mt-1">Choose from the list or create a new one.</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel 3: User Profile (lg only) */}
      <div className="hidden xl:flex w-[300px] border-l border-[#E7E5E4] bg-white flex-col shrink-0 overflow-y-auto">
        {activeConv ? (
          <div className="p-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5F5F4] flex items-center justify-center text-lg font-medium text-[#0C0A09] mx-auto">
                {(activeConv.end_user_name || "U")[0]}
              </div>
              <p className="text-lg font-semibold text-[#0C0A09] mt-3">{activeConv.end_user_name}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {(() => { const Icon = channelIcons[activeConv.channel] || Globe; return <Icon className="w-3.5 h-3.5" style={{ color: channelColors[activeConv.channel] }} />; })()}
                <span className="text-xs text-[#57534E] capitalize">{activeConv.channel}</span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-[#A8A29E] mb-2">Recent Orders</p>
              <div className="text-center py-4 bg-[#FAFAFA] rounded-xl">
                <p className="text-xs text-[#A8A29E]">No orders yet</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-[#A8A29E] mb-2">Internal Notes</p>
              <textarea
                data-testid="internal-notes"
                rows={4}
                className="w-full bg-[#FAFAFA] border border-[#E7E5E4] rounded-xl p-3 text-sm resize-none outline-none focus:ring-1 focus:ring-[#1C1917]"
                placeholder="Add notes about this customer..."
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#A8A29E]">Select a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
