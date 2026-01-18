import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth from "./auth/RequireAuth";

import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Inbound from "./pages/Inbound";
import Suppliers from "./pages/Suppliers";
import Outbound from "./pages/Outbound";
import ActivityLogs from "./pages/ActivityLogs";
import AuditDashboard from "./pages/AuditDashboard";


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ENTRY POINT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inbound" element={<Inbound />} />
            <Route path="/outbound" element={<Outbound />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/activity-logs" element={<ActivityLogs />} />
            <Route path="/audit-dashboard" element={<AuditDashboard />} />



          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
