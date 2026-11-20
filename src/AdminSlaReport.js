// src/AdminSlaReport.js

import { useEffect, useState } from "react";
import { Layout } from "./App";

const API_BASE = "/GrievanceServices/epds";

const SLA_API = "GetSlaDaysCountDetails";



const number = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

async function post(endpoint, body = {}) {
  const url = `${API_BASE}/${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Invalid response (${response.status}): ${text.slice(0, 300)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${
        data.respMessage ||
        data.respMsg ||
        response.statusText
      }`
    );
  }

  return data;
}

async function loadReport(endpoint, payload) {
  console.log("SLA API URL:", `${API_BASE}/${endpoint}`);
  console.log("SLA API Request:", payload);

  const data = await post(endpoint, payload);

  console.log("SLA API Full Response:", data);

  if (String(data.respCode) === "-104") {
    return [];
  }

  if (String(data.respCode) !== "0") {
    throw new Error(
      data.respMsg ||
      data.respMessage ||
      "Unable to load SLA report"
    );
  }

  // Safely extract list regardless of property name variations in response
  const list =
    data.detailsListGreater ||
    data.detailsListLess ||
    data.detailsList ||
    data.resultList ||
    (Array.isArray(data) ? data : null);

  console.log("SLA Response List:", list);

  if (list == null) {
    return [];
  }

  if (!Array.isArray(list)) {
    throw new Error("SLA response list is not an array.");
  }

return list.map((item) => ({
  distCode: String(item.distCode ?? ""),
  distName: item.distName || "",
  ofcCode: String(item.ofcCode ?? ""),
  ofcName: item.ofcName || "",
  total: number(item.totalCount),
  above: number(item.gpending),
  below: number(item.lpending),
}));
}

const th = {
  background: "#5f8a4d",
  color: "#fff",
  fontWeight: 700,
  padding: "9px 6px",
  border: "1px solid #555",
  textAlign: "center",
};

const td = {
  padding: "7px 6px",
  border: "1px solid #777",
  textAlign: "center",
};

const buttonStyle = {
  color: "#fff",
  border: 0,
  borderRadius: 4,
  padding: "7px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

export default function AdminSlaReport() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState(null);
  const [refresh, setRefresh] = useState(0);

useEffect(() => {
  let cancelled = false;

  const load = async () => {
    setLoading(true);
    setError("");
    setRows([]);

    try {
      const result = await loadReport(
        "GetSlaDaysCountDetails",
        {
          distCode: district ? district.code : "All",
          ofcCode: "All",
          flag: 0,
        }
      );

      if (!cancelled) {
        setRows(result);
      }
    } catch (e) {
      console.error("SLA Report Error:", e);

      if (!cancelled) {
        setError(e.message);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  load();

  return () => {
    cancelled = true;
  };
}, [district, refresh]);
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const above = rows.reduce((sum, row) => sum + row.above, 0);
  const below = rows.reduce((sum, row) => sum + row.below, 0);

  const back = () => {
    setDistrict(null);
  };

  return (
    <Layout admin>
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          margin: "10px 24px",
        }}
      >
        {district && (
          <button
            type="button"
            style={{ ...buttonStyle, background: "#337ab7" }}
            onClick={back}
          >
            Back
          </button>
        )}

        <button
          type="button"
          style={{ ...buttonStyle, background: "#337ab7" }}
          onClick={() => setRefresh((v) => v + 1)}
          disabled={loading}
        >
          Refresh
        </button>

        <button
          type="button"
          style={{ ...buttonStyle, background: "#5cb85c" }}
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      {district && (
        <div
          style={{
            margin: "8px 24px",
            color: "#8a2be2",
            fontSize: 14,
          }}
        >
          District Name: {district.name}
        </div>
      )}

      <div className="igrms-card">
        <div className="card-title">
          {district
            ? "Mandal wise SLA Days Complaint Details"
            : "District wise SLA Days Complaint Details"}
        </div>

        <div style={{ padding: 14 }}>
          {error && <div className="banner fail">{error}</div>}

          <div className="status-scroll" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={th}>
                    {district ? "Mandal Name" : "District Name"}
                  </th>
                  <th style={th}>Total</th>
                  <th style={th}>Above SLA Days</th>
                  <th style={th}>Below SLA Days</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td style={td} colSpan={4}>
                      Loading...
                    </td>
                  </tr>
                )}

                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td style={td} colSpan={4}>
                      No records found
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row, index) => (
                    <tr
                      key={`${row.distCode}-${row.ofcCode}-${index}`}
                      style={{
                        background: index % 2 === 0 ? "#fff" : "#d9d9d9",
                      }}
                    >
                      <td style={td}>
                        {district ? (
                          row.ofcName || "Mandal"
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDistrict({
                                code: row.distCode,
                                name: row.distName,
                              })
                            }
                            style={{
                              border: 0,
                              background: "none",
                              color: "#0000ee",
                              cursor: "pointer",
                              font: "inherit",
                              textDecoration: "underline",
                            }}
                          >
                            {row.distName}
                          </button>
                        )}
                      </td>

                      <td style={td}>{row.total}</td>
                      <td style={td}>{row.above}</td>
                      <td style={td}>{row.below}</td>
                    </tr>
                  ))}
              </tbody>

              {!loading && rows.length > 0 && (
                <tfoot>
                  <tr
                    style={{
                      background: "#eee",
                      fontWeight: 700,
                    }}
                  >
                    <td style={td}>Total</td>
                    <td style={td}>{total}</td>
                    <td style={td}>{above}</td>
                    <td style={td}>{below}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}