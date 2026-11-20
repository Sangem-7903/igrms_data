// src/AdminBtwDatesReport.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds";

export default function AdminBtwDatesReport() {
  const today = new Date();
  const monthAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30);

  const [fromDate, setFromDate] = useState(
    `${monthAgo.getFullYear()}-${String(monthAgo.getMonth() + 1).padStart(2, "0")}-${String(monthAgo.getDate()).padStart(2, "0")}`
  );
  const [toDate, setToDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  );
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const fetchReport = async () => {
    setError("");
    if (!fromDate || !toDate) {
      setError("Select the From Date and the To Date");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${EPDS_BASE}/AllMastersDistMandWiseBtwDates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complaintCode: "0",
          complaintSourceCode: "All",
          categoryCode: "All",
          subCategoryCode: "All",
          fromDate: `${fromDate} 00:00:00`,
          toDate: `${toDate} 23:59:59`,
          distCode: "All",
          mandalCode: "All",
          dispCode: "0",
          valNull: "",
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
        throw new Error(data.respMsg || "Failed to load report data");
      }

      const list = data.detailsList1 || [];
      setRows(
        list.map((r, i) => ({
          key: `${r.distCode || i}-${r.distName}`,
          name: r.distName,
          total: Number(r.total) || 0,
          pending: Number(r.pending) || 0,
          disposal: Number(r.approved) || 0,
          rejected: Number(r.rejected) || 0,
        }))
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sum = (k) => rows.reduce((acc, r) => acc + r[k], 0);

  const th = { background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "8px 6px", border: "1px solid #555", textAlign: "center" };
  const td = { padding: "3px 6px", border: "1px solid #555", textAlign: "center" };
  const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "9px 22px", cursor: "pointer", fontWeight: 600 };

  return (
    <Layout admin>
      <div className="igrms-card no-print" style={{ marginBottom: 20 }}>
        <div className="card-title">District wise Complaint Details (Between Dates)</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label className="field-label" style={{ margin: 0 }}>From Date :</label>
            <input type="date" style={{ height: 36, padding: "0 8px" }} value={fromDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label className="field-label" style={{ margin: 0 }}>To Date :</label>
            <input type="date" style={{ height: 36, padding: "0 8px" }} value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <button type="button" style={{ ...btn, background: "#337ab7" }} onClick={fetchReport} disabled={loading}>
              {loading ? "Loading…" : "Show"}
            </button>
            <button type="button" style={{ ...btn, background: "#5cb85c" }} onClick={() => window.print()}>
              Print
            </button>
          </div>
        </div>
        {error && <div className="banner fail" style={{ margin: "0 20px 14px" }}>{error}</div>}
      </div>

      <div className="igrms-card">
        <div className="card-title">District wise Complaint Details</div>
        <div style={{ padding: "12px 14px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>District Name</th>
                <th style={th}>Total</th>
                <th style={th}>Pending</th>
                <th style={th}>Disposal</th>
                <th style={th}>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td style={td} colSpan={5}>Loading…</td></tr>
              )}
              {!loading && loaded && !error && rows.length === 0 && (
                <tr><td style={td} colSpan={5}>No records found for these dates</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.key} style={{ background: i % 2 ? "#d9d9d9" : "#fff" }}>
                  <td style={td}>{r.name}</td>
                  <td style={td}>{r.total}</td>
                  <td style={td}>{r.pending}</td>
                  <td style={td}>{r.disposal}</td>
                  <td style={td}>{r.rejected}</td>
                </tr>
              ))}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr style={{ background: "#fff", fontWeight: 700 }}>
                  <td style={td}>Total</td>
                  <td style={td}>{sum("total")}</td>
                  <td style={td}>{sum("pending")}</td>
                  <td style={td}>{sum("disposal")}</td>
                  <td style={td}>{sum("rejected")}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </Layout>
  );
}