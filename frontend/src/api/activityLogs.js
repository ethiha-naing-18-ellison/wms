import api from "../services/api";

export async function fetchActivityLogs() {
  const res = await api.get("/activity-logs");
  return res.data;
}
