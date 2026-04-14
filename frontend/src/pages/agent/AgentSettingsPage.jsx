import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, MessageSquare, Globe, Clock, Loader2, CheckCircle, Plus, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function AgentSettingsPage() {
  const { agentId } = useParams();
  const [agent, setAgent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    (async () => { try { const { data } = await axios.get(`${API}/api/agents/${agentId}`, { withCredentials: true }); setAgent(data); } catch {} })();
  }, [agentId]);

  const set = (k, v) => setAgent(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await axios.put(`${API}/api/agents/${agentId}/settings`, {
        greeting_message: agent.greeting_message,
        fallback_message: agent.fallback_message,
        response_tone: agent.response_tone,
        response_language: agent.response_language,
        auto_reply_delay: agent.auto_reply_delay || 0,
        max_conversation_length: agent.max_conversation_length || 50,
        collect_user_info: agent.collect_user_info || false,
        handoff_keywords: agent.handoff_keywords || [],
      }, { withCredentials: true });
      setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && agent) {
      set("handoff_keywords", [...(agent.handoff_keywords || []), newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw) => set("handoff_keywords", (agent?.handoff_keywords || []).filter(k => k !== kw));

  if (!agent) return <div className="p-8 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#A8A29E]" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl" data-testid="agent-settings-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-1">Agent Settings</h1>
      <p className="text-sm text-[#57534E] mb-8">Configure how your agent responds and behaves.</p>

      {/* Conversation Settings */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5"><MessageSquare className="w-5 h-5 text-[#57534E]" /><h2 className="text-base font-semibold text-[#0C0A09]">Conversation Settings</h2></div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Greeting Message</label>
            <textarea data-testid="greeting-msg" rows={3} value={agent.greeting_message || ""} onChange={e => set("greeting_message", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" placeholder="Hello! How can I help you today?" />
            <p className="text-xs text-[#A8A29E] mt-1">Sent when a new conversation starts</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Fallback Message</label>
            <textarea data-testid="fallback-msg" rows={3} value={agent.fallback_message || ""} onChange={e => set("fallback_message", e.target.value)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none" placeholder="I'm not sure about that. Let me connect you with our team." />
            <p className="text-xs text-[#A8A29E] mt-1">Sent when the AI can't find a matching answer</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Auto-reply Delay (seconds)</label>
              <input data-testid="reply-delay" type="number" min="0" max="30" value={agent.auto_reply_delay || 0} onChange={e => set("auto_reply_delay", parseInt(e.target.value) || 0)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" />
              <p className="text-xs text-[#A8A29E] mt-1">0 = instant reply</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Max Messages per Conversation</label>
              <input data-testid="max-msgs" type="number" min="10" max="200" value={agent.max_conversation_length || 50} onChange={e => set("max_conversation_length", parseInt(e.target.value) || 50)} className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none" />
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-[#E7E5E4]">
            <div><p className="text-sm font-medium text-[#0C0A09]">Collect User Info</p><p className="text-xs text-[#57534E]">Ask for name and email at start of conversation</p></div>
            <Switch checked={agent.collect_user_info || false} onCheckedChange={v => set("collect_user_info", v)} data-testid="collect-info-toggle" />
          </div>
        </div>
      </div>

      {/* Handoff Keywords */}
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5"><Globe className="w-5 h-5 text-[#57534E]" /><h2 className="text-base font-semibold text-[#0C0A09]">Human Handoff Keywords</h2></div>
        <p className="text-sm text-[#57534E] mb-3">When a customer sends one of these keywords, AI will pause and notify you.</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {(agent.handoff_keywords || []).map(kw => (
            <span key={kw} className="bg-[#F5F0EB] text-[#1C1917] text-xs rounded-full px-2.5 py-1 inline-flex items-center gap-1">
              {kw} <button onClick={() => removeKeyword(kw)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input data-testid="handoff-keyword-input" value={newKeyword} onChange={e => setNewKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()} className="flex-1 border border-[#E7E5E4] rounded-lg px-3 py-2 text-sm outline-none" placeholder='e.g. "speak to human", "manager"' />
          <button onClick={addKeyword} className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-sm hover:bg-[#FAFAFA]"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button data-testid="save-agent-settings" onClick={save} disabled={saving} className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}</button>
        {saved && <span className="text-xs text-[#166534] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Saved</span>}
      </div>
    </div>
  );
}
