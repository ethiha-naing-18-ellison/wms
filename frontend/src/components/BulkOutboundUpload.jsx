import { useState } from "react";
import { bulkUploadOutbound } from "../api/outbound";

export default function BulkOutboundUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleUpload() {
    if (!file) {
      setMsg("Please select a CSV file");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await bulkUploadOutbound(file);
      setMsg(res.message || "Bulk outbound upload successful");
      setFile(null);
    } catch (e) {
      setMsg(
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        "Bulk outbound upload failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-4 mt-6">
      <h3 className="font-semibold mb-2">Bulk Outbound Upload</h3>

      <p className="text-sm text-gray-600 mb-2">
        CSV columns: product_id, quantity, customer_name, so_reference, dispatch_date
      </p>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button
        onClick={handleUpload}
        disabled={loading}
        className="ml-3 px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>

      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}
