import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Upload, Download, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

export default function FAQsPage() {
  const { agentId } = useParams();
  const [faqs, setFaqs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchFaqs = async () => {
    try {
      const { data } = await axios.get(`${API}/api/agents/${agentId}/training/faqs`, { withCredentials: true });
      setFaqs(data);
    } catch (err) {
      console.error("Failed to fetch FAQs", err);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [agentId]);

  const openCreate = () => {
    setEditFaq(null);
    setQ("");
    setA("");
    setDialogOpen(true);
  };

  const openEdit = (faq) => {
    setEditFaq(faq);
    setQ(faq.question);
    setA(faq.answer);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    try {
      if (editFaq) {
        await axios.put(
          `${API}/api/agents/${agentId}/training/faqs/${editFaq.faq_id}`,
          { question: q, answer: a },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${API}/api/agents/${agentId}/training/faqs`,
          { question: q, answer: a },
          { withCredentials: true }
        );
      }
      setDialogOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error("Failed to save FAQ", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId) => {
    try {
      await axios.delete(`${API}/api/agents/${agentId}/training/faqs/${faqId}`, {
        withCredentials: true,
      });
      fetchFaqs();
    } catch (err) {
      console.error("Failed to delete FAQ", err);
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    const faqsData = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      if (parts.length >= 2) {
        faqsData.push({
          question: parts[0].replace(/"/g, "").trim(),
          answer: parts.slice(1).join(",").replace(/"/g, "").trim(),
        });
      }
    }
    if (faqsData.length > 0) {
      try {
        await axios.post(
          `${API}/api/agents/${agentId}/training/faqs/bulk`,
          { faqs: faqsData },
          { withCredentials: true }
        );
        fetchFaqs();
      } catch (err) {
        console.error("Failed to import FAQs", err);
      }
    }
    setImporting(false);
    e.target.value = "";
  };

  const handleDownloadTemplate = () => {
    const csv = "question,answer\nWhat are your business hours?,We are open Monday to Friday 9AM - 6PM";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "faqs_template.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[28px] text-[#0C0A09]">FAQs</h1>
            <p className="text-sm text-[#57534E] mt-1">
              Frequently asked questions your AI can reference
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="h-10 px-4 border border-[#E7E5E4] bg-white rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <label className="h-10 px-4 border border-[#E7E5E4] bg-white rounded-lg text-sm font-medium hover:bg-[#FAFAFA] flex items-center gap-2 cursor-pointer">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              CSV Upload
              <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} disabled={importing} />
            </label>
            <button
              onClick={openCreate}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add FAQ
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 pb-8">
        {faqs.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-12 text-center">
            <p className="text-[#A8A29E]">No FAQs yet. Add your first FAQ or import from CSV.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div
                key={faq.faq_id}
                className="bg-white border border-[#E7E5E4] rounded-xl p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#0C0A09]">{faq.question}</h3>
                    <p className="text-sm text-[#57534E] mt-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(faq)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#57534E]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.faq_id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FAFAFA] text-[#DC2626]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editFaq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Question</label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="e.g., What are your business hours?"
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">Answer</label>
              <textarea
                value={a}
                onChange={(e) => setA(e.target.value)}
                rows={4}
                placeholder="Provide a detailed answer..."
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setDialogOpen(false)}
              className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !q.trim() || !a.trim()}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editFaq ? "Update" : "Add"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
