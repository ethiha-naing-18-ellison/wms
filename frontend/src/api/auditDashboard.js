// auditDashboard.js
import api from "../services/api";

export const fetchAuditSummary = async () => {
  const res = await api.get("/audit/summary");
  return res.data;
};

export const fetchTopUsers = async () => {
  const res = await api.get("/audit/top-users");
  return res.data;
};

export const fetchTopProducts = async () => {
  const res = await api.get("/audit/top-products");
  return res.data;
};

export const fetchHighMovementProducts = async () => {
  const res = await api.get("/audit/high-movement");
  return res.data;
};
