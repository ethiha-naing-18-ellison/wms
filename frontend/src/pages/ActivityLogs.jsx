import { useEffect, useState } from "react";
import { fetchActivityLogs } from "../api/activityLogs";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchActivityLogs();
      setLogs(data);
    } catch (err) {
      setError("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Activity Logs</h1>

      {loading && <div className="text-sm">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="border bg-white rounded">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Entity</th>
              <th className="p-3 text-left">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.log_id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{l.email || "-"}</td>
                <td className="p-3 text-sm capitalize">{l.role}</td>
                <td className="p-3 text-sm font-medium">{l.action}</td>
                <td className="p-3 text-sm">{l.entity}</td>
                <td className="p-3 text-sm">
                  {new Date(l.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-sm text-gray-500">
                  No activity recorded yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
