// src/AdminComplaintSearchPage.js
import { useEffect, useState } from "react";
import { Layout } from "./App";
import ComplaintView from "./ComplaintView";

const EPDS_BASE = "/GrievanceServices/epds";
const ALL = "All";



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
    const snippet = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const where = res.status === 404 ? ` for ${EPDS_BASE}/${endpoint} (no such method on the server)` : "";
    throw new Error(`Server error (${res.status})${where}${snippet ? `: ${snippet}` : ""}`);
  }
  return data;
}

const okCode = (d) => ["0", "-104", "-100"].includes(String(d.respCode));
const message = (d) => d.respMsg || d.respMessage || "Could not load the list";

const toResultRows = (data) => {
  const list = Object.values(data).find(Array.isArray) || [];
  return list.map((r, i) => ({
    key: `${r.complaintNO ?? r.complaintNo ?? r.complaintId ?? i}-${i}`,
    no: String(r.complaintNO ?? r.complaintNo ?? r.complaintId ?? ""),
    name: r.name ?? r.complainantName ?? "",
    address: r.address ?? "",
    category: r.categoryEngName ?? r.catName ?? r.categoryName ?? "",
    subCategory: r.subCategoryEngName ?? r.subCatName ?? r.subCategoryName ?? "",
  }));
};

const th = {
  background: "#44668c",
  color: "#fff",
  fontWeight: 700,
  padding: "6px 8px",
  border: "1px solid #333",
  textAlign: "center",
};
const td = { padding: "5px 8px", border: "1px solid #333", background: "#fff" };
const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "8px 20px", cursor: "pointer", fontWeight: 600 };
const selectBtn = {
  background: "#efefef",
  color: "#000",
  border: "1px solid #767676",
  borderRadius: 2,
  padding: "2px 10px",
  cursor: "pointer",
  fontSize: 12,
};

const MODES = [
  { id: "complaintNo", label: "Complaint No.", field: "Complaint Number", placeholder: "Enter Complaint No." },
  { id: "mobile", label: "Mobile Number", field: "Mobile Number", placeholder: "Enter Mobile Number" },
  { id: "name", label: "Name", field: "Name", placeholder: "Enter Name" },
];

export default function AdminComplaintSearchPage() {
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [dist, setDist] = useState(ALL);
  const [mandal, setMandal] = useState(ALL);
  const [mode, setMode] = useState("complaintNo");
  const [value, setValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    post("getDistCodes", {})
      .then((d) => {
        if (!okCode(d)) throw new Error(message(d));
        setDistricts(d.distList || []);
      })
      .catch((e) => setError(`Could not load districts: ${e.message}`));
  }, []);

  useEffect(() => {
    setMandal(ALL);
    setMandals([]);
    if (dist === ALL) return undefined;
    let stale = false;
    post("getOfficeCodes", { distCode: Number(dist) })
      .then((d) => {
        if (stale) return;
        if (!okCode(d)) throw new Error(message(d));
        setMandals(d.officeList || []);
      })
      .catch((e) => !stale && setError(`Could not load mandals: ${e.message}`));
    return () => {
      stale = true;
    };
  }, [dist]);

  const reset = () => {
    setResults(null);
    setSelected("");
    setError("");
  };

  const chooseMode = (m) => {
    setMode(m);
    setValue("");
    reset();
  };

  const submit = async (e) => {
    e.preventDefault();
    reset();
    const q = value.trim();

    if (mode === "complaintNo") {
      if (!/^\d{4,12}$/.test(q)) return setError("Enter a valid complaint number");
      setSelected(q);
      return undefined;
    }
    if (mode === "mobile" && !/^[6-9]\d{9}$/.test(q)) return setError("Enter a valid 10-digit mobile number");
    if (mode === "name" && q.length < 3) return setError("Enter at least 3 letters of the name");

    setLoading(true);
    try {
    const data = await post(
  "ComplaintDetailsForComplaintNumberforPublic",
  {
    stateCode: "36",
    complaintNO: q
  }
);
      if (!okCode(data)) throw new Error(message(data));
      setResults(toResultRows(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  const field = MODES.find((m) => m.id === mode);

  return (
    <Layout admin>
      <div className="igrms-card no-print">
        <div className="card-title">View Complaint Status</div>
        <form onSubmit={submit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="field-label" style={{ margin: 0, width: 110, textAlign: "right" }}>District</label>
              <select style={{ width: 230, height: 34 }} value={dist} onChange={(e) => { setDist(e.target.value); reset(); }}>
                <option value={ALL}>All</option>
                {districts.map((d) => (
                  <option key={d.distCode} value={d.distCode}>{d.distName}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="field-label" style={{ margin: 0, width: 110, textAlign: "right" }}>Mandal</label>
              <select style={{ width: 230, height: 34 }} value={mandal} onChange={(e) => { setMandal(e.target.value); reset(); }} disabled={dist === ALL}>
                <option value={ALL}>All</option>
                {mandals.map((m) => (
                  <option key={m.officeCode} value={m.officeCode}>{m.officeName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 22 }}>
              {MODES.map((m) => (
                <label key={m.id} style={{ fontWeight: 600 }}>
                  <input type="radio" name="searchMode" checked={mode === m.id} onChange={() => chooseMode(m.id)} /> {m.label}
                </label>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <label className="field-label" style={{ margin: 0 }}>{field.field}</label>
              <input
                style={{ width: 220, height: 34 }}
                value={value}
                onChange={(e) => setValue(mode === "name" ? e.target.value : e.target.value.replace(/\D/g, ""))}
                maxLength={mode === "mobile" ? 10 : mode === "complaintNo" ? 12 : 60}
                inputMode={mode === "name" ? "text" : "numeric"}
                placeholder={field.placeholder}
              />
              <button type="submit" style={{ ...btn, background: "#337ab7" }} disabled={loading}>
                {loading ? "Searching…" : "Submit"}
              </button>
            </div>
          </div>
          {error && <div className="banner fail">{error}</div>}
        </form>
      </div>

      {/* Results table stays visible even after a complaint is selected */}
      {results && (
        <div className="igrms-card no-print">
          <div className="card-title">Grievance Complaints Details</div>
          <div style={{ padding: "8px 10px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={th}>Grievance Complaint ID</th>
                  <th style={th}>Name</th>
                  <th style={th}>Address</th>
                  <th style={th}>Category</th>
                  <th style={th}>Sub Category</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && (
                  <tr><td style={{ ...td, textAlign: "center" }} colSpan={6}>No complaints found</td></tr>
                )}
                {results.map((r) => (
                  <tr
                    key={r.key}
                    style={selected === r.no ? { backgroundColor: "#eef5fc" } : undefined}
                  >
                    <td style={td}>{r.no}</td>
                    <td style={td}>{r.name}</td>
                    <td style={td}>{r.address}</td>
                    <td style={td}>{r.category}</td>
                    <td style={td}>{r.subCategory}</td>
                    <td style={{ ...td, textAlign: "center", width: 80 }}>
                      <button
                        type="button"
                        style={selectBtn}
                        disabled={!r.no}
                        onClick={() => setSelected(r.no)}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Renders Complaint Details & Complaint History directly below the results table */}
      {selected && (
        <ComplaintView
          key={selected}
          complaintNo={selected}
          onBack={() => setSelected("")}
        />
      )}
    </Layout>
  );
}