// src/AdminUserRoleReport.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds";

export default function AdminUserRoleReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchReport = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${EPDS_BASE}/UserRoleDist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distCode: "All",
          mandCode: "All",
          disposal: "0",
          roleId: "All"
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid server response format");
      }

      if (String(data.respCode) !== "0") {
        throw new Error(data.respMsg || "Failed to load user role report");
      }

      setRows(data.userRoleList || []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // Group rows by district name as seen in the interface
  const groupedByDistrict = rows.reduce((acc, r) => {
    const dist = r.distName || "Unknown District";
    if (!acc[dist]) acc[dist] = [];
    acc[dist].push(r);
    return acc;
  }, {});

  const th = { background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "8px 6px", border: "1px solid #555", textAlign: "center" };
  const td = { padding: "3px 6px", border: "1px solid #555", textAlign: "center" };
  const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "9px 22px", cursor: "pointer", fontWeight: 600 };

  return (
    <Layout admin>
      <div className="igrms-card no-print" style={{ marginBottom: 20 }}>
        <div className="card-title">User Role wise Disposal Report</div>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px" }}>
          <button type="button" style={{ ...btn, background: "#5cb85c" }} onClick={() => window.print()}>
            Print
          </button>
        </div>
        {error && <div className="banner fail" style={{ margin: "0 20px 14px" }}>{error}</div>}
      </div>

      <div className="igrms-card">
        <div className="card-title">District wise Role Disposal Details</div>
        <div style={{ padding: "12px 14px", overflowX: "auto" }}>
          {loading && <div style={{ textAlign: "center", padding: 20 }}>Loading…</div>}
          {!loading && loaded && !error && Object.keys(groupedByDistrict).length === 0 && (
            <div style={{ textAlign: "center", padding: 20 }}>No records found</div>
          )}

          {Object.entries(groupedByDistrict).map(([distName, distRows]) => (
            <div key={distName} style={{ marginBottom: 30 }}>
              <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 8, color: "#333" }}>
                District Name :{distName}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginBottom: 20 }}>
                <thead>
                  <tr>
                    <th style={th}>Role Name</th>
                    <th style={th}>Total</th>
                    <th style={th}>Pending</th>
                    <th style={th}>Disposal</th>
                    <th style={th}>Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {distRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 ? "#d9d9d9" : "#fff" }}>
                      <td style={{ ...td, textAlign: "left" }}>{r.role}</td>
                      <td style={td}>{r.total}</td>
                      <td style={td}>{r.pending}</td>
                      <td style={td}>{r.approved}</td>
                      <td style={td}>{r.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}