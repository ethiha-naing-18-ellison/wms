// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  fetchTotalInventoryValue,
  fetchInventoryValueByCategory,
} from "../api/dashboard";

/**
 * DASHBOARD PAGE
 *
 * Features implemented:
 * 1. Stats cards
 * 2. Date range filter
 * 3. Product filter (optional)
 * 4. Daily transaction volume table
 * 5. Recent activity stream (human-readable)
 *
 * Backend endpoint used:
 * GET /api/dashboard/summary
 */
export default function Dashboard() {
  /* =========================
     STATE
  ========================= */

  const [summary, setSummary] = useState(null);
  const [products, setProducts] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [productId, setProductId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const [inventoryValue, setInventoryValue] = useState(null);
const [valueByCategory, setValueByCategory] = useState([]);


  /* =========================
     LOAD PRODUCTS (FILTER)
     Uses existing /api/products
  ========================= */
  useEffect(() => {
    api.get("/products")
      .then(res => setProducts(res.data))
      .catch(() => {});
  }, []);

  /* =========================
     LOAD DASHBOARD DATA
  ========================= */
  const loadDashboard = async () => {
    setLoading(true);
    setError("");

 try {
  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (productId) params.product_id = productId;

  // ✅ 1) Summary is core — if this fails, dashboard truly fails
  const res = await api.get("/dashboard/summary", { params });
  setSummary(res.data);

  // ✅ 2) Valuation is optional — if it fails, we DO NOT break the whole page
  try {
    const totalVal = await fetchTotalInventoryValue();
    setInventoryValue(totalVal.total_value);

    const byCategory = await fetchInventoryValueByCategory();
    setValueByCategory(byCategory);
  } catch (valErr) {
    console.error("Valuation API error:", valErr?.response || valErr);
    setInventoryValue(null);
    setValueByCategory([]);
    // no setError here — keep dashboard usable
  }
} catch (err) {
  console.error("Dashboard API error:", err);
  console.error("Response:", err?.response);
  console.error("Message:", err?.message);

  setError(
    err?.response?.data?.error ||
    err?.message ||
    "Failed to load dashboard data"
  );
} finally {
  setLoading(false);
}
};

  // Initial load
 useEffect(() => {
  loadDashboard();
}, []);


  /* =========================
     HELPERS
  ========================= */

  // Human-readable activity text
  const formatActivity = (a) => {
    return `${a.role} ${a.action.toLowerCase()} ${a.entity.toLowerCase()}`;
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString();

  const formatDateTime = (d) =>
    new Date(d).toLocaleString();

  /* =========================
     RENDER
  ========================= */

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* =========================
         FILTER BAR
      ========================= */}
      <div className="bg-white border rounded p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-sm block mb-1">Start Date</label>
          <input
            type="date"
            className="border p-2 w-full"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm block mb-1">End Date</label>
          <input
            type="date"
            className="border p-2 w-full"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm block mb-1">Product</label>
          <select
            className="border p-2 w-full"
            value={productId}
            onChange={e => setProductId(e.target.value)}
          >
            <option value="">All products</option>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={loadDashboard}
            className="bg-black text-white px-4 py-2 rounded w-full"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* =========================
         STATS
      ========================= */}
      {summary && (
  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
    <Stat label="Total Inventory" value={summary.stats.total_inventory_items} />
    <Stat label="Inbound Today" value={summary.stats.inbound_today} />
    <Stat label="Outbound Today" value={summary.stats.outbound_today} />
    <Stat label="Low Stock Alerts" value={summary.stats.low_stock_alerts} />
    {inventoryValue !== null && (
      <Stat
        label="Inventory Value"
        value={`RM ${Number(inventoryValue).toLocaleString()}`}
      />
    )}
  </div>
)}




       {/* DAILY TRANSACTION CHART */}
      {summary && (
        <>
          <h2 className="font-semibold mb-3">Daily Transaction Volume</h2>

          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.daily_volume}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inbound" fill="#4ade80" />
                <Bar dataKey="outbound" fill="#f87171" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <table className="w-full border bg-white mb-8">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">Inbound</th>
                <th className="p-2 text-right">Outbound</th>
              </tr>
            </thead>
            <tbody>
              {summary.daily_volume.map(row => (
                <tr key={row.date} className="border-t">
                  <td className="p-2">{formatDate(row.date)}</td>
                  <td className="p-2 text-right">{row.inbound}</td>
                  <td className="p-2 text-right">{row.outbound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
{/* INVENTORY VALUE BY CATEGORY */}
      {valueByCategory.length > 0 && (
        <>
          <h2 className="font-semibold mb-3">Inventory Value by Category</h2>

          <ChartCard>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueByCategory}>
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_value" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

    <table className="w-full border bg-white mb-8">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Category</th>
          <th className="p-2 text-right">Total Value (RM)</th>
        </tr>
      </thead>
      <tbody>
        {valueByCategory.map(c => (
          <tr key={c.category} className="border-t">
            <td className="p-2">{c.category}</td>
            <td className="p-2 text-right">
              RM {Number(c.total_value).toLocaleString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)}

      {/* =========================
         RECENT ACTIVITY
      ========================= */}
      {summary && (
        <>
          <h2 className="font-semibold mb-3">
            Recent Activity
          </h2>

          <table className="w-full border bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {summary.recent_activity.map(a => (
                <tr key={a.log_id} className="border-t">
                  <td className="p-2">{a.email}</td>
                  <td className="p-2">{formatActivity(a)}</td>
                  <td className="p-2">{formatDateTime(a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

/* =========================
   REUSABLE UI
========================= */
function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ChartCard({ children }) {
  return (
    <div className="bg-white border rounded p-4 mb-6 h-[280px]">
      {children}
    </div>
  );
}
