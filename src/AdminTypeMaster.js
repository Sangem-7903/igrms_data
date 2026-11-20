// src/AdminTypeMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js already uses
// Both methods are documented in the ComplianeeTypeMaster Page section of MASTERS.docx (POST, JSON)
const LIST_METHOD = "getAllCompliantTypeResp"; // body {} -> { compTypeList: [...] }, includes inactive types
const SAVE_METHOD = "InsertCompalinttypeDetails"; // spelling as in the document
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

const yn = (v) => v === true || String(v).toUpperCase() === "Y";
const fromApi = (x) => ({
  id: Number(x.compTypeCode),
  nameEn: x.compTypeName || "",
  nameLocal: x.compliantlangname || "",
  rationCardHolder: yn(x.rcholdermandatory),
  fpShopNo: yn(x.fpmandatory),
  active: yn(x.activestatus),
});
// Request body exactly as in the document: all values are strings
const toApi = (r) => ({
  compTypeCode: String(r.id),
  compTypeName: r.nameEn,
  compliantlangname: r.nameLocal,
  fpmandatory: r.fpShopNo ? "Y" : "N",
  rcholdermandatory: r.rationCardHolder ? "Y" : "N",
  activestatus: r.active ? "Y" : "N",
  statecode: String(STATE_CODE),
  username: API_USERNAME,
  publicIp: CLIENT_PUBLIC_IP,
  serverIp: CLIENT_SERVER_IP,
});

const EMPTY = { id: "", nameEn: "", nameLocal: "", rationCardHolder: true, fpShopNo: true, active: true };

export default function AdminTypeMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null); // { ok, text }

  const load = async () => {
    setLoading(true);
    try {
      const data = await post(LIST_METHOD);
      const code = String(data.respCode);
      if (code !== "0" && code !== "-104") throw new Error(data.respMessage || "Could not load list");
      setRows((data.compTypeList || []).map(fromApi));
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Loads once, right after the admin lands on this page following login
  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nameLocal.trim()) return setMsg({ ok: false, text: "Complianee Type Name (Local) is required" });
    if (!form.nameEn.trim()) return setMsg({ ok: false, text: "Complianee Type Name (English) is required" });

    const isEdit = form.id !== "";
    const record = { ...form, id: isEdit ? form.id : Math.max(0, ...rows.map((r) => r.id)) + 1 };
    try {
      const data = await post(SAVE_METHOD, toApi(record));
      if (String(data.respCode) !== "0") throw new Error(`${data.respMessage || data.statusResp || "no message"} (respCode ${data.respCode ?? "none"})`);
      setMsg({ ok: true, text: data.respMessage || "Saved successfully" });
      setForm(EMPTY);
      load(); // reload from the server so the table shows what was really saved
    } catch (err) {
      setMsg({ ok: false, text: `Not saved: ${err.message}` });
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Complianee Type</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={submit} noValidate>
          {/* two columns side by side, like the department page */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px", padding: "14px 20px" }}>
            <div className="field">
              <label className="field-label">Complianee Type ID</label>
              <div className="field-control">
                <input value={form.id} readOnly placeholder="Complianee Type ID" />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Complianee Type Name (English)<span className="req">*</span></label>
              <div className="field-control">
                <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Complianee Type Name (English)" />
              </div>
            </div>
            <div className="field">
              <label className="field-label">Complianee Type Name (Local)<span className="req">*</span></label>
              <div className="field-control">
                <input value={form.nameLocal} onChange={(e) => set("nameLocal", e.target.value)} placeholder="Complianee Type Name (Local)" />
              </div>
            </div>
            <div className="field">
              <label className="field-label">FP Shop No</label>
              <div className="field-control">
                <label><input type="checkbox" checked={form.fpShopNo} onChange={(e) => set("fpShopNo", e.target.checked)} /> Y</label>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Ration Card Holder</label>
              <div className="field-control">
                <label><input type="checkbox" checked={form.rationCardHolder} onChange={(e) => set("rationCardHolder", e.target.checked)} /> Y</label>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Active Status</label>
              <div className="field-control">
                <label><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Y</label>
              </div>
            </div>
          </div>
          <div className="actions">
            <button type="submit" className="btn-submit">Submit</button>
            <button type="button" className="btn-reset" onClick={() => { setForm(EMPTY); setMsg(null); }}>Reset</button>
          </div>
        </form>
      </div>

      <div className="igrms-card">
        <div className="card-title">Complianee Type Details</div>
        <div className="status-scroll" style={{ maxHeight: 280, overflowY: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Complianee Type ID</th>
                <th>Complianee Type Name (English)</th>
                <th>Complianee Type Name (Local)</th>
                <th>Ration Card Holder</th>
                <th>FP Shop No</th>
                <th>Active Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7}>No records found</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.nameEn}</td>
                  <td>{r.nameLocal}</td>
                  <td>{r.rationCardHolder ? "Y" : "N"}</td>
                  <td>{r.fpShopNo ? "Y" : "N"}</td>
                  <td>{r.active ? "Y" : "N"}</td>
                  <td>
                    <button type="button" className="btn-submit" onClick={() => { setForm(r); setMsg(null); }}>
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
