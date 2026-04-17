import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Upload, Loader2, FileText, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function DocumentsPage() {
  const { agentId } = useParams();
  const [documents, setDocuments] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [docType, setDocType] = useState("text");
  const [docText, setDocText] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/training/documents`, {
        withCredentials: true,
      });
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [agentId]);

  const handleAddText = async () => {
    if (!docText.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/training/documents`,
        { content: docText.trim(), source: "manual" },
        { withCredentials: true }
      );
      setDialogOpen(false);
      setDocText("");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to add document", err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddUrl = async () => {
    if (!docUrl.trim()) return;
    setSaving(true);
    try {
      await axios.post(
        `${API}/api/agents/${agentId}/training/documents/scrape`,
        { url: docUrl.trim() },
        { withCredentials: true }
      );
      setDialogOpen(false);
      setDocUrl("");
      fetchDocuments();
    } catch (err) {
      console.error("Failed to scrape URL", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/api/agents/${agentId}/training/documents/upload`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchDocuments();
    } catch (err) {
      console.error("Failed to upload file", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (docId) => {
    try {
      await axios.delete(`${API}/api/agents/${agentId}/training/documents/${docId}`, {
        withCredentials: true,
      });
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">Documents</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Upload documents, text, or URLs for your AI to learn from
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="h-10 px-4 border border-[#E7E5E4] bg-white rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2 cursor-pointer">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload File
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            <button
              onClick={() => setDialogOpen(true)}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {documents.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-[#D6D3D1] mx-auto mb-4" />
            <p className="text-[#A8A29E]">No documents yet. Add text, upload a file, or scrape a URL.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.doc_id}
                className="bg-white border border-[#E7E5E4] rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[#57534E]" />
                      <span className="text-xs text-[#A8A29E]">
                        {doc.source || "Manual"} • {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#0C0A09] line-clamp-3">{doc.content}</p>
                    {doc.metadata?.url && (
                      <a
                        href={doc.metadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {doc.metadata.url}
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.doc_id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#DC2626]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDocType("text")}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                  docType === "text"
                    ? "bg-[#0C0A09] text-white"
                    : "bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]"
                }`}
              >
                Text
              </button>
              <button
                onClick={() => setDocType("url")}
                className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                  docType === "url"
                    ? "bg-[#0C0A09] text-white"
                    : "bg-[#F5F5F4] text-[#57534E] hover:bg-[#E7E5E4]"
                }`}
              >
                URL
              </button>
            </div>

            {docType === "text" ? (
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Document Text</label>
                <textarea
                  value={docText}
                  onChange={(e) => setDocText(e.target.value)}
                  rows={8}
                  placeholder="Paste your document content here..."
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Website URL</label>
                <input
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
                />
                <p className="text-xs text-[#A8A29E] mt-1.5">We'll scrape and extract text from this URL</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <button
              onClick={() => {
                setDialogOpen(false);
                setDocText("");
                setDocUrl("");
              }}
              className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              onClick={docType === "text" ? handleAddText : handleAddUrl}
              disabled={saving || (docType === "text" ? !docText.trim() : !docUrl.trim())}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
