// Products.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../auth/AuthContext";

function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const canWrite = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [msg, setMsg] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // QR modal state
const [qrOpen, setQrOpen] = useState(false);
const [qrData, setQrData] = useState(null);
const [qrLoading, setQrLoading] = useState(false);
const [qrError, setQrError] = useState("");


  const [form, setForm] = useState({
    sku: "",
    name: "",
    category: "",
    description: "",
    tagsText: "",
    low_stock_threshold: 10,
  });

  const params = useMemo(() => {
    const p = {};
    if (q.trim()) p.q = q.trim();
    if (sku.trim()) p.sku = sku.trim();
    if (category.trim()) p.category = category.trim();
    if (tag.trim()) p.tag = tag.trim();
    return p;
  }, [q, sku, category, tag]);

  const load = async () => {
    setMsg("");
    try {
      const res = await api.get("/products", { params });
      setProducts(res.data);
    } catch {
      setMsg("Failed to load products.");
    }
  };

  /**
 * Fetch QR code for a product
 * Available to ALL roles (read-only)
 */
const openQr = async (product) => {
  setQrOpen(true);
  setQrData(null);
  setQrError("");
  setQrLoading(true);

  try {
    const res = await api.get(`/products/${product.product_id}/qr`);

    setQrData({
      name: product.name,
      sku: product.sku,
      qr: res.data.qr,
    });
  } catch (err) {
    setQrError("Failed to load QR code.");
  } finally {
    setQrLoading(false);
  }
};


  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [params.q, params.sku, params.category, params.tag]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      sku: "",
      name: "",
      category: "",
      description: "",
      tagsText: "",
      low_stock_threshold: 10,
    });
    setOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description || "",
      tagsText: Array.isArray(p.tags) ? p.tags.join(", ") : "",
      low_stock_threshold: p.low_stock_threshold ?? 10,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");

    try {
      const payload = {
        ...form,
        tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        low_stock_threshold: Number(form.low_stock_threshold),
      };

      if (editing) {
        await api.put(`/products/${editing.product_id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setOpen(false);
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id) => {
    if (!confirm("Archive this product?")) return;
    await api.patch(`/products/${id}/archive`);
    load();
  };

  const del = async (id) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {canWrite && (
          <button
            onClick={openCreate}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900"
          >
            Add Product
          </button>
        )}
      </div>

      {/* FILTER */}
      <div className="border bg-white rounded p-4 mb-6">
        <div className="font-semibold mb-3">Search & Filter</div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input className="border p-2 rounded" placeholder="Keyword" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className="border p-2 rounded" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="border p-2 rounded" placeholder="Tag" value={tag} onChange={(e) => setTag(e.target.value)} />
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={load} className="bg-black text-white px-3 py-1 rounded">
            Refresh
          </button>
          <button
            onClick={() => { setQ(""); setSku(""); setCategory(""); setTag(""); }}
            className="border px-3 py-1 rounded"
          >
            Clear
          </button>
        </div>

        {msg && <div className="mt-2 text-sm text-red-600">{msg}</div>}
      </div>

      {/* TABLE */}
      <table className="w-full border bg-white rounded">
        <thead className="bg-gray-100 text-xs uppercase text-gray-600">
          <tr>
            <th className="p-3 text-left">SKU</th>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Threshold</th>
            <th className="p-3 text-left">Tags</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.product_id} className="border-t hover:bg-gray-50">
              <td className="p-3">{p.sku}</td>
              <td className="p-3">{p.name}</td>
              <td className="p-3">{p.category}</td>
              <td className="p-3">{p.low_stock_threshold}</td>
              <td className="p-3 text-sm">{p.tags?.join(", ")}</td>
              <td className="p-3 text-right">
  <div className="inline-flex gap-2">

    {/* QR – available to ALL roles */}
    <button
      className="border px-2 py-1 text-sm"
      onClick={() => openQr(p)}
    >
      QR
    </button>

    {/* Write actions */}
    {canWrite && (
      <>
        <button
          className="border px-2 py-1 text-sm"
          onClick={() => openEdit(p)}
        >
          Edit
        </button>

        <button
          className="border px-2 py-1 text-sm"
          onClick={() => archive(p.product_id)}
        >
          Archive
        </button>

        {isAdmin && (
          <button
            className="border px-2 py-1 text-sm text-red-600"
            onClick={() => del(p.product_id)}
          >
            Delete
          </button>
        )}
      </>
    )}
  </div>
</td>

            </tr>
          ))}
        </tbody>
      </table>

     {/* MODAL */}
<Modal
  open={open}
  title={editing ? "Edit Product" : "Add Product"}
  onClose={() => setOpen(false)}
>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* SKU */}
    <div>
      <div className="text-sm font-medium mb-1">SKU</div>
      <input
        className="border p-2 rounded w-full"
        value={form.sku}
        onChange={(e) => setForm({ ...form, sku: e.target.value })}
        disabled={!!editing}
      />
    </div>

    {/* Name */}
    <div>
      <div className="text-sm font-medium mb-1">Product Name</div>
      <input
        className="border p-2 rounded w-full"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
    </div>

    {/* Category */}
    <div>
      <div className="text-sm font-medium mb-1">Category</div>
      <input
        className="border p-2 rounded w-full"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      />
    </div>

    {/* Threshold */}
    <div>
      <div className="text-sm font-medium mb-1">Low Stock Threshold</div>
      <input
        type="number"
        min={0}
        className="border p-2 rounded w-full"
        value={form.low_stock_threshold}
        onChange={(e) =>
          setForm({ ...form, low_stock_threshold: e.target.value })
        }
      />
    </div>

    {/* Tags */}
    <div className="sm:col-span-2">
      <div className="text-sm font-medium mb-1">Tags</div>
      <input
        className="border p-2 rounded w-full"
        placeholder="e.g. chair, furniture, office"
        value={form.tagsText}
        onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
      />
    </div>

    {/* Description */}
    <div className="sm:col-span-2">
      <div className="text-sm font-medium mb-1">Description</div>
      <textarea
        className="border p-2 rounded w-full"
        rows={3}
        value={form.description}
        onChange={(e) =>
          setForm({ ...form, description: e.target.value })
        }
      />
    </div>
  </div>



  {/* ACTIONS */}
  <div className="mt-6 flex justify-end gap-2">
    <button
      onClick={() => setOpen(false)}
      className="border px-4 py-2 rounded"
    >
      Cancel
    </button>

    <button
      onClick={save}
      disabled={saving}
      className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {saving ? "Saving..." : "Save"}
    </button>
  </div>
</Modal>

      {/* QR MODAL */}
<Modal
  open={qrOpen}
  title="Product QR Code"
  onClose={() => setQrOpen(false)}
>
  {qrLoading && <div className="text-sm">Loading QR…</div>}

  {qrError && (
    <div className="text-sm text-red-600">{qrError}</div>
  )}

  {qrData && (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div className="font-semibold">{qrData.name}</div>
        <div className="text-sm text-gray-500">
          SKU: {qrData.sku}
        </div>
      </div>

      <img
        src={qrData.qr}
        alt="Product QR"
        className="w-48 h-48"
      />

      <div className="text-xs text-gray-500">
        Scan to identify product
      </div>
    </div>
  )}
</Modal>

    </div>
  );
}
