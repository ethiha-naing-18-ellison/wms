// backend/src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");

// 🔥 FORCE LOAD INVENTORY SERVICE
require("./services/inventory.service");
;

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const inboundRoutes = require("./routes/inbound.routes");
const outboundRoutes = require("./routes/outbound.routes");
const bulkInventoryRoutes = require("./routes/bulkInventory.routes");
const supplierRoutes = require("./routes/suppliers.routes");
const bulkInboundRoutes = require("./routes/bulkInbound.routes");
const bulkOutboundRoutes = require("./routes/bulkOutbound.routes");
const outboundDocumentsRoutes = require("./routes/outboundDocuments.routes");
const outboundAttachmentRoutes = require("./routes/outboundAttachment.routes");
const activityLogsRoutes = require("./routes/activityLogs.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const auditDashboardRoutes = require("./routes/auditDashboard.routes");

const inventoryValuationRoutes = require("./routes/inventoryValuation.routes");







const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ REQUIRED

// Root route (for sanity check)
app.get("/", (req, res) => {
  res.json({ message: "WMS Backend is running 🚀" });
});


// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "WMS backend running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/inbound", inboundRoutes);
app.use("/api/outbound", outboundRoutes);
app.use("/api/bulk", bulkInventoryRoutes);
app.use("/api/bulk/inbound", bulkInboundRoutes);
app.use("/api/bulk", bulkOutboundRoutes);
app.use("/api/outbound", outboundDocumentsRoutes);
app.use("/api/outbound", outboundAttachmentRoutes);
app.use("/api/activity-logs", activityLogsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/inventory", inventoryValuationRoutes);
app.use("/api/audit", auditDashboardRoutes);




// Static files for outbound attachments
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);


module.exports = app;
