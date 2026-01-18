import { useState } from "react";
import api from "../services/api";

export default function BulkInboundUpload({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = async () => {
    if (!file) {
      setMsg("Please select a CSV file.");
      return;
    }

    setUploading(true);
    setMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file); // 🔑 MUST be "file"

      const res = await api.post("/bulk/inbound", formData, {
        // ❗ DO NOT manually set Content-Type
        headers: {
          // Axios interceptor already injects Authorization
        },
      });

      setMsg(`Upload successful. Processed ${res.data.processed} rows.`);
      setFile(null);
      onSuccess?.();
    } catch (err) {
      setMsg(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border bg-white rounded p-4">
      <div className="font-semibold mb-2">
        Bulk Inbound Upload (Admin / Manager)
      </div>

      <div className="text-xs text-gray-500 mb-3">
        CSV columns: supplier_id, product_id, quantity, reference_no, received_date
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />

      <div className="flex gap-2">
        <button
          onClick={upload}
          disabled={uploading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {msg && <div className="mt-2 text-sm text-red-600">{msg}</div>}
    </div>
  );
}
