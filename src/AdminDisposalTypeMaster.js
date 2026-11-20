// src/AdminDisposalTypeMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// Both documented in the DisposalTypeMaster Page section of MASTERS.docx (POST, JSON)
const LIST_METHOD = "GetAllDisposalType"; // {} -> { dispTypeList: [{ dispTypeCode, dispTypeName, dispLangname, dispstatus, activestatus, statecode }] }
const SAVE_METHOD = "InsertDisptypeDetails"; // spelling as in the document

const STATE_CODE = 36;
const API_USERNAME = "admin_pmu";
const CLIENT_PUBLIC_IP = "10.160.19.152"; // same values as App.js
const CLIENT_SERVER_IP = "10.212.134.83";

// The list returns "Open" / "Close"; the insert sample sends a one-letter code ("C").
// "O" for Open is assumed from that sample: confirm with the backend team.
const STATUS_OPTIONS = [
  { code: "O", label: "Open" },
  { code: "C", label: "Close" },
];
// The documents never say which spelling the server accepts for dispstatus ("C" is the only sample).
// If the server answers -107 "Invalid Disposal Status", the page retries with the next spelling.
const STATUS_SPELLINGS = { O: ["O", "Open", "OPEN"], C: ["C", "Close", "CLOSE"] };
const statusCode = (label) => STATUS_OPTIONS.find((s) => s.label.toLowerCase() === String(label).toLowerCase())?.code ?? "";

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

const yn = (v) => v === true || String(v).toUpperCase() === "Y";

const EMPTY = { id: "", nameEn: "", nameLocal: "", status: "", active: true };

// Defined outside the page component so inputs keep focus while typing
const Field = ({ label, required, error, children }) => (
  <div className={`field ${error ? "has-error" : ""}`}>
    <label className="field-label">
      {label}
      {required && <span className="req">*</span>}
    </label>
    <div className="field-control">
      {children}
      {error && <span className="error-text">{error}</span>}
    </div>
  </div>
);

export default function AdminDisposalTypeMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { ok, text }

  // Loads once on page open (the list includes inactive disposal types)
  const load = async () => {
    setLoading(true);
    try {
      const data = await post(LIST_METHOD);
      const code = String(data.respCode);
      // this list answers without a respCode; only a code other than 0 / -104 is an error
      if (data.respCode !== undefined && code !== "0" && code !== "-104")
        throw new Error(data.respMessage || data.respMsg || "Could not load list");
      setRows(
        (data.dispTypeList || []).map((d) => ({
          id: Number(d.dispTypeCode),
          nameEn: d.dispTypeName || "",
          nameLocal: d.dispLangname || "",
          statusLabel: d.dispstatus || "",
          active: yn(d.activestatus),
        }))
      );
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const e = {};
    if (!form.nameEn.trim()) e.nameEn = "Enter disposal type name (English)";
    if (!form.nameLocal.trim()) e.nameLocal = "Enter disposal type name (Local)";
    if (!form.status) e.status = "Select disposal type status";
    setErrors(e);
    if (Object.keys(e).length) return;

    const isEdit = form.id !== "";
    const newCode = Math.max(0, ...rows.map((r) => r.id)) + 1; // next free code for a new record
    // Request body exactly as in the document: all values are strings
    const payload = {
      dispTypeCode: String(isEdit ? form.id : newCode),
      dispTypeName: form.nameEn.trim(),
      dispLangname: form.nameLocal.trim(),
      dispstatus: form.status,
      activestatus: form.active ? "Y" : "N",
      statecode: String(STATE_CODE),
      username: API_USERNAME,
      clientip: CLIENT_PUBLIC_IP,
      serverip: CLIENT_SERVER_IP,
    };

    try {
      let data = null;
      let used = payload.dispstatus;
      for (const spelling of STATUS_SPELLINGS[form.status] || [form.status]) {
        used = spelling;
        data = await post(SAVE_METHOD, { ...payload, dispstatus: spelling });
        console.log("Save request:", { ...payload, dispstatus: spelling }, "Save response:", data); // F12 > Console
        if (String(data.respCode) !== "-107") break; // -107 = this spelling of the status was rejected: try the next
      }
      if (String(data.respCode) !== "0") {
        const why = data.respMessage || data.respMsg || data.statusResp || "no message";
        const note = String(data.respCode) === "-107" ? "; every spelling of the status was rejected" : "";
        throw new Error(`${why} (respCode ${data.respCode ?? "none"}${note})`);
      }
      setMsg({
        ok: true,
        text: `${data.statusResp || data.respMessage || "Saved successfully"} (status sent as "${used}")`,
      });
      setForm(EMPTY);
      load(); // reload so the table shows what the server really saved
    } catch (err) {
      setMsg({ ok: false, text: `Not saved: ${err.message}` });
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Disposal Type</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={submit} noValidate>
          {/* two columns side by side, like the department page */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px", padding: "14px 20px" }}>
            <Field label="Disposal Type ID">
              <input value={form.id} readOnly placeholder="Disposal Type ID" />
            </Field>

            <Field label="Disposal Type Name (English)" required error={errors.nameEn}>
              <input
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                placeholder="Disposal Type Name (English)"
              />
            </Field>

            <Field label="Disposal Type Name (Local)" required error={errors.nameLocal}>
              <input
                value={form.nameLocal}
                onChange={(e) => set("nameLocal", e.target.value)}
                placeholder="Disposal Type Name (Local)"
              />
            </Field>

            <Field label="Disposal Type Status" required error={errors.status}>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="">Select</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Active Status">
              <label>
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Y
              </label>
            </Field>
          </div>

          <div className="actions">
            <button type="submit" className="btn-submit">Submit</button>
            <button type="button" className="btn-reset" onClick={() => { setForm(EMPTY); setErrors({}); setMsg(null); }}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="igrms-card">
        <div className="card-title">Disposal Type Details</div>
        <div className="status-scroll" style={{ maxHeight: 280, overflowY: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Disposal Type ID</th>
                <th>Disposal Type Name (English)</th>
                <th>Disposal Type Name (Local)</th>
                <th>Disposal Type Status</th>
                <th>Active Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6}>No records found</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.nameEn}</td>
                  <td>{r.nameLocal}</td>
                  <td>{r.statusLabel}</td>
                  <td>{r.active ? "Y" : "N"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => {
                        setForm({
                          id: r.id,
                          nameEn: r.nameEn,
                          nameLocal: r.nameLocal,
                          status: statusCode(r.statusLabel),
                          active: r.active,
                        });
                        setErrors({});
                        setMsg(null);
                      }}
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
    </Layout>
  );
}
