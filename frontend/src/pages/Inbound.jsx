// frontend/src/pages/Inbound.jsx
import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import BulkInboundUpload from "../components/BulkInboundUpload";

export default function Inbound() {
  const { user } = useAuth();
  const role = user?.role;

  const canBulk = role === "admin" || role === "manager";
  const canCreate = role === "admin" || role === "manager";

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);

  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [scanSku, setScanSku] = useState("");
  const [scanMsg, setScanMsg] = useState("");

  // ✅ Add unit_cost
  const [form, setForm] = useState({
    supplier_id: "",
    reference_no: "",
    received_date: new Date().toISOString().slice(0, 10),
    product_id: "",
    quantity: 1,
    unit_cost: "", // ✅ NEW
  });

  const loadAll = async () => {
    setMsg("");
    try {
      const [sRes, pRes, hRes] = await Promise.all([
        api.get("/api/suppliers"),
        api.get("/api/products"),
        api.get("/api/inbound"),
      ]);

      setSuppliers(sRes.data);
      setProducts(pRes.data);
      setHistory(hRes.data);

      // auto select first supplier/product if empty
      if (!form.supplier_id && sRes.data?.[0]?.supplier_id) {
        setForm((f) => ({ ...f, supplier_id: sRes.data[0].supplier_id }));
      }

      if (!form.product_id && pRes.data?.[0]?.product_id) {
        setForm((f) => ({ ...f, product_id: pRes.data[0].product_id }));
      }
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to load inbound data.");
    }
  };

  const handleSkuScan = async (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    setScanMsg("");

    if (!scanSku.trim()) return;

    try {
      const res = await api.get("/api/products/lookup", {
        params: { sku: scanSku.trim() },
      });

      setForm((f) => ({
        ...f,
        product_id: res.data.product_id,
      }));

      setScanSku("");
    } catch {
      setScanMsg("Product not found for scanned SKU.");
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line
  }, []);

  const submitInbound = async () => {
    if (!canCreate) {
      setMsg("You are not allowed to create inbound records.");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      if (!form.supplier_id) throw new Error("Supplier is required");
      if (!form.product_id) throw new Error("Product is required");
      if (!form.received_date) throw new Error("Received date is required");

      const qty = Number(form.quantity);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be > 0");

      // ✅ Validate unit_cost
      const unitCost = Number(form.unit_cost);
      if (!Number.isFinite(unitCost) || unitCost < 0) {
        throw new Error("Unit Cost (RM) is required and must be >= 0");
      }

      await api.post("/api/inbound", {
        supplier_id: form.supplier_id,
        reference_no: form.reference_no || null,
        received_date: form.received_date,
        items: [
          {
            product_id: form.product_id,
            quantity: qty,
            unit_cost: unitCost, // ✅ SEND unit_cost
          },
        ],
      });

      setMsg("Inbound recorded successfully.");

      // ✅ reset fields but keep selected supplier/product/date
      setForm((f) => ({
        ...f,
        reference_no: "",
        quantity: 1,
        unit_cost: "",
      }));

      loadAll();
    } catch (err) {
      setMsg(err?.response?.data?.error || err.message || "Inbound submit failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inbound Management</h1>

      {/* Create inbound */}
      <div className="border bg-white rounded p-4 mb-6">
        <div className="font-semibold mb-3">Log Incoming Stock</div>

        {role === "operator" && (
          <div className="text-sm text-gray-600">
            Operators can view inbound history but cannot record inbound stock.
          </div>
        )}

        {canCreate && (
          <>
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Scan Product Barcode (SKU)</div>
              <input
                className="border p-2 rounded w-full"
                placeholder="Scan barcode here"
                value={scanSku}
                onChange={(e) => setScanSku(e.target.value)}
                onKeyDown={handleSkuScan}
                autoFocus
              />
              {scanMsg && <div className="text-xs text-red-600 mt-1">{scanMsg}</div>}
            </div>

            {/* ✅ Note: changed layout to 6 cols to fit unit cost */}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Supplier</div>
                <select
                  className="border p-2 rounded w-full"
                  value={form.supplier_id}
                  onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                >
                  {suppliers.map((s) => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Product</div>
                <select
                  className="border p-2 rounded w-full"
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                >
                  {products.map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.sku} — {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Quantity</div>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  min={1}
                />
              </div>

              {/* ✅ NEW: Unit Cost */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Unit Cost (RM)</div>
                <input
                  type="number"
                  className="border p-2 rounded w-full"
                  placeholder="e.g., 2500"
                  value={form.unit_cost}
                  onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
                  min={0}
                  step="0.01"
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Received Date</div>
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={form.received_date}
                  onChange={(e) => setForm({ ...form, received_date: e.target.value })}
                />
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Invoice / Ref</div>
                <input
                  className="border p-2 rounded w-full"
                  placeholder="INV-001"
                  value={form.reference_no}
                  onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={submitInbound}
                disabled={saving}
                className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Submit Inbound"}
              </button>

              <button onClick={loadAll} className="border px-4 py-2 rounded">
                Refresh
              </button>
            </div>
          </>
        )}

        {msg && <div className="mt-2 text-sm text-blue-700">{msg}</div>}
      </div>

      {/* Bulk upload (Admin/Manager) */}
      {canBulk && (
        <div className="mb-6">
          <BulkInboundUpload onSuccess={loadAll} />
        </div>
      )}

      {/* History */}
      <div className="border bg-white rounded p-4">
        <div className="font-semibold mb-3">Inbound History</div>
        <table className="w-full border rounded">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Supplier</th>
              <th className="p-3 text-left">Reference</th>
              <th className="p-3 text-left">Items</th>
              <th className="p-3 text-left">Total Qty</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.inbound_id} className="border-t hover:bg-gray-50">
                <td className="p-3">{String(h.received_date).slice(0, 10)}</td>
                <td className="p-3">{h.supplier_name || "-"}</td>
                <td className="p-3">{h.reference_no || "-"}</td>
                <td className="p-3">{h.total_items}</td>
                <td className="p-3">{h.total_quantity}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-gray-500">
                  No inbound records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
