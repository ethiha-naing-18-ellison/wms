// frontend/src/api/outbound.js
import api from "../services/api";

/**
 * OUTBOUND API
 * Uses centralized api instance with baseURL "/api"
 */

/**
 * =========================
 * GET OUTBOUND HISTORY
 * GET /api/outbound
 * =========================
 */
export async function getOutboundHistory() {
  const res = await api.get("/outbound");
  return res.data;
}

/**
 * =========================
 * CREATE OUTBOUND
 * POST /api/outbound
 * =========================
 */
export async function createOutbound(payload) {
  const res = await api.post("/outbound", payload);
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
    `/outbound/${outboundId}/attachments`,
    form,
    {
      headers: {
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

  const res = await api.post("/bulk/outbound", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}
