// src/AdminComplaintSourceMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds";

const LIST_METHOD = "ComplaintSource";
const SAVE_METHOD = "InsertComplaintSource";

const STATE_CODE = 36;
const API_USERNAME = "admin_pmu";
const CLIENT_IP = "192.168.1.100";
const SERVER_IP = "192.168.1.10";

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
    throw new Error(`Server error (${res.status})${snippet ? `: ${snippet}` : ""}`);
  }
  return data;
}

const yn = (v) => v === true || String(v).toUpperCase() === "Y";

const EMPTY = { code: "", nameEn: "", nameLocal: "", active: true };

// Robust extraction of the result list supporting various backend property names
const toResultRows = (data) => {
  const list = data.complaintList || data.searchList || data.resultList || Object.values(data).find(Array.isArray) || [];
  return list.map((r, i) => {
    const complaintNumber = String(
      r.complaintNO ?? r.complaintNo ?? r.complaintId ?? r.grievanceComplaintID ?? r.complaintNumber ?? ""
    );
    return {
      key: `${complaintNumber}-${i}`,
      no: complaintNumber,
      name: r.name ?? r.complainantName ?? r.complainant_name ?? "",
      address: r.address ?? r.complainantAddress ?? "",
      category: r.categoryEngName ?? r.catName ?? r.categoryName ?? "",
      subCategory: r.subCategoryEngName ?? r.subCatName ?? r.subCategoryName ?? "",
    };
  });
};
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

export default function AdminComplaintSourceMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await post(LIST_METHOD, {});
      const code = String(data.respCode);
      if (code === "0") {
        const list = data.compSourceList || [];
        setRows(
          list.map((s) => ({
            code: String(s.compSourceCode),
            nameEn: s.compSourceName || "",
            nameLocal: s.compSourceLangName || "",
            active: yn(s.activeStatus),
          }))
        );
      } else if (code !== "-104") {
        throw new Error(data.respMessage || data.respMsg || "Could not load list");
      }
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

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = "Enter Complaint Source Code";
    if (!form.nameEn.trim()) e.nameEn = "Enter Complaint Source Name (English)";
    if (!form.nameLocal.trim()) e.nameLocal = "Enter Complaint Source Name (Local)";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const payload = {
      compSourceCode: form.code.trim(),
      statecode: String(STATE_CODE),
      compsourcename: form.nameEn.trim(),
      complangname: form.nameLocal.trim(),
      activestatus: form.active ? "Y" : "N",
      username: API_USERNAME,
      clientip: CLIENT_IP,
      serverip: SERVER_IP,
    };

    try {
      const data = await post(SAVE_METHOD, payload);
      console.log("Save request:", payload, "Save response:", data);

      const code = String(data.respCode ?? "");
      const statusResp = data.statusResp || data.respMsg || data.respMessage || "";
      const isSuccess = code === "0" || /success|inserted|updated/i.test(statusResp);

      if (!isSuccess) {
        const why = statusResp || "no message";
        throw new Error(`${why} (respCode ${data.respCode ?? "none"})`);
      }

      setMsg({ ok: true, text: statusResp || "Saved successfully" });
      setForm(EMPTY);
      load();
    } catch (err) {
      setMsg({ ok: false, text: `Not saved: ${err.message}` });
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Complaint Source Master</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={submit} noValidate>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 30px", padding: "14px 20px" }}>
            <Field label="Complaint Source Code" required error={errors.code}>
              <input value={form.code} onChange={(e) => set("code", e.target.value)} placeholder="Code" />
            </Field>

            <Field label="Complaint Source Name (English)" required error={errors.nameEn}>
              <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="English Name" />
            </Field>

            <Field label="Complaint Source Name (Local)" required error={errors.nameLocal}>
              <input value={form.nameLocal} onChange={(e) => set("nameLocal", e.target.value)} placeholder="Local Name" />
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
        <div className="card-title">Complaint Source Details</div>
        <div className="status-scroll" style={{ maxHeight: 340, overflowY: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Complaint Source Code</th>
                <th>Complaint Source Name (English)</th>
                <th>Complaint Source Name (Local)</th>
                <th>Active Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={5}>Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={5}>No records found</td></tr>}
              {rows.map((r) => (
                <tr key={r.code}>
                  <td>{r.code}</td>
                  <td>{r.nameEn}</td>
                  <td>{r.nameLocal}</td>
                  <td>{r.active ? "Y" : "N"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => {
                        setForm({
                          code: r.code,
                          nameEn: r.nameEn,
                          nameLocal: r.nameLocal,
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