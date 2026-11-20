// src/ComplianeeTypeMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js already uses
const LIST_METHOD = "getAllCompliantTypeResp"; // Documented method for getting list
const SAVE_METHOD = "InsertCompalinttypeDetails"; // Documented method for saving/updating

const STATE_CODE = 36;
const API_USERNAME = "admin_pmu";
const CLIENT_PUBLIC_IP = "192.168.1.100"; // Matching documentation sample
const CLIENT_SERVER_IP = "192.168.1.10";


async function post(endpoint, body = {}) {
  const url = `${EPDS_BASE}/${endpoint}`;

  console.log("API URL:", url);
  console.log("API request body:", body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!res.ok) {
    const details =
      data?.respMessage ||
      data?.respMsg ||
      data?.message ||
      text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

    throw new Error(
      `HTTP ${res.status} - ${url}` +
      (details ? ` - ${details.slice(0, 400)}` : "")
    );
  }

  if (data === null) {
    throw new Error(
      `Invalid JSON response from ${url}: ${text.slice(0, 300)}`
    );
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

const toApi = (r) => ({
  compTypeCode: String(r.id || 0),
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

export default function ComplianeeTypeMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState(null); // { ok, text }

  const load = async () => {
    setLoading(true);
    try {
      const data = await post(LIST_METHOD, {});
      const code = String(data.respCode);
      if (code !== "0" && code !== "-104") throw new Error(data.respMessage || "Could not load list");
      setRows((data.compTypeList || []).map(fromApi));
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!form.nameEn.trim()) return setMsg({ ok: false, text: "Complianee Type Name (English) is required" });
    if (!form.nameLocal.trim()) return setMsg({ ok: false, text: "Complianee Type Name (Local) is required" });

    const isEdit = form.id !== "";
    const record = { ...form, id: isEdit ? form.id : Math.max(0, ...rows.map((r) => r.id)) + 1 };
    
    try {
      const data = await post(SAVE_METHOD, toApi(record));
      console.log("Save request:", toApi(record), "Save response:", data);

      const code = String(data.respCode ?? "");
      const statusResp = data.statusResp || data.respMsg || data.respMessage || "";
      const isSuccess = code === "0" || /success|inserted|updated/i.test(statusResp);

      if (!isSuccess) {
        const why = statusResp || "no message";
        throw new Error(`${why} (respCode ${data.respCode ?? "none"})`);
      }

      setMsg({ ok: true, text: statusResp || "Saved successfully" });
      setForm(EMPTY);
      load(); // reload from server
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