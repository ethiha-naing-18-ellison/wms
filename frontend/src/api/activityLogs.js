import api from "./axios";

export async function fetchActivityLogs() {
  const res = await api.get("/api/activity-logs");
  return res.data;
}
