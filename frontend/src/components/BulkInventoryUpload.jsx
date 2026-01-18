import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";

export default function BulkInventoryUpload({ onSuccess }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const canUpload = user?.role === "admin" || user?.role === "manager";

  const handleUpload = async () => {
    if (!file) {
      setMsg("Please select a CSV/XLSX file first.");
      return;
    }

    setUploading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post("/api/bulk/inventory", formData); // DO NOT set Content-Type manually
      setMsg("Bulk upload successful.");
      setFile(null);
      onSuccess?.();
    } 
     catch (err) {
  const backendMsg =
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    "Upload failed.";

  setMsg(backendMsg);
}finally {
      setUploading(false);
    }
  };

  if (!canUpload) return null;

  return (
    <div className="border p-3 rounded mb-4">
      <div className="font-semibold mb-2">Bulk Inventory Upload (CSV/XLSX)</div>

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="bg-black text-white px-3 py-1 disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {msg && <div className="mt-2 text-sm text-gray-700">{msg}</div>}
      <div className="mt-2 text-xs text-gray-500">
        CSV columns: sku,name,category,description,tags,low_stock_threshold (tags delimited by |)
      </div>
    </div>
  );
}
