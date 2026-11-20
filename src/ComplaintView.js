// src/ComplaintView.js
import { useEffect, useState } from "react";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses
const STATE_CODE = "36";

// Both documented in REPORTS_Updated.docx (POST, JSON)
//   ComplaintDetailsForComplaintNumber { stateCode, complaintNO }
//     -> { respCode, respMessage, complaintList: [ one complaint ], complaintListHistory: [ transactions, oldest first ] }
//   FilePath { stateCode, complaintTransId } -> { respCode, respMsg, filePath: [{ filePath, encodedFile (base64) }] }
// Shows the "Complaint Details" and "Complaint History" cards for one complaint number.
// Every value on screen comes from the server: nothing is filled in when a field is missing.
const DETAILS_METHOD = "ComplaintDetailsForComplaintNumber";
const FILE_METHOD = "FilePath";

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
    /* not JSON */
  }
  if (!data) {
    // show the start of the server's own error text so the real cause is visible
    const snippet = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const where = res.status === 404 ? ` for ${EPDS_BASE}/${endpoint} (no such method on the server)` : "";
    throw new Error(`Server error (${res.status})${where}${snippet ? `: ${snippet}` : ""}`);
  }
  return data;
}

const msg = (d) => d.respMessage || d.respMsg || "Could not load the complaint";

// base64 text from the API (it contains line breaks) -> a blob URL the browser can open
function toBlobUrl(base64, path) {
  const clean = String(base64).replace(/\s+/g, "");
  const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
  const ext = (path.split(".").pop() || "").toLowerCase();
  const type = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : "image/jpeg";
  return URL.createObjectURL(new Blob([bytes], { type }));
}

// department look: green header, label / value pairs, history grid
const th = { background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "6px 6px", border: "1px solid #333", textAlign: "center" };
const td = { padding: "4px 6px", border: "1px solid #333", verticalAlign: "top" };
const lab = { padding: "8px 10px", textAlign: "right", fontWeight: 600, width: "13%", border: "1px solid #ddd", verticalAlign: "top" };
const val = { padding: "8px 10px", width: "20%", border: "1px solid #ddd", verticalAlign: "top", whiteSpace: "pre-wrap" };
const purple = { color: "#8a2be2", fontSize: 13 };
const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "9px 22px", cursor: "pointer", fontWeight: 600 };

export default function ComplaintView({ complaintNo, onBack }) {
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!complaintNo) {
      setComplaint(null);
      setHistory([]);
      return undefined;
    }
    let stale = false;
    setLoading(true);
    setError("");
    post(DETAILS_METHOD, { stateCode: STATE_CODE, complaintNO: String(complaintNo) })
      .then((d) => {
        if (stale) return;
        const c = (d.complaintList || [])[0];
        if (String(d.respCode) !== "0" || !c) throw new Error(msg(d));
        setComplaint(c);
        setHistory(d.complaintListHistory || []);
      })
      .catch((e) => {
        if (!stale) {
          setComplaint(null);
          setHistory([]);
          setError(e.message);
        }
      })
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [complaintNo]);

  // The History "View" link: the file comes back as base64 for one transaction
  const viewFile = async (transactionId) => {
    try {
      const d = await post(FILE_METHOD, { stateCode: STATE_CODE, complaintTransId: String(transactionId) });
      const f = (d.filePath || [])[0];
      if (String(d.respCode) !== "0" || !f || !f.encodedFile) throw new Error(msg(d));
      window.open(toBlobUrl(f.encodedFile, f.filePath || ""), "_blank", "noopener");
    } catch (e) {
      setError(`Could not open the file: ${e.message}`);
    }
  };

  // three label / value pairs per row, like the department page
  const c = complaint || {};
  const rows = [
    [["Complaint NO", c.complaintNO], ["Complaint Source", c.complaintSourceEngName], ["Complainee Type", c.complianeeTypeEngName]],
    [["Grievance Type", c.categoryEngName], ["Grievance Subject", c.subCategoryEngName], ["FP Shop NO", c.fpShopNo]],
    [["VIP Type", c.vipType], ["VIP Name", c.vipName], null],
    [["Do You Have Ration Card", c.rationCardExists], ["Ration Card No", c.rationCardNo], ["Description", c.complaintDescription]],
    [["Name", c.name], ["Gender", c.gender], ["Email", c.email]],
    [["Mobile Number", c.contactNumber], ["District", c.distName], ["Mandal", c.officeName]],
    [["Village/Ward", c.village], ["Address", c.address], null],
  ];

  if (loading) return <div className="igrms-card"><div style={{ padding: 16 }}>Loading…</div></div>;
  if (error && !complaint) return <div className="igrms-card"><div className="banner fail">{error}</div></div>;
  if (!complaint) return null;

  return (
    <>
      <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", gap: 12, margin: "10px 24px 0" }}>
        {onBack && (
          <button type="button" style={{ ...btn, background: "#337ab7" }} onClick={onBack}>Back</button>
        )}
        <button type="button" style={{ ...btn, background: "#5cb85c" }} onClick={() => window.print()}>Print</button>
      </div>
      {error && <div className="igrms-card"><div className="banner fail">{error}</div></div>}

      <div style={{ margin: "8px 24px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={purple}>District Name : {c.distName}</span>
        <span style={purple}>Mandal Name : {c.officeName}</span>
        <span style={purple}>Complaint No : {c.complaintNO}</span>
      </div>

      <div className="igrms-card">
        <div className="card-title">Complaint Details</div>
        <div style={{ padding: "6px 10px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.flatMap((cell, j) => [
                    <td key={`l${j}`} style={lab}>{cell ? cell[0] : ""}</td>,
                    <td key={`v${j}`} style={val}>{cell ? cell[1] : ""}</td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="igrms-card">
        <div className="card-title">Complaint History</div>
        <div style={{ padding: "6px 10px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Grievance Complaint ID", "Disposal Type", "From District", "From Mandal", "Complaint Action from User", "Complaint Forward to User", "Forward District", "Forward Mandal", "Complaint Transaction Remarks", "Inspector Action", "Entry Date", "File View"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td style={td} colSpan={12}>No history</td></tr>
              )}
              {history.map((h, i) => {
                const hasFile = h.transUploadFilePath && h.transUploadFilePath !== "NA";
                const last = i === history.length - 1 && history.length > 1;
                return (
                  <tr key={h.grievanceComplaintTransactionID} style={last ? { color: "#1b7a1b" } : undefined}>
                    <td style={td}>{h.complaintNO}</td>
                    <td style={td}>{h.disposalTypeEngName}</td>
                    <td style={td}>{h.hoDistEngName}</td>
                    <td style={td}>{h.hoMandalEngName}</td>
                    <td style={td}>{h.role}</td>
                    <td style={td}>{h.forwardUser}</td>
                    <td style={td}>{h.distName}</td>
                    <td style={td}>{h.officeName}</td>
                    <td style={td}>{h.complaintTransactionRemarks}</td>
                    <td style={td}>{h.inspAction}</td>
                    <td style={td}>{h.entryDate}</td>
                    <td style={td}>
                      {hasFile ? (
                        <button type="button" style={{ background: "none", border: 0, color: "#0000ee", cursor: "pointer", padding: 0, font: "inherit" }} onClick={() => viewFile(h.grievanceComplaintTransactionID)}>
                          View
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
