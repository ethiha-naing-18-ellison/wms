import { useEffect, useState } from "react";
import {
  fetchAuditSummary,
  fetchTopUsers,
  fetchTopProducts,
  fetchHighMovementProducts,
} from "../api/auditDashboard";

export default function AuditDashboard() {
  const [summary, setSummary] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [highMovement, setHighMovement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          summaryRes,
          usersRes,
          productsRes,
          movementRes,
        ] = await Promise.all([
          fetchAuditSummary(),
          fetchTopUsers(),
          fetchTopProducts(),
          fetchHighMovementProducts(),
        ]);

        setSummary(summaryRes);
        setTopUsers(usersRes);
        setTopProducts(productsRes);
        setHighMovement(movementRes);
      } catch (err) {
        setError("Failed to load audit dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) return <p>Loading audit dashboard…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Dashboard</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Total Actions" value={summary.total_actions} />
        <Stat label="Inbound Actions" value={summary.inbound_actions} />
        <Stat label="Outbound Actions" value={summary.outbound_actions} />
        <Stat label="Active Users" value={summary.active_users} />
      </div>

      {/* TOP USERS */}
      <Section title="Most Active Users">
        <SimpleTable
          headers={["User", "Role", "Actions"]}
          rows={topUsers.map(u => [
            u.email,
            u.role,
            u.action_count,
          ])}
        />
      </Section>

      {/* MOST EDITED PRODUCTS */}
      <Section title="Most Edited Products">
        <SimpleTable
          headers={["SKU", "Product", "Edits"]}
          rows={topProducts.map(p => [
            p.sku,
            p.name,
            p.edit_count,
          ])}
        />
      </Section>

      {/* HIGH MOVEMENT */}
      <Section title="Highest Stock Movement">
        <SimpleTable
          headers={["SKU", "Product", "Total Movement"]}
          rows={highMovement.map(p => [
            p.sku,
            p.name,
            p.total_movement,
          ])}
        />
      </Section>
    </div>
  );
}

/* ===== UI HELPERS ===== */

function Stat({ label, value }) {
  return (
    <div className="bg-white border rounded p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <table className="w-full border bg-white">
      <thead className="bg-gray-100">
        <tr>
          {headers.map(h => (
            <th key={h} className="p-2 text-left">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t">
            {r.map((c, j) => (
              <td key={j} className="p-2">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
