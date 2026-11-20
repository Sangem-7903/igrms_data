// src/AdminAllMastersReport.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// Report_AllMasters_Asondate_Dist.aspx in REPORTS_Updated.docx. Documented, all POST with JSON:
//   ComplaintSource      {}                                -> { compSourceList: [{ compSourceCode, compSourceName }] }
//   ComplianeeType       {}                                -> { compTypeList: [{ compTypeCode, compTypeName }] }
//   CatDetails           {}                                -> { categoryList: [{ categorycode, categoryengname }] }
//   GetMappingDetails    { complianeeTypeCode }            -> { getMappedDetailsList: [{ categoryCode, catName }] }
//   SubCategoryDetails   { catCode }                       -> { subCategoryList: [{ subCateCode, subCateName }] }
//   AllMastersDistMandWiseAsOnDate { complaintCode, complaintSourceCode, categoryCode, subCategoryCode,
//                                    distCode, valNull, mandalCode, dispCode }
//        -> { respCode, respMsg, detailsList1: [{ distCode, distName, officeCode, officeName, pending, approved, rejected, total }] }
// The document does not say what complaintCode means. It is sent here as the Complainee Type code, because the page
// has Complaint Source, Complainee Type, Grievance Type and Grievance Subject, and complaintSourceCode, categoryCode and
// subCategoryCode already cover three of them. Check the numbers against the live page.
const REPORT_METHOD = "AllMastersDistMandWiseAsOnDate";
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
    // show the start of the server's own error text so the real cause is visible
    const snippet = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    const where = res.status === 404 ? ` for ${EPDS_BASE}/${endpoint} (no such method on the server)` : "";
    throw new Error(`Server error (${res.status})${where}${snippet ? `: ${snippet}` : ""}`);
  }
  return data;
}

const okCode = (d) => ["0", "-104", "-100"].includes(String(d.respCode));
const message = (d) => d.respMsg || d.respMessage || "Could not load the list";
const num = (v) => Number(v) || 0;

// One dropdown list: loads when its inputs change, stays empty while `enabled` is false
function useList(enabled, load, deps) {
  const [state, setState] = useState({ list: [], loading: false, error: "" });
  useEffect(() => {
    if (!enabled) {
      setState({ list: [], loading: false, error: "" });
      return undefined;
    }
    let stale = false;
    setState({ list: [], loading: true, error: "" });
    load()
      .then((list) => !stale && setState({ list, loading: false, error: "" }))
      .catch((e) => !stale && setState({ list: [], loading: false, error: e.message }));
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const fetchList = async (endpoint, body, key, map) => {
  const d = await post(endpoint, body);
  if (!okCode(d)) throw new Error(message(d));
  return (d[key] || []).map(map);
};

// department table look: green header, grey / white rows, blue links
const th = { background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "8px 6px", border: "1px solid #555", textAlign: "center" };
const td = { padding: "3px 6px", border: "1px solid #555", textAlign: "center" };
const link = { background: "none", border: 0, color: "#0000ee", cursor: "pointer", padding: 0, font: "inherit" };
const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "9px 22px", cursor: "pointer", fontWeight: 600 };
const blue = { color: "#1565c0", fontSize: 13 };

function Select({ label, value, onChange, state, disabled }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <label className="field-label" style={{ margin: 0, width: 150, textAlign: "right" }}>
        {label}
        <span className="req">*</span>
      </label>
      <select style={{ width: 230, height: 36 }} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled || state.loading}>
        <option value={ALL}>{state.loading ? "Loading…" : "All"}</option>
        {state.list.map((o) => (
          <option key={o.code} value={o.code}>{o.name}</option>
        ))}
      </select>
    </div>
  );
}

