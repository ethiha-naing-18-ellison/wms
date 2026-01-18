// auditDashboard.js
import api from "./axios";

export const fetchAuditSummary = async () => {
  const res = await api.get("/api/audit/summary");
  return res.data;
};

export const fetchTopUsers = async () => {
  const res = await api.get("/api/audit/top-users");
  return res.data;
};

export const fetchTopProducts = async () => {
  const res = await api.get("/api/audit/top-products");
  return res.data;
};

export const fetchHighMovementProducts = async () => {
  const res = await api.get("/api/audit/high-movement");
  return res.data;
};
