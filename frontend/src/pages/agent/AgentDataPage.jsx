import { FolderOpen } from "lucide-react";
export default function AgentDataPage() {
  return (
    <div className="p-6 lg:p-8" data-testid="agent-data-page">
      <h1 className="font-serif text-[28px] text-[#0C0A09] mb-2">Uploaded Data</h1>
      <p className="text-sm text-[#57534E] mb-8">View all training data for this agent.</p>
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-[#F5F5F4] flex items-center justify-center mx-auto"><FolderOpen className="w-8 h-8 text-[#A8A29E]" /></div>
        <h3 className="font-serif text-xl text-[#0C0A09] mt-6">Data Management</h3>
        <p className="text-sm text-[#57534E] mt-2 max-w-xs mx-auto">Upload and manage your agent's training data.</p>
      </div>
    </div>
  );
}
