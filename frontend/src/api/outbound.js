// frontend/src/api/outbound.js
import api from "./axios";

/**
 * OUTBOUND API
 * baseURL = http://localhost:5000
 * All routes MUST include /api prefix
 */

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * =========================
 * GET OUTBOUND HISTORY
 * GET /api/outbound
 * =========================
 */
export async function getOutboundHistory() {
  const res = await api.get("/api/outbound", {
    headers: authHeader(),
  });
  return res.data;
}

/**
 * =========================
 * CREATE OUTBOUND
 * POST /api/outbound
 * =========================
 */
export async function createOutbound(payload) {
  const res = await api.post("/api/outbound", payload, {
    headers: authHeader(),
  });
  return res.data; // { message, outbound_id }
}

/**
 * =========================
 * UPLOAD OUTBOUND ATTACHMENT
 * POST /api/outbound/:outboundId/attachments
 * =========================
 */
export async function uploadOutboundAttachment(outboundId, file) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post(
    `/api/outbound/${outboundId}/attachments`,
    form,
    {
      headers: {
        ...authHeader(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

/**
 * =========================
 * BULK OUTBOUND UPLOAD
 * POST /api/bulk/outbound
 * =========================
 */
export async function bulkUploadOutbound(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post("/api/bulk/outbound", form, {
    headers: {
      ...authHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}
