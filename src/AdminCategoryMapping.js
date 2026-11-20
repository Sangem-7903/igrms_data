// src/AdminCategoryMapping.js
import { useEffect, useRef, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// All documented in MASTERS.docx (Complianee_Category_Mapping page) and GrievanceComplaintEntryForm_API.docx (POST, JSON)
const TYPES_METHOD = "ComplianeeType"; // {} -> { compTypeList: [{ compTypeCode, compTypeName, activestatus }] }
const CATEGORIES_METHOD = "CatDetails"; // {} -> { categoryList: [{ categorycode, categoryengname, activeStatus }] }
const GET_MAPPING_METHOD = "GetMappingDetails"; // { complianeeTypeCode } -> { getMappedDetailsList: [{ categoryCode, catName, activeStatus }] }
const DELETE_MAPPING_METHOD = "DeleteMappingDetails"; // { complianeeTypeCode }
const INSERT_MAPPING_METHOD = "InsertMappingDetails"; // one call per category

const STATE_CODE = 36;
const API_USERNAME = "admin_pmu";
const CLIENT_PUBLIC_IP = "10.160.19.152"; // same values as App.js
const CLIENT_SERVER_IP = "10.212.134.83";

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
    throw new Error(`Server error (${res.status})${snippet ? `: ${snippet}` : ""}`);
  }
  return data;
}

// These APIs answer with respMsg in some places and respMessage in others
const message = (d) => d.respMsg || d.respMessage || d.statusResp || "no message";

// Throws unless the server says respCode "0" (or "-104" = no data, when allowed)
const mustSucceed = (data, what, allowNoData = false) => {
  const code = String(data.respCode);
  if (code === "0" || (allowNoData && code === "-104")) return data;
  throw new Error(`${what}: ${message(data)} (respCode ${data.respCode ?? "none"})`);
};

export default function AdminCategoryMapping() {
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selected, setSelected] = useState({}); // { [categoryCode]: true }
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const latestType = useRef(""); // ignores a slow answer for a type the user has already moved away from

  // Load Complainee Types and Grievance Categories once on page open
  useEffect(() => {
    (async () => {
      try {
        const [typeRes, catRes] = await Promise.all([post(TYPES_METHOD, {}), post(CATEGORIES_METHOD, {})]);
        mustSucceed(typeRes, "Complainee types", true);
        mustSucceed(catRes, "Grievance types", true);
        setTypes(typeRes.compTypeList || []);
        setCategories(catRes.categoryList || []);
      } catch (e) {
        setMsg({ ok: false, text: `Could not load master data: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Loads the categories already mapped to a complainee type and ticks them
  const loadMapping = async (typeCode) => {
    setLoadingMapping(true);
    try {
      const data = mustSucceed(await post(GET_MAPPING_METHOD, { complianeeTypeCode: String(typeCode) }), "Saved mapping", true);
      if (latestType.current !== typeCode) return; // the user picked another type meanwhile
      const mapped = {};
      (data.getMappedDetailsList || []).forEach((item) => {
        if (item.activeStatus === "Y") mapped[item.categoryCode] = true;
      });
      setSelected(mapped);
    } catch (e) {
      if (latestType.current === typeCode) setMsg({ ok: false, text: `Could not load the saved mapping: ${e.message}` });
    } finally {
      if (latestType.current === typeCode) setLoadingMapping(false);
    }
  };

  const handleTypeChange = (typeCode) => {
    latestType.current = typeCode;
    setSelectedType(typeCode);
    setSelected({});
    setMsg(null);
    if (typeCode) loadMapping(typeCode);
    else setLoadingMapping(false);
  };

  const toggle = (code) => setSelected((prev) => ({ ...prev, [code]: !prev[code] }));

  const allChecked = categories.length > 0 && categories.every((c) => selected[c.categorycode]);
  const toggleAll = () => {
    const next = {};
    if (!allChecked) categories.forEach((c) => (next[c.categorycode] = true));
    setSelected(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!selectedType) {
      setMsg({ ok: false, text: "Please select a Complainee Type" });
      return;
    }

    const codes = categories.map((c) => c.categorycode).filter((c) => selected[c]);

    setSubmitting(true);
    try {
      // 1. Remove the type's existing mappings (the document: delete first, then insert each selected category)
      mustSucceed(await post(DELETE_MAPPING_METHOD, { complianeeTypeCode: String(selectedType) }), "Delete", true);

      // 2. Insert every ticked category. Each answer is checked, so one failure is not reported as success.
      for (const code of codes) {
        const res = await post(INSERT_MAPPING_METHOD, {
          complianeeTypeCode: String(selectedType),
          categoryCode: String(code),
          stateCode: String(STATE_CODE),
          activeStatus: "Y",
          userName: API_USERNAME,
          ClientPublicIP: CLIENT_PUBLIC_IP, // spelling exactly as in the document
          clientServerIP: CLIENT_SERVER_IP,
        });
        mustSucceed(res, `Grievance type ${code}`);
      }

      await loadMapping(selectedType); // show what the server really holds now
      setMsg({
        ok: true,
        text: codes.length ? "Mapping updated successfully." : "All mappings removed for this complainee type.",
      });
    } catch (err) {
      await loadMapping(selectedType);
      setMsg({
        ok: false,
        text: `Failed to save mapping: ${err.message}. The existing mappings may already have been removed; the ticks now show what is saved.`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Complianee Type and Grievance Type Masters Mapping</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Complainee Type selection */}
          <div style={{ padding: "16px 20px 10px", display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
            <label className="field-label" style={{ margin: 0 }}>
              Complianee Type<span className="req">*</span>
            </label>
            <select
              style={{ width: 340, height: 38 }}
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value)}
              disabled={loading || submitting}
            >
              <option value="">{loading ? "Loading…" : "Select"}</option>
              {types
                .filter((t) => !t.activestatus || t.activestatus === "Y" || String(t.compTypeCode) === selectedType)
                .map((t) => (
                  <option key={t.compTypeCode} value={t.compTypeCode}>
                    {t.compTypeName}
                  </option>
                ))}
            </select>
          </div>

          {/* Grievance Category Details box, like the department page */}
          <div style={{ margin: "10px 20px 16px", border: "1px solid #4a7a3b" }}>
            <div style={{ background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "9px 16px" }}>
              Grievance Category Details {loadingMapping && <span style={{ fontWeight: 400 }}> (loading saved mapping…)</span>}
            </div>
            <div className="status-scroll" style={{ maxHeight: 300, overflowY: "auto" }}>
              <table className="history-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ width: 50, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        disabled={!selectedType || loadingMapping}
                        title="Select all"
                      />
                    </th>
                    <th>Grievance Type ID</th>
                    <th>Grievance Type Name (English)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: 15 }}>Loading…</td>
                    </tr>
                  )}
                  {!loading && categories.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: 15 }}>No grievance types found</td>
                    </tr>
                  )}
                  {categories.map((c) => (
                    <tr key={c.categorycode}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!selected[c.categorycode]}
                          onChange={() => toggle(c.categorycode)}
                          disabled={!selectedType || loadingMapping}
                        />
                      </td>
                      <td>{c.categorycode}</td>
                      <td>{c.categoryengname}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="actions" style={{ textAlign: "center", paddingBottom: 16 }}>
            <button type="submit" className="btn-submit" disabled={submitting || loadingMapping}>
              {submitting ? "Saving…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
