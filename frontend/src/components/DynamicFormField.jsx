import { useState } from "react";
import { Upload, X, Calendar, Loader2 } from "lucide-react";
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL;

/**
 * DynamicFormField - Renders different input types based on field schema
 */
export default function DynamicFormField({ field, value, onChange, error }) {
  const { field_name, field_type, required, validation, dropdown_options } = field;
  
  const label = field_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const renderInput = () => {
    switch (field_type) {
      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
            maxLength={validation?.max_length}
          />
        );

      case "textarea":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            rows={4}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none resize-none"
            maxLength={validation?.max_length}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(field_name, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
            min={validation?.min}
            max={validation?.max}
            step="any"
          />
        );

      case "date":
        return (
          <div className="relative">
            <input
              type="date"
              value={value || ""}
              onChange={(e) => onChange(field_name, e.target.value)}
              className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E] pointer-events-none" />
          </div>
        );

      case "dropdown":
        return (
          <select
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
          >
            <option value="">Select {label.toLowerCase()}</option>
            {dropdown_options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(field_name, e.target.checked)}
              className="w-4 h-4 rounded border-[#E7E5E4] text-[#0C0A09] focus:ring-2 focus:ring-[#1C1917]"
            />
            <span className="text-sm text-[#57534E]">Yes</span>
          </label>
        );

      case "email":
        return (
          <input
            type="email"
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
          />
        );

      case "phone":
        return (
          <input
            type="tel"
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}`}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
          />
        );

      case "url":
        return (
          <input
            type="url"
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            placeholder="https://example.com"
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
          />
        );

      case "image":
        return <ImageUploadField value={value} onChange={(urls) => onChange(field_name, urls)} />;

      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(field_name, e.target.value)}
            className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#1C1917] focus:border-transparent outline-none"
          />
        );
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-[#0C0A09] mb-1.5">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {renderInput()}
      {error && <p className="text-xs text-[#DC2626] mt-1">{error}</p>}
      {validation?.max_length && field_type === "text" && (
        <p className="text-xs text-[#A8A29E] mt-1">Max {validation.max_length} characters</p>
      )}
      {(validation?.min !== undefined || validation?.max !== undefined) && field_type === "number" && (
        <p className="text-xs text-[#A8A29E] mt-1">
          {validation.min !== undefined && `Min: ${validation.min}`}
          {validation.min !== undefined && validation.max !== undefined && " • "}
          {validation.max !== undefined && `Max: ${validation.max}`}
        </p>
      )}
    </div>
  );
}

/**
 * ImageUploadField - Handles multiple image uploads (up to 6)
 * Uploads to server and stores URLs
 */
function ImageUploadField({ value, onChange }) {
  const images = Array.isArray(value) ? value : value ? [value] : [];
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 6 - images.length;
    if (files.length > remainingSlots) {
      alert(`You can only upload ${remainingSlots} more image(s). Maximum 6 images allowed.`);
      return;
    }

    setUploading(true);

    try {
      // Upload each file to server
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await axios.post(`${API}/api/upload/image`, formData, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Return full URL
        return `${API}${data.url}`;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onChange([...images, ...uploadedUrls]);
    } catch (err) {
      console.error("Failed to upload images", err);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = async (index) => {
    const imageUrl = images[index];
    
    // Try to delete from server
    try {
      const filename = imageUrl.split("/").pop();
      await axios.delete(`${API}/api/uploads/images/${filename}`, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("Failed to delete image from server", err);
    }

    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {images.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg border border-[#E7E5E4] overflow-hidden group">
            <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {images.length < 6 && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-[#E7E5E4] flex flex-col items-center justify-center cursor-pointer hover:bg-[#FAFAFA] transition-colors">
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-[#0C0A09] animate-spin mb-1" />
                <span className="text-xs text-[#57534E]">Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-[#A8A29E] mb-1" />
                <span className="text-xs text-[#A8A29E]">Add Image</span>
                <span className="text-[10px] text-[#D6D3D1]">({images.length}/6)</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>
      <p className="text-xs text-[#A8A29E] mt-2">Upload up to 6 images. Maximum 5MB per image.</p>
    </div>
  );
}
