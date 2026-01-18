import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../auth/AuthContext";

export default function Suppliers() {
  const { user } = useAuth();
  const role = user?.role;

  const canCreate = role === "admin";
  const canView = role === "admin" || role === "manager" || role === "operator";

  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
  });
  const [msg, setMsg] = useState("");

  const load = async () => {
    setMsg("");
    try {
      const res = await api.get("/suppliers");
      setSuppliers(res.data);
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to load suppliers.");
    }
  };

  useEffect(() => {
    if (canView) load();
  }, [canView]);

  const createSupplier = async () => {
    setMsg("");
    if (!form.name.trim()) {
      setMsg("Supplier name is required.");
      return;
    }

    try {
      await api.post("/suppliers", {
        name: form.name.trim(),
        contact_person: form.contact_person.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      });
      setForm({ name: "", contact_person: "", phone: "", email: "" });
      load();
    } catch (err) {
      setMsg(err?.response?.data?.error || "Create supplier failed.");
    }
  };

  if (!canView) {
    return (
      <div className="bg-white border rounded p-4">
        <div className="font-semibold mb-1">Suppliers</div>
        <div className="text-sm text-gray-600">
          You do not have permission to view suppliers.
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Suppliers</h1>

      {/* ADMIN ONLY: ADD SUPPLIER */}
      {canCreate && (
        <div className="border bg-white rounded p-4 mb-6">
          <div className="font-semibold mb-3">Add Supplier (Admin)</div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              className="border p-2 rounded"
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border p-2 rounded"
              placeholder="Contact Person"
              value={form.contact_person}
              onChange={(e) =>
                setForm({ ...form, contact_person: e.target.value })
              }
            />
            <input
              className="border p-2 rounded"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              className="border p-2 rounded"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={createSupplier}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Save Supplier
            </button>
            <button onClick={load} className="border px-4 py-2 rounded">
              Refresh
            </button>
          </div>

          {msg && <div className="mt-2 text-sm text-red-600">{msg}</div>}
        </div>
      )}

      {/* READ-ONLY NOTICE */}
      {!canCreate && (
        <div className="mb-3 text-sm text-gray-600">
          You have read-only access to suppliers.
        </div>
      )}

      {/* SUPPLIERS TABLE */}
      <table className="w-full border bg-white rounded">
        <thead className="bg-gray-100 text-xs uppercase text-gray-600">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Contact</th>
            <th className="p-3 text-left">Phone</th>
            <th className="p-3 text-left">Email</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.supplier_id} className="border-t hover:bg-gray-50">
              <td className="p-3">{s.name}</td>
              <td className="p-3">{s.contact_person || "-"}</td>
              <td className="p-3">{s.phone || "-"}</td>
              <td className="p-3">{s.email || "-"}</td>
            </tr>
          ))}
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={4} className="p-4 text-gray-500">
                No suppliers found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
