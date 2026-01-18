// frontend/src/pages/Outbound.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { createOutbound, uploadOutboundAttachment } from "../api/outbound";
import BulkOutboundUpload from "../components/BulkOutboundUpload";
import OutboundHistoryTable from "../components/OutboundHistoryTable";
import { useAuth } from "../auth/AuthContext";

function RoleGate({ allowed, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (!allowed.includes(user.role)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Forbidden</h1>
        <p className="mt-2 text-gray-600">
          Your role (<b>{user.role}</b>) does not have access to Outbound.
        </p>
      </div>
    );
  }
  return children;
}

export default function Outbound() {
  const { user } = useAuth();

  // master data
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // form
  const [customerName, setCustomerName] = useState("");
  const [soReference, setSoReference] = useState("");
  const [dispatchDate, setDispatchDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const [items, setItems] = useState([
    { product_id: "", quantity: 1 },
  ]);

  const [files, setFiles] = useState([]); // attachments
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [scanSku, setScanSku] = useState("");
const [scanMsg, setScanMsg] = useState("");


  // Load products
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      setError("");
      try {
        // You have /api/products route in backend
        const token = localStorage.getItem("token");
        const res = await api.get("/api/products", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProducts(res.data || []);
      } catch (e) {
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            "Failed to load products"
        );
      } finally {
        setLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  const productMap = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(String(p.product_id), p);
    return m;
  }, [products]);

  async function handleSkuScan(e) {
  if (e.key !== "Enter") return;

  e.preventDefault();
  setScanMsg("");

  if (!scanSku.trim()) return;

  try {
    const res = await api.get("/api/products/lookup", {
      params: { sku: scanSku.trim() },
    });

    // apply to LAST item row
    setItems((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        ...next[next.length - 1],
        product_id: res.data.product_id,
      };
      return next;
    });

    setScanSku("");
  } catch {
    setScanMsg("Scanned SKU not found.");
  }
}


  function addItem() {
    setItems((prev) => [...prev, { product_id: "", quantity: 1 }]);
  }

  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx, patch) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }

  function validate() {
    if (!customerName.trim()) return "Customer name is required";
    if (!dispatchDate) return "Dispatch date is required";
    if (!Array.isArray(items) || items.length === 0) return "At least 1 item is required";

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_id) return `Item ${i + 1}: product is required`;
      const q = Number(it.quantity);
      if (!Number.isFinite(q) || q <= 0) return `Item ${i + 1}: quantity must be > 0`;
    }
    return null;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
try {
  const payload = {
    customer_name: customerName.trim(),
    so_reference: soReference.trim() || null,
    dispatch_date: dispatchDate,
    items: items.map((it) => ({
      product_id: String(it.product_id).trim(),
      quantity: Number(it.quantity),
    })),
  };

  const created = await createOutbound(payload);
  const outboundId = created?.outbound_id;

  if (outboundId && files.length > 0) {
    for (const f of files) {
      await uploadOutboundAttachment(outboundId, f);
    }
  }

  setSuccess(`Outbound created successfully (ID: ${outboundId})`);

  // reset form
  setCustomerName("");
  setSoReference("");
  setItems([{ product_id: "", quantity: 1 }]);
  setFiles([]);

} catch (e) {
  console.log("OUTBOUND ERROR FULL:", e);

  if (e?.response?.data?.error) {
    setError(e.response.data.error);
  } else if (e?.response?.data?.message) {
    setError(e.response.data.message);
  } else {
    setError("Failed to create outbound");
  }
} finally {
  // 🔑 THIS IS THE IMPORTANT LINE
  setSubmitting(false);
}



  }

  return (
    <RoleGate allowed={["admin", "manager", "operator"]}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Outbound Dispatch</h1>
          <span className="text-sm text-gray-600">
            Role: <b>{user?.role}</b>
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 rounded border border-green-200 bg-green-50 p-3 text-green-700">
            {success}
          </div>
        )}

        {["admin", "manager"].includes(user.role) && (
        <form onSubmit={onSubmit} className="mt-6 space-y-6">

          {/* Header fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Customer Name *</label>
              <input
                className="mt-1 w-full rounded border p-2"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., ABC Trading"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">SO Reference</label>
              <input
                className="mt-1 w-full rounded border p-2"
                value={soReference}
                onChange={(e) => setSoReference(e.target.value)}
                placeholder="e.g., SO-2026-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Dispatch Date *</label>
              <input
                type="date"
                className="mt-1 w-full rounded border p-2"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between">

              {/* Barcode Scanner Input */}
<div className="mb-4">
  <label className="block text-sm font-medium">
    Scan Product Barcode (SKU)
  </label>
  <input
    className="mt-1 w-full rounded border p-2"
    placeholder="Scan barcode here"
    value={scanSku}
    onChange={(e) => setScanSku(e.target.value)}
    onKeyDown={handleSkuScan}
    autoFocus
  />
  {scanMsg && (
    <p className="mt-1 text-xs text-red-600">{scanMsg}</p>
  )}
</div>

              <h2 className="text-lg font-semibold">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="rounded bg-black px-3 py-2 text-sm text-white"
              >
                + Add Item
              </button>
            </div>

            {loadingProducts ? (
              <p className="mt-3 text-gray-600">Loading products...</p>
            ) : (
              <div className="mt-4 space-y-3">
                {items.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-3 rounded border p-3 md:grid-cols-12"
                  >
                    <div className="md:col-span-7">
                      <label className="block text-sm font-medium">Product *</label>
                      <select
                        className="mt-1 w-full rounded border p-2"
                        value={it.product_id}
                        onChange={(e) => updateItem(idx, { product_id: e.target.value })}
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.name} (SKU: {p.sku})
                          </option>
                        ))}
                      </select>
                      {it.product_id && productMap.get(String(it.product_id))?.quantity != null && (
                        <p className="mt-1 text-xs text-gray-600">
                          Current stock:{" "}
                          <b>{productMap.get(String(it.product_id))?.quantity}</b>
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded border p-2"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                      />
                    </div>

                    <div className="flex items-end md:col-span-2">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
                        title={items.length === 1 ? "At least one item is required" : "Remove"}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div>
            <h2 className="text-lg font-semibold">Attachments (Optional)</h2>
            <p className="text-sm text-gray-600">
              Upload signed DOs / invoices (PDF, images).
            </p>

            <input
              type="file"
              multiple
              className="mt-3 block"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />

            {files.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-gray-700">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>
          {/* Attachment visibility notice */}
{["admin", "manager"].includes(user.role) && (
  <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
    <b>Note:</b> Uploaded attachments (e.g. signed DOs, invoices) are stored
    securely on the server and linked to this outbound transaction for audit
    and verification purposes. Attachment viewing is restricted to Admin and
    Manager roles.
  </div>
)}


          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Create Outbound"}
          </button>
                </form>
                )}

        {/* Bulk Outbound Upload */}
        {["admin", "manager"].includes(user.role) && (
  <BulkOutboundUpload />
)}

<OutboundHistoryTable />


      </div>
    </RoleGate>

  );
}
