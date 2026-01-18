import { useEffect, useState } from "react";
import { getOutboundHistory } from "../api/outbound";

export default function OutboundHistoryTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getOutboundHistory();
        setRows(data || []);
      } catch (e) {
        setError("Failed to load outbound history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="mt-6">Loading outbound history…</p>;
  if (error) return <p className="mt-6 text-red-600">{error}</p>;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold mb-3">Outbound History</h2>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Dispatch Date</th>
              <th className="border px-3 py-2 text-left">Customer</th>
              <th className="border px-3 py-2 text-left">SO Reference</th>
              <th className="border px-3 py-2 text-center">Items</th>
              <th className="border px-3 py-2 text-center">Total Qty</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="border px-3 py-4 text-center">
                  No outbound records found
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.outbound_id}>
                  <td className="border px-3 py-2">
                    {new Date(r.dispatch_date).toLocaleDateString()}
                  </td>
                  <td className="border px-3 py-2">{r.customer_name}</td>
                  <td className="border px-3 py-2">
                    {r.so_reference || "-"}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {r.total_items}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {r.total_quantity}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
