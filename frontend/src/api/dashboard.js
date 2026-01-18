// frontend/src/api/dashboard.js
import api from "../services/api";

/**
 * Dashboard summary (already working)
 */
export async function fetchDashboardSummary(params = {}) {
  const res = await api.get("/dashboard/summary", { params });
  return res.data;
}

/**
 * Inventory valuation — TOTAL
 * Backend route:
 * GET /api/inventory/valuation/summary
 */
export async function fetchTotalInventoryValue() {
  const res = await api.get("/inventory/valuation/summary");
  return res.data;
}

/**
 * Inventory valuation — BY CATEGORY
 * Backend route:
 * GET /api/inventory/valuation/categories
 */
export async function fetchInventoryValueByCategory() {
  const res = await api.get("/inventory/valuation/categories");
  return res.data;
}
