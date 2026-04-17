import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL" },
];

export default function CSVUploadDialog({ open, onClose, agentId, collectionName, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Confirm Schema, 3: Upload Progress
  const [csvContent, setCsvContent] = useState("");
  const [detectedFields, setDetectedFields] = useState([]);
  const [sampleData, setSampleData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      setCsvContent(content);
      await detectSchema(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const detectSchema = async (content) => {
    setDetecting(true);
    setError("");

    try {
      const { data } = await axios.post(
        `${API}/api/agents/${agentId}/collections/${collectionName}/detect-csv`,
        { csv_content: content },
        { withCredentials: true }
      );

      setDetectedFields(data.detected_fields);
      setSampleData(data.sample_data);
      setTotalRows(data.total_rows);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to detect CSV schema");
    } finally {
      setDetecting(false);
    }
  };

  const updateFieldType = (index, newType) => {
    const updated = [...detectedFields];
    updated[index].field_type = newType;
    setDetectedFields(updated);
  };

  const handleConfirmUpload = async () => {
    setUploading(true);
    setError("");

    try {
      const { data } = await axios.post(
        `${API}/api/agents/${agentId}/collections/${collectionName}/bulk-upload`,
        {
          csv_content: csvContent,
          replace_existing: true,
        },
        { withCredentials: true }
      );

      setStep(3);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setCsvContent("");
    setDetectedFields([]);
    setSampleData([]);
    setTotalRows(0);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV Bulk Upload</DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload CSV */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#E7E5E4] rounded-lg p-12 text-center hover:bg-[#FAFAFA] transition-colors">
              <Upload className="w-12 h-12 text-[#A8A29E] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#0C0A09] mb-2">Upload CSV File</h3>
              <p className="text-sm text-[#57534E] mb-4">
                Select a CSV file to import data. We'll auto-detect field types for you.
              </p>
              <label className="inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={detecting}
                  className="hidden"
                />
                <span className="h-10 px-6 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917] inline-flex items-center gap-2 cursor-pointer">
                  {detecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Select CSV File
                    </>
                  )}
                </span>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-[#FEE2E2] border border-[#DC2626] rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#7F1D1D]">{error}</p>
              </div>
            )}

            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-4">
              <p className="text-xs text-[#1E3A8A] font-medium mb-2">CSV Format Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#1E40AF]">
                <li>First row must contain column headers</li>
                <li>Column names will be converted to lowercase with underscores</li>
                <li>We'll auto-detect field types (text, number, date, email, etc.)</li>
                <li>You can modify detected types before importing</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Confirm Schema */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-[#FEF3C7] border border-[#FDE047] rounded-lg">
              <AlertTriangle className="w-5 h-5 text-[#CA8A04] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[#78350F] font-medium mb-1">
                  ⚠️ This will REPLACE all existing data!
                </p>
                <p className="text-xs text-[#92400E]">
                  All current items in this collection will be deleted and replaced with {totalRows} new items from the CSV.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0C0A09] mb-3">
                Detected Fields ({detectedFields.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detectedFields.map((field, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-[#E7E5E4] rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#0C0A09]">{field.field_name}</p>
                    </div>
                    <select
                      value={field.field_type}
                      onChange={(e) => updateFieldType(index, e.target.value)}
                      className="h-9 px-3 border border-[#E7E5E4] rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#1C1917]"
                    >
                      {FIELD_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#0C0A09] mb-3">Sample Data Preview</h3>
              <div className="border border-[#E7E5E4] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FAFAFA] border-b border-[#E7E5E4]">
                      <tr>
                        {detectedFields.map((field) => (
                          <th key={field.field_name} className="px-3 py-2 text-left font-medium text-[#57534E]">
                            {field.field_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E7E5E4]">
                      {sampleData.map((row, idx) => (
                        <tr key={idx}>
                          {detectedFields.map((field) => (
                            <td key={field.field_name} className="px-3 py-2 text-[#0C0A09]">
                              {row[field.field_name] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-xs text-[#A8A29E] mt-2">
                Showing first {sampleData.length} of {totalRows} rows
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-[#FEE2E2] border border-[#DC2626] rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[#7F1D1D]">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#0C0A09] mb-2">Upload Complete!</h3>
            <p className="text-[#57534E]">Successfully imported {totalRows} items.</p>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <button
              onClick={handleClose}
              className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
            >
              Cancel
            </button>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="h-10 px-4 border border-[#E7E5E4] rounded-lg text-sm font-medium hover:bg-[#FAFAFA]"
              >
                Back
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="h-10 px-4 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Replace All & Upload {totalRows} Items
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={handleClose}
              className="h-10 px-4 bg-[#0C0A09] text-white rounded-lg text-sm font-medium hover:bg-[#1C1917]"
            >
              Done
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
