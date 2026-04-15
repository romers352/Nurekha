import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, Plus, MoreHorizontal, Pencil, Trash2, PauseCircle, PlayCircle, Copy, Loader2, AlertTriangle, Check, ChevronDown } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

import { ALL_BUSINESS_TYPES, getBizLabel } from "@/config/businessTypes";

const API = process.env.REACT_APP_BACKEND_URL;

const BUSINESS_TYPES = ALL_BUSINESS_TYPES;

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function AgentCard({ agent, onDelete, onRename, onToggleStatus }) {
  const [copied, setCopied] = useState(false);
  const initials = agent.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const copyId = () => {
    navigator.clipboard.writeText(agent.agent_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = agent.status === "active";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-card relative"
      data-testid={`agent-card-${agent.agent_id}`}
    >
      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button data-testid={`agent-menu-${agent.agent_id}`} className="absolute top-4 right-4 p-1 text-[#A8A29E] hover:text-[#0C0A09]">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onRename(agent)}>
            <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleStatus(agent)}>
            {isActive ? <PauseCircle className="w-3.5 h-3.5 mr-2" /> : <PlayCircle className="w-3.5 h-3.5 mr-2" />}
            {isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[#991B1B]" onClick={() => onDelete(agent.agent_id)}>
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar & Status */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-[#F5F0EB] flex items-center justify-center font-serif text-2xl text-[#1C1917] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-normal text-[#0C0A09] truncate">{agent.name}</h3>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono text-xs text-[#A8A29E]">ID: {agent.agent_id.slice(0, 12)}...</span>
            <button onClick={copyId} className="text-[#A8A29E] hover:text-[#0C0A09]">
              <Copy className="w-3 h-3" />
            </button>
            {copied && <span className="text-xs text-[#166534]">Copied!</span>}
          </div>
        </div>
      </div>

      {/* Status Badge & Business Type */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-0.5 ${isActive ? "bg-[#F0FDF4] text-[#166534]" : "bg-[#FEF2F2] text-[#991B1B]"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#166534]" : "bg-[#991B1B]"}`} />
          {agent.status}
        </span>
        {agent.business_type && (
          <span className="inline-flex items-center text-xs rounded-full px-2.5 py-0.5 bg-[#F5F0EB] text-[#57534E]">
            {getBizLabel(agent.business_type)}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3">
        <span className="text-sm"><span className="font-semibold text-[#0C0A09]">{(agent.messages_count || 0).toLocaleString()}</span> <span className="text-xs text-[#57534E]">messages</span></span>
      </div>

      {/* Action */}
      <a href={`/agent/${agent.agent_id}`} data-testid={`open-agent-${agent.agent_id}`} className="mt-4 w-full h-9 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#0C0A09] hover:text-white transition-colors flex items-center justify-center">
        Open Dashboard
      </a>
    </motion.div>
  );
}

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBusinessType, setNewBusinessType] = useState("");
  const [bizTypeOpen, setBizTypeOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Rename state
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameAgent, setRenameAgent] = useState(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  const plan = user?.plan_id || "free";
  const limit = (plan === "free" ? 2 : plan === "pro" ? 5 : 10) + (user?.extra_agents || 0);
  const atLimit = agents.length >= limit;

  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents`, { withCredentials: true });
      setAgents(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const handleCreate = async () => {
    if (!newName.trim() || !newBusinessType) return;
    setCreating(true);
    try {
      await axios.post(`${API}/api/agents`, { name: newName, business_type: newBusinessType }, { withCredentials: true });
      // Force refetch from server for reliable state
      await fetchAgents();
      setNewName("");
      setNewBusinessType("");
      setCreateOpen(false);
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  const handleDelete = async (agentId) => {
    try {
      await axios.delete(`${API}/api/agents/${agentId}`, { withCredentials: true });
      setAgents(prev => prev.filter(a => a.agent_id !== agentId));
    } catch (err) { console.error(err); }
  };

  const handleRenameOpen = (agent) => {
    setRenameAgent(agent);
    setRenameName(agent.name);
    setRenameOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameName.trim() || !renameAgent) return;
    setRenaming(true);
    try {
      const { data } = await axios.patch(`${API}/api/agents/${renameAgent.agent_id}`, { name: renameName }, { withCredentials: true });
      setAgents(prev => prev.map(a => a.agent_id === renameAgent.agent_id ? data : a));
      setRenameOpen(false);
      setRenameAgent(null);
    } catch (err) { console.error(err); }
    finally { setRenaming(false); }
  };

  const handleToggleStatus = async (agent) => {
    const newStatus = agent.status === "active" ? "inactive" : "active";
    try {
      const { data } = await axios.patch(`${API}/api/agents/${agent.agent_id}`, { status: newStatus }, { withCredentials: true });
      setAgents(prev => prev.map(a => a.agent_id === agent.agent_id ? data : a));
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl" data-testid="agents-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="font-serif text-[28px] text-[#0C0A09]">My Agents</h1>
          <p className="text-sm text-[#57534E] mt-0.5">{agents.length} of {limit} agents used</p>
        </div>
        <button
          data-testid="create-agent-btn"
          onClick={() => setCreateOpen(true)}
          disabled={atLimit}
          className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      {/* Quota Warning */}
      {atLimit && plan === "free" && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 flex items-center gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0" />
          <span className="text-sm text-[#92400E]">Free plan: {limit} agents maximum. Upgrade to create more.</span>
          <a href="/dashboard/billing" className="text-sm text-[#92400E] underline ml-auto shrink-0">View Billing</a>
        </div>
      )}

      {/* Agents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#E7E5E4] rounded-2xl p-6 animate-shimmer h-52" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-[#F5F5F4] flex items-center justify-center mx-auto">
            <Bot className="w-8 h-8 text-[#A8A29E]" />
          </div>
          <h3 className="font-serif text-xl text-[#0C0A09] mt-6">No agents yet</h3>
          <p className="text-sm text-[#57534E] mt-2 max-w-xs mx-auto">Create your first AI agent to start automating conversations.</p>
          <button onClick={() => setCreateOpen(true)} data-testid="empty-create-agent" className="mt-4 h-10 px-5 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] transition-colors">
            Create Agent
          </button>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map(agent => (
            <AgentCard
              key={agent.agent_id}
              agent={agent}
              onDelete={handleDelete}
              onRename={handleRenameOpen}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </motion.div>
      )}

      {/* Create Agent Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setNewName(""); setNewBusinessType(""); setBizTypeOpen(false); } }}>
        <DialogContent className="sm:max-w-md" data-testid="create-agent-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create new agent</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Agent Name</label>
              <input
                data-testid="agent-name-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                placeholder="e.g. Kathmandu Shop Assistant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Business Type</label>
              <p className="text-xs text-[#57534E] mb-2">Select the type of business this agent will serve. This determines available features.</p>
              <div className="relative">
                <button
                  type="button"
                  data-testid="business-type-select"
                  onClick={() => setBizTypeOpen(!bizTypeOpen)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm text-left hover:bg-[#FAFAFA] flex items-center justify-between"
                >
                  <span className={newBusinessType ? "text-[#0C0A09]" : "text-[#A8A29E]"}>
                    {newBusinessType ? getBizLabel(newBusinessType) : "Select business type..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-[#A8A29E] transition-transform ${bizTypeOpen ? "rotate-180" : ""}`} />
                </button>
                {bizTypeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 border border-[#E7E5E4] rounded-xl bg-white shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                    {BUSINESS_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        data-testid={`biz-type-${t.toLowerCase().replace(/[\s\/]+/g, "-")}`}
                        onClick={() => { setNewBusinessType(t); setBizTypeOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#FAFAFA] ${newBusinessType === t ? "bg-[#F5F0EB]" : ""}`}
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${newBusinessType === t ? "bg-[#0C0A09] border-[#0C0A09]" : "border-[#D6D3D1]"}`}>
                          {newBusinessType === t && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {getBizLabel(t)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setCreateOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA]">Cancel</button>
            <button
              data-testid="confirm-create-agent"
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !newBusinessType}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Agent Dialog */}
      <Dialog open={renameOpen} onOpenChange={(open) => { setRenameOpen(open); if (!open) setRenameAgent(null); }}>
        <DialogContent className="sm:max-w-md" data-testid="rename-agent-dialog">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Rename Agent</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">New Name</label>
            <input
              data-testid="rename-agent-input"
              value={renameName}
              onChange={e => setRenameName(e.target.value)}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
              placeholder="Enter new name"
              onKeyDown={e => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setRenameOpen(false)} className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm text-[#0C0A09] hover:bg-[#FAFAFA]">Cancel</button>
            <button
              data-testid="confirm-rename-agent"
              onClick={handleRenameSubmit}
              disabled={renaming || !renameName.trim()}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {renaming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
