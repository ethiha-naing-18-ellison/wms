// Inventory.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import BulkInventoryUpload from "../components/BulkInventoryUpload";

export default function Inventory() {
  const [q, setQ] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const params = useMemo(() => {
    const p = {};
    if (q) p.q = q;
    if (sku) p.sku = sku;
    if (category) p.category = category;
    if (tag) p.tag = tag;
    return p;
  }, [q, sku, category, tag]);

  const load = async () => {
    setLoading(true);
    setMsg("");

    try {
      const productsRes = await api.get("/api/products", { params });
      const products = productsRes.data;

      const invRes = await api.get("/api/inventory");
      const invMap = new Map(invRes.data.map(i => [i.product_id, i]));

      const merged = products.map(p => {
  const inv = invMap.get(p.product_id);

  const qty = inv?.quantity ?? 0;
  const avgCost = Number(inv?.avg_cost ?? 0);
  const totalValue = qty * avgCost;

  const threshold = p.low_stock_threshold ?? 0;

  return {
    product_id: p.product_id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    quantity: qty,
    avg_cost: avgCost,
    total_value: totalValue,
    low_stock_threshold: threshold,
    isLow: qty <= threshold,
  };
});

      setRows(merged);
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [params]);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Inventory</h1>

      <BulkInventoryUpload onSuccess={load} />

      <div className="border p-3 rounded mb-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
        <input className="border p-2" placeholder="Keyword" value={q} onChange={e => setQ(e.target.value)} />
        <input className="border p-2" placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <input className="border p-2" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input className="border p-2" placeholder="Tag" value={tag} onChange={e => setTag(e.target.value)} />
      </div>

      <table className="border w-full">
       <thead>
  <tr className="bg-gray-50">
    <th>SKU</th>
    <th>Name</th>
    <th>Category</th>
    <th className="text-right">Qty</th>
    <th className="text-right">Avg Cost (RM)</th>
    <th className="text-right">Total Value (RM)</th>
    <th>Status</th>
  </tr>
</thead>

        <tbody>
          {rows.map(r => (
           <tr key={r.product_id} className={r.isLow ? "bg-yellow-100" : ""}>
  <td>{r.sku}</td>
  <td>{r.name}</td>
  <td>{r.category}</td>
  <td className="text-right">{r.quantity}</td>
  <td className="text-right">
    {r.avg_cost > 0 ? `RM ${r.avg_cost.toLocaleString()}` : "-"}
  </td>
  <td className="text-right">
    {r.total_value > 0 ? `RM ${r.total_value.toLocaleString()}` : "-"}
  </td>
  <td>{r.isLow ? "LOW" : "OK"}</td>
</tr>

          ))}
        </tbody>
      </table>

      {loading && <div className="mt-2 text-sm">Loading…</div>}
      {msg && <div className="mt-2 text-red-600">{msg}</div>}
    </div>
  );
}
