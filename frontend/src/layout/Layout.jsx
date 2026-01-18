// frontend/src/layout/Layout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-4 py-2 rounded-md text-sm font-medium transition ${
      isActive
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">

          {/* NAVIGATION */}
          <nav className="flex gap-2">
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>

            <NavLink to="/activity-logs" className={linkClass}>
              Activity Logs
            </NavLink>

             {["admin", "manager"].includes(user.role) && (
    <NavLink to="/audit-dashboard" className={linkClass}>
      Audit Dashboard
    </NavLink>
  )}


            <NavLink to="/products" className={linkClass}>
              Products
            </NavLink>

            <NavLink to="/inventory" className={linkClass}>
              Inventory
            </NavLink>

            <NavLink to="/inbound" className={linkClass}>
              Inbound
            </NavLink>

            {/* 
              OUTBOUND
              - Admin / Manager: full access (handled inside page)
              - Operator: view-only (history)
            */}
            {["admin", "manager", "operator"].includes(user.role) && (
              <NavLink to="/outbound" className={linkClass}>
                Outbound
              </NavLink>
            )}

            {/* 
              SUPPLIERS
              Reference data:
              - All roles can VIEW
              - Create/edit enforced inside Suppliers.jsx + backend
            */}
            {["admin", "manager", "operator"].includes(user.role) && (
              <NavLink to="/suppliers" className={linkClass}>
                Suppliers
              </NavLink>
            )}
          </nav>

          {/* USER INFO */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Role: <b className="capitalize">{user.role}</b>
            </span>

            <button
              onClick={logout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