export default function AdminAllMastersReport() {
  const [source, setSource] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [subject, setSubject] = useState(ALL);

  const sources = useList(true, () =>
    fetchList("ComplaintSource", {}, "compSourceList", (s) => ({ code: String(s.compSourceCode), name: s.compSourceName, on: s.activeStatus })), []);
  const types = useList(true, () =>
    fetchList("ComplianeeType", {}, "compTypeList", (t) => ({ code: String(t.compTypeCode), name: t.compTypeName, on: t.activestatus })), []);
  // Grievance types: every category when the type is All, otherwise the categories mapped to that type
  const categories = useList(true, () =>
    type === ALL
      ? fetchList("CatDetails", {}, "categoryList", (c) => ({ code: String(c.categorycode), name: c.categoryengname, on: c.activeStatus }))
      : fetchList("GetMappingDetails", { complianeeTypeCode: String(type) }, "getMappedDetailsList", (c) => ({ code: String(c.categoryCode), name: c.catName, on: c.activeStatus })),
    [type]);
  const subjects = useList(category !== ALL, () =>
    fetchList("SubCategoryDetails", { catCode: String(category) }, "subCategoryList", (s) => ({ code: String(s.subCateCode), name: s.subCateName, on: s.activestatus })),
    [category]);

  const active = (state) => ({ ...state, list: state.list.filter((o) => !o.on || o.on === "Y") });

  const [applied, setApplied] = useState(null); // the four choices used for the table: { codes, labels }
  const [district, setDistrict] = useState(null); // { code, name } once a district is opened
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameOf = (state, code) => (code === ALL ? "All" : state.list.find((o) => o.code === code)?.name || code);

  // Loads when Submit is clicked, and when a district is opened or closed
  useEffect(() => {
    if (!applied) return undefined;
    let stale = false;
    setLoading(true);
    setError("");
    setRows([]);
    post(REPORT_METHOD, {
      complaintCode: applied.codes.type,
      complaintSourceCode: applied.codes.source,
      categoryCode: applied.codes.category,
      subCategoryCode: applied.codes.subject,
      distCode: district ? String(district.code) : ALL,
      valNull: "",
      mandalCode: ALL,
      dispCode: "0",
    })
      .then((d) => {
        if (stale) return;
        if (!okCode(d)) {
          const hint = String(d.respCode) === "-105" ? " Choose a specific Complianee Type and try again." : "";
          throw new Error(`${message(d)}${hint}`);
        }
        setRows(
          (d.detailsList1 || []).map((r) => ({
            key: `${r.distCode}-${r.officeCode || ""}`,
            distCode: r.distCode,
            distName: r.distName,
            officeCode: r.officeCode,
            officeName: r.officeName,
            total: num(r.total),
            pending: num(r.pending),
            disposal: num(r.approved),
            rejected: num(r.rejected),
          }))
        );
      })
      .catch((e) => !stale && setError(e.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [applied, district]);

  const submit = (e) => {
    e.preventDefault();
    setDistrict(null);
    setApplied({
      codes: { type, source, category, subject },
      labels: {
        source: nameOf(sources, source),
        type: nameOf(types, type),
        category: nameOf(categories, category),
        subject: subject === ALL ? "All" : nameOf(subjects, subject),
      },
    });
  };

  const sum = (k) => rows.reduce((n, r) => n + r[k], 0);

  return (
    <Layout admin>
      <div className="igrms-card no-print">
        <div className="card-title">Grievance Masters</div>
        <form onSubmit={submit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "12px 24px", alignItems: "end", padding: "14px 20px" }}>
            <Select label="Complaint Source" value={source} onChange={setSource} state={active(sources)} />
            <Select label="Complianee Type" value={type} onChange={(v) => { setType(v); setCategory(ALL); setSubject(ALL); }} state={active(types)} />
            <span />
            <Select label="Grievance Type" value={category} onChange={(v) => { setCategory(v); setSubject(ALL); }} state={active(categories)} />
            <Select label="Grievance Subject" value={subject} onChange={setSubject} state={active(subjects)} disabled={category === ALL} />
            <button type="submit" style={{ ...btn, background: "#337ab7" }} disabled={loading}>Submit</button>
          </div>
          {[sources, types, categories, subjects].map((s, i) => s.error && (
            <div key={i} className="banner fail">{s.error}</div>
          ))}
        </form>
      </div>

      {applied && (
        <>
          <div className="no-print" style={{ display: "flex", justifyContent: "center", gap: 12, margin: "10px 0" }}>
            {district && (
              <button type="button" style={{ ...btn, background: "#337ab7" }} onClick={() => setDistrict(null)}>Back</button>
            )}
            <button type="button" style={{ ...btn, background: "#5cb85c" }} onClick={() => window.print()}>Print</button>
          </div>

          <div style={{ margin: "4px 24px 10px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <span style={blue}>Complaint Source : {applied.labels.source}</span>
            <span style={blue}>Complianee Type : {applied.labels.type}</span>
            <span style={blue}>Grievance Type : {applied.labels.category}</span>
            <span style={blue}>Grievance Subcategory Type : {applied.labels.subject}</span>
          </div>
          {district && (
            <div style={{ margin: "0 24px 6px", color: "#8a2be2", fontSize: 13 }}>District Name : {district.name}</div>
          )}

          {error && <div className="igrms-card"><div className="banner fail">{error}</div></div>}

          <div className="igrms-card">
            <div className="card-title">{district ? "Mandal wise Complaint Details" : "District wise Complaint Details"}</div>
            <div style={{ padding: "12px 14px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={th}>{district ? "Mandal Name" : "District Name"}</th>
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
                  {!loading && !error && rows.length === 0 && (
                    <tr><td style={td} colSpan={5}>No records found</td></tr>
                  )}
                  {rows.map((r, i) => (
                    <tr key={r.key} style={{ background: i % 2 ? "#d9d9d9" : "#fff" }}>
                      <td style={td}>
                        {district ? (
                          r.officeName || "(mandal name not given)"
                        ) : (
                          <button type="button" style={link} onClick={() => setDistrict({ code: r.distCode, name: r.distName })}>
                            {r.distName}
                          </button>
                        )}
                      </td>
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
        </>
      )}
    </Layout>
  );
}
