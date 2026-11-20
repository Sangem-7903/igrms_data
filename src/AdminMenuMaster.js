// src/AdminMenuMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// Both documented in the MenuMaster Page section of MASTERS.docx (POST, JSON)
const LIST_METHOD = "getMenuMasterDetails"; // {} -> { menuMasterList: [{ menuId, parentPageId, childPageId, pageName, pageStateLanName, pageURL, activeStatus }] }
const SAVE_METHOD = "UpdateInsertMenuMasterDetails"; // same body shape, all values as strings; updates the row if menuId exists, else inserts

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
const message = (d) => d.respMsg || d.respMessage || d.statusResp || "no message";

const EMPTY = { menuId: "", parentPageId: "", childPageId: "0", nameEn: "", nameLocal: "", url: "", active: true };

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

export default function AdminMenuMaster() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false); // true after Select: the form changes an existing menu
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { ok, text }

  // Loads once on page open (the list includes inactive menus)
  const load = async () => {
    setLoading(true);
    try {
      const data = await post(LIST_METHOD);
      const code = String(data.respCode);
      if (code !== "0" && code !== "-104") throw new Error(message(data));
      setRows(
        (data.menuMasterList || []).map((m) => ({
          menuId: String(m.menuId),
          parentPageId: String(m.parentPageId),
          childPageId: String(m.childPageId),
          nameEn: m.pageName || "",
          nameLocal: m.pageStateLanName || "",
          url: m.pageURL || "",
          active: yn(m.activeStatus),
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

  const reset = () => {
    setForm(EMPTY);
    setEditing(false);
    setErrors({});
    setMsg(null);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const e = {};
    if (!/^\d+$/.test(form.menuId)) e.menuId = "Enter the menu ID (a number)";
    else if (!editing && rows.some((r) => r.menuId === form.menuId))
      e.menuId = "This menu ID already exists. Use Select on that row to change it.";
    if (form.parentPageId === "") e.parentPageId = "Select the parent page ID";
    if (!form.nameEn.trim()) e.nameEn = "Enter the page English name";
    setErrors(e);
    if (Object.keys(e).length) return;

    // Request body exactly as in the document: all values are strings
    const payload = {
      menuId: String(form.menuId),
      parentPageId: String(form.parentPageId),
      childPageId: String(form.childPageId || "0"),
      pageName: form.nameEn.trim(),
      pageStateLanName: form.nameLocal.trim(),
      pageURL: form.url.trim(),
      activeStatus: form.active ? "Y" : "N",
    };

    try {
      const data = await post(SAVE_METHOD, payload);
      console.log("Save request:", payload, "Save response:", data); // open F12 > Console to see both
      if (String(data.respCode) !== "0") throw new Error(`${message(data)} (respCode ${data.respCode ?? "none"})`);
      setMsg({ ok: true, text: data.respMsg || data.respMessage || "Saved successfully" });
      setForm(EMPTY);
      setEditing(false);
      load(); // reload so the table shows what the server really saved
    } catch (err) {
      setMsg({ ok: false, text: `Not saved: ${err.message}` });
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Menu Master</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={submit} noValidate>
          {/* two columns side by side, like the department page */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 40px", padding: "14px 20px" }}>
            <Field label="Menu ID" required error={errors.menuId}>
              <input
                value={form.menuId}
                onChange={(e) => set("menuId", e.target.value.replace(/\D/g, ""))}
                readOnly={editing}
                inputMode="numeric"
                placeholder="Menu ID"
              />
            </Field>

            <Field label="Parent Page ID" required error={errors.parentPageId}>
              <select value={form.parentPageId} onChange={(e) => set("parentPageId", e.target.value)} disabled={loading}>
                <option value="">{loading ? "Loading…" : "Select"}</option>
                <option value="0">0 - None (top level)</option>
                {rows
                  .filter((r) => r.menuId !== "0" && r.menuId !== form.menuId)
                  .map((r) => (
                    <option key={r.menuId} value={r.menuId}>
                      {r.menuId} - {r.nameEn}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Page English Name" required error={errors.nameEn}>
              <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Page English Name" />
            </Field>

            <Field label="Page State Language Name">
              <input value={form.nameLocal} onChange={(e) => set("nameLocal", e.target.value)} placeholder="Page State Language Name" />
            </Field>

            <Field label="Page Url">
              <input value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="e.g. ~/Masters/MenuMaster.aspx" />
            </Field>

            <Field label="Active Status">
              <label>
                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Y
              </label>
            </Field>
          </div>

          <div className="actions">
            <button type="submit" className="btn-submit">Submit</button>
            <button type="button" className="btn-reset" onClick={reset}>Reset</button>
          </div>
        </form>
      </div>

      <div className="igrms-card">
        <div className="card-title">Menu Details</div>
        <div className="status-scroll" style={{ maxHeight: 300, overflowY: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Menu ID</th>
                <th>Parent PageID</th>
                <th>Child Page ID</th>
                <th>Page Eng Name</th>
                <th>Page State Lang Name</th>
                <th>Page Url</th>
                <th>Active Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8}>Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8}>No records found</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.menuId}>
                  <td>{r.menuId}</td>
                  <td>{r.parentPageId}</td>
                  <td>{r.childPageId}</td>
                  <td>{r.nameEn}</td>
                  <td>{r.nameLocal}</td>
                  <td style={{ wordBreak: "break-all" }}>{r.url}</td>
                  <td>{r.active ? "Y" : "N"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => {
                        setForm({
                          menuId: r.menuId,
                          parentPageId: r.parentPageId,
                          childPageId: r.childPageId,
                          nameEn: r.nameEn,
                          nameLocal: r.nameLocal,
                          url: r.url,
                          active: r.active,
                        });
                        setEditing(true);
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
