
// src/AdminComplaineeWiseReport.js

import { Fragment, useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds";

const REPORT_METHOD = "GetCompalineeWiseList";
const COMPLAINT_DETAILS_METHOD = "ComplaintDetailsForComplaintNumber";
const TYPES_METHOD = "ComplianeeType";
const STATE_CODE = "36";

async function post(endpoint, body = {}) {
  const res = await fetch(`${EPDS_BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch {
    // Server did not return JSON
  }

  if (!res.ok || !data) {
    const snippet = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);

    const where =
      res.status === 404
        ? ` for ${EPDS_BASE}/${endpoint} (API not found)`
        : "";

    throw new Error(
      `Server error (${res.status})${where}${
        snippet ? `: ${snippet}` : ""
      }`
    );
  }

  return data;
}

const NO_DATA = ["-100", "-104"];

const isOk = (d) =>
  String(d.respCode) === "0" ||
  NO_DATA.includes(String(d.respCode));

const message = (d) =>
  d.respMsg || d.respMessage || "Could not load the report";

// Table styles
const th = {
  background: "#5f8a4d",
  color: "#fff",
  fontWeight: 700,
  padding: "8px 6px",
  border: "1px solid #555",
  textAlign: "center",
};

const td = {
  padding: "5px 6px",
  border: "1px solid #555",
  textAlign: "center",
};

const link = {
  background: "none",
  border: 0,
  color: "#0000ee",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
  textDecoration: "underline",
};

const btn = {
  color: "#fff",
  border: 0,
  borderRadius: 4,
  padding: "7px 14px",
  cursor: "pointer",
  fontWeight: 600,
};

const crumb = {
  color: "#8a2be2",
  fontSize: 13,
};

// Convert API property names into readable labels
function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (s) => s.toUpperCase());
}

// Complaint Details and Complaint History
function ComplaintDetailView({
  complaint,
  history,
  onBack,
  detailLoading,
}) {
  const fields = Object.entries(complaint || {}).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      value !== ""
  );

  const historyColumns = [
    ...new Set(history.flatMap((item) => Object.keys(item))),
  ];

  return (
    <>
      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 10,
          padding: "10px 14px",
        }}
      >
        <button
          type="button"
          style={{ ...btn, background: "#337ab7" }}
          onClick={onBack}
        >
          Back
        </button>

        <button
          type="button"
          style={{ ...btn, background: "#5cb85c" }}
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      {/* Complaint Details */}
      <div className="igrms-card">
        <div
          className="card-title"
          style={{
            background: "#ffc342",
            color: "#7a3300",
          }}
        >
          Complaint Details
        </div>

        <div style={{ padding: 12, overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <tbody>
              {Array.from(
                { length: Math.ceil(fields.length / 3) },
                (_, rowIndex) => (
                  <tr key={rowIndex}>
                    {fields
                      .slice(rowIndex * 3, rowIndex * 3 + 3)
                      .map(([key, value]) => (
                        <Fragment key={key}>
                          <td
                            style={{
                              ...td,
                              textAlign: "right",
                              fontWeight: 600,
                              background: "#f1f1f1",
                            }}
                          >
                            {formatLabel(key)}
                          </td>

                          <td
                            style={{
                              ...td,
                              textAlign: "left",
                              wordBreak: "break-word",
                            }}
                          >
                            {String(value)}
                          </td>
                        </Fragment>
                      ))}
                  </tr>
                )
              )}
            </tbody>
          </table>

          {fields.length === 0 && (
            <p>No complaint details found.</p>
          )}
        </div>
      </div>

      {/* Complaint History */}
      <div className="igrms-card">
        <div
          className="card-title"
          style={{
            background: "#ffc342",
            color: "#7a3300",
          }}
        >
          Complaint History
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                {historyColumns.map((key) => (
                  <th key={key} style={th}>
                    {formatLabel(key)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    style={td}
                    colSpan={Math.max(historyColumns.length, 1)}
                  >
                    No complaint history found.
                  </td>
                </tr>
              ) : (
                history.map((item, index) => (
                  <tr key={index}>
                    {historyColumns.map((key) => (
                      <td
                        key={key}
                        style={{
                          ...td,
                          textAlign: "left",
                          minWidth: 100,
                          wordBreak: "break-word",
                        }}
                      >
                        {item[key] == null || item[key] === ""
                          ? "-"
                          : String(item[key])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// District and Mandal count table
function CountTable({ title, firstCol, rows, onOpen }) {
  const sum = (key) =>
    rows.reduce(
      (total, row) => total + (Number(row[key]) || 0),
      0
    );

  return (
    <div className="igrms-card">
      <div className="card-title">{title}</div>

      <div style={{ padding: "12px 14px", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              <th style={th}>{firstCol}</th>
              <th style={th}>Total</th>
              <th style={th}>Pending</th>
              <th style={th}>Disposal</th>
              <th style={th}>Rejected</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const name =
                onOpen === "office"
                  ? r.ofcName || "(no office name)"
                  : r.distName;

              return (
                <tr
                  key={`${r.distCode}-${r.ofcCode ?? i}`}
                  style={{
                    background: i % 2 ? "#d9d9d9" : "#fff",
                  }}
                >
                  <td style={td}>
                    {r.__open ? (
                      <button
                        type="button"
                        style={link}
                        onClick={r.__open}
                      >
                        {name}
                      </button>
                    ) : (
                      name
                    )}
                  </td>

                  <td style={td}>{r.totalCount}</td>
                  <td style={td}>{r.pending}</td>
                  <td style={td}>{r.approved}</td>
                  <td style={td}>{r.rejected}</td>
                </tr>
              );
            })}
          </tbody>

          {rows.length > 0 && (
            <tfoot>
              <tr style={{ background: "#fff", fontWeight: 700 }}>
                <td style={td}>Total</td>
                <td style={td}>{sum("totalCount")}</td>
                <td style={td}>{sum("pending")}</td>
                <td style={td}>{sum("approved")}</td>
                <td style={td}>{sum("rejected")}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

// Complaint list with clickable Complaint Number
function ComplaintTable({
  title,
  rows,
  onComplaintClick,
  detailLoading,
}) {
  return (
    <div className="igrms-card">
      <div className="card-title">{title}</div>

      <div style={{ padding: "12px 14px", overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              {[
                "Complaint No",
                "Complaint Source",
                "Complinee Type",
                "Grievance Type Name",
                "Grievance Subject Name",
                "Name",
                "Address",
                "Mobile Number",
                "Gender",
                "Date",
              ].map((heading) => (
                <th key={heading} style={th}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td style={td} colSpan={10}>
                  No complaints
                </td>
              </tr>
            )}

            {rows.map((c, i) => (
              <tr
                key={c.complaintNO || i}
                style={{
                  background: i % 2 ? "#d9d9d9" : "#fff",
                }}
              >
                <td style={td}>
                  <button
                    type="button"
                    style={link}
                    disabled={detailLoading}
                    onClick={() =>
                      onComplaintClick(c.complaintNO)
                    }
                  >
                    {c.complaintNO}
                  </button>
                </td>

                <td style={td}>{c.complaintSource}</td>
                <td style={td}>{c.complaintTypeName}</td>
                <td style={td}>{c.categoryEngName}</td>
                <td style={td}>{c.subCategoryEngName}</td>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.address}</td>
                <td style={td}>{c.contactNumber}</td>
                <td style={td}>{c.gender}</td>
                <td style={td}>{c.transEntryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Main report
export default function AdminComplaineeWiseReport() {
  const [types, setTypes] = useState([]);
  const [typeCode, setTypeCode] = useState("");
  const [district, setDistrict] = useState(null);
  const [office, setOffice] = useState(null);

  const [data, setData] = useState({
    counts: [],
    pending: [],
    disposed: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Complaint detail state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Load Complainee Types
  useEffect(() => {
    let active = true;

    post(TYPES_METHOD, {})
      .then((d) => {
        if (!isOk(d)) throw new Error(message(d));

        if (active) {
          setTypes(
            (d.compTypeList || []).filter(
              (t) =>
                !t.activestatus ||
                String(t.activestatus).toUpperCase() === "Y"
            )
          );
        }
      })
      .catch((e) => {
        if (active) {
          setError(
            `Could not load complainee types: ${e.message}`
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Load district, mandal or complaint list
  useEffect(() => {
    if (!typeCode || selectedComplaint) {
      return undefined;
    }

    let stale = false;

    setLoading(true);
    setError("");

    post(REPORT_METHOD, {
      complianeeTypeCode: String(typeCode),
      distCode: district ? String(district.code) : "All",
      ofcCode: office ? String(office.code) : "All",
      stateCode: STATE_CODE,
      transDisposalCode: "0",
    })
      .then((d) => {
        if (stale) return;

        if (!isOk(d)) {
          throw new Error(message(d));
        }

        setData({
          counts: d.totalCountList || [],
          pending: d.detailsList || [],
          disposed: d.rejectDispWiseList || [],
        });
      })
      .catch((e) => {
        if (!stale) {
          setData({
            counts: [],
            pending: [],
            disposed: [],
          });
          setError(e.message);
        }
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });

    return () => {
      stale = true;
    };
  }, [typeCode, district, office, selectedComplaint]);

  const level = office
    ? "complaints"
    : district
    ? "offices"
    : "districts";

  const back = () => {
    if (office) {
      setOffice(null);
    } else {
      setDistrict(null);
    }
  };

  const changeType = (code) => {
    setTypeCode(code);
    setDistrict(null);
    setOffice(null);
    setSelectedComplaint(null);
    setComplaintHistory([]);
    setDetailError("");
  };

  // Click Complaint No. and call detail API
  const openComplaintDetails = async (complaintNO) => {
    if (!complaintNO) {
      setDetailError("Complaint number is missing.");
      return;
    }

    setDetailLoading(true);
    setDetailError("");
    setSelectedComplaint(null);
    setComplaintHistory([]);

    try {
      const d = await post(COMPLAINT_DETAILS_METHOD, {
        stateCode: STATE_CODE,
        complaintNO: String(complaintNO),
      });

      if (!isOk(d) || String(d.respCode) !== "0") {
        throw new Error(message(d));
      }

      const complaint = d.complaintList?.[0];

      if (!complaint) {
        throw new Error("Complaint details not found.");
      }

      setSelectedComplaint(complaint);
      setComplaintHistory(
        Array.isArray(d.complaintListHistory)
          ? d.complaintListHistory
          : []
      );
    } catch (e) {
      setDetailError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  // District and office drilldown actions
  const rows = data.counts.map((r) => ({
    ...r,
    __open:
      level === "districts"
        ? () =>
            setDistrict({
              code: r.distCode,
              name: r.distName,
            })
        : level === "offices" && r.ofcCode
        ? () =>
            setOffice({
              code: r.ofcCode,
              name: r.ofcName,
            })
        : null,
  }));

  const typeName = types.find(
    (t) => String(t.compTypeCode) === String(typeCode)
  )?.compTypeName;

  return (
    <Layout admin>
      {/*
        When a complaint is selected, show the details view
        instead of the report tables.
      */}
      {!selectedComplaint && !detailLoading && (
        <>
          <div className="igrms-card">
            <div className="card-title">
              Complainee Type wise Complaint Details
            </div>

            <div
              className="no-print"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 20px",
                flexWrap: "wrap",
              }}
            >
              <label
                className="field-label"
                style={{ margin: 0 }}
              >
                Complianee Type<span className="req">*</span>
              </label>

              <select
                style={{ width: 280, height: 36 }}
                value={typeCode}
                onChange={(e) => changeType(e.target.value)}
              >
                <option value="">Select</option>

                {types.map((t) => (
                  <option
                    key={t.compTypeCode}
                    value={t.compTypeCode}
                  >
                    {t.compTypeName}
                  </option>
                ))}
              </select>

              {(district || office) && (
                <button
                  type="button"
                  style={{ ...btn, background: "#337ab7" }}
                  onClick={back}
                >
                  Back
                </button>
              )}

              {typeCode && (
                <button
                  type="button"
                  style={{ ...btn, background: "#5cb85c" }}
                  onClick={() => window.print()}
                >
                  Print
                </button>
              )}
            </div>

            {error && (
              <div className="banner fail">{error}</div>
            )}
          </div>

          {typeCode && (district || office) && (
            <div
              style={{
                margin: "4px 24px",
                display: "flex",
                gap: 40,
                flexWrap: "wrap",
              }}
            >
              <span style={crumb}>
                Complianee Type : {typeName}
              </span>

              <span style={crumb}>
                District Name : {district?.name}
              </span>

              {office && (
                <span style={crumb}>
                  Mandal Name : {office.name}
                </span>
              )}
            </div>
          )}

          {typeCode && loading && (
            <div className="igrms-card">
              <div style={{ padding: 16 }}>Loading…</div>
            </div>
          )}

          {typeCode &&
            !loading &&
            !error &&
            level === "districts" &&
            (data.counts.length ? (
              <CountTable
                title="District wise Complaint Details"
                firstCol="District Name"
                rows={rows}
                onOpen="district"
              />
            ) : (
              <div className="igrms-card">
                <div style={{ padding: 16 }}>
                  No records found
                </div>
              </div>
            ))}

          {typeCode &&
            !loading &&
            !error &&
            level === "offices" &&
            (data.counts.length ? (
              <CountTable
                title="Mandal wise Complaint Details"
                firstCol="Mandal Name"
                rows={rows}
                onOpen="office"
              />
            ) : (
              <div className="igrms-card">
                <div style={{ padding: 16 }}>
                  No records found
                </div>
              </div>
            ))}

          {typeCode &&
            !loading &&
            !error &&
            level === "complaints" && (
              <>
                <ComplaintTable
                  title="Pending Complaint Details"
                  rows={data.pending}
                  onComplaintClick={openComplaintDetails}
                  detailLoading={detailLoading}
                />

                <ComplaintTable
                  title="Disposed / Rejected Complaint Details"
                  rows={data.disposed}
                  onComplaintClick={openComplaintDetails}
                  detailLoading={detailLoading}
                />
              </>
            )}
        </>
      )}

      {detailLoading && (
        <div className="igrms-card">
          <div style={{ padding: 16 }}>
            Loading complaint details...
          </div>
        </div>
      )}

      {detailError && (
        <div className="banner fail" style={{ margin: 12 }}>
          {detailError}
          <button
            type="button"
            style={{ ...btn, background: "#337ab7", marginLeft: 12 }}
            onClick={() => setDetailError("")}
          >
            Close
          </button>
        </div>
      )}

      {selectedComplaint && !detailLoading && (
        <ComplaintDetailView
          complaint={selectedComplaint}
          history={complaintHistory}
          onBack={() => {
            setSelectedComplaint(null);
            setComplaintHistory([]);
            setDetailError("");
          }}
        />
      )}
    </Layout>
  );
}
