// src/AdminSubjectMaster.js
import { useEffect, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// Documented methods (MASTERS.docx and GrievanceComplaintEntryForm_API.docx), all POST
const CATEGORY_METHOD = "CatDetails"; // { categoryList: [{ categorycode, categoryengname, categorylangname, activeStatus }] }
const SUBJECT_METHOD = "SubCategoryDetails"; // body { catCode } -> { subCategoryList: [...] }

// NOT in the API documents: replace with the real method name from the backend team.
const SAVE_METHOD = "InsertSubCategoryDetails";

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

// respCode "0" = ok, "-104" = no data
async function loadList(endpoint, body, key) {
  const data = await post(endpoint, body);
  const code = String(data.respCode);
  if (code === "0") return data[key] || [];
  if (code === "-104") return [];
  throw new Error(data.respMessage || data.respMsg || "Could not load list");
}

const yn = (v) => v === true || String(v).toUpperCase() === "Y";

const EMPTY = { id: "", catCode: "", nameEn: "", nameLocal: "", slaDays: "", userRole: "", active: true };

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

export default function AdminSubjectMaster() {
  const [categories, setCategories] = useState([]); // [{ code, name }]
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState(null); // { ok, text }

  // Loads once on page open: all categories, then the subjects of every category
  const load = async () => {
    setLoading(true);
    try {
      const cats = (await loadList(CATEGORY_METHOD, {}, "categoryList")).map((c) => ({
        code: String(c.categorycode),
        name: c.categoryengname,
        active: yn(c.activeStatus),
      }));
      setCategories(cats);

      const perCategory = await Promise.all(
        cats.map((c) =>
          loadList(SUBJECT_METHOD, { catCode: c.code }, "subCategoryList").then((list) =>
            list.map((s) => ({
              catCode: String(s.catcode ?? c.code),
              catName: c.name,
              id: Number(s.subCateCode),
              nameEn: s.subCateName || "",
              nameLocal: s.subcatstatelangname || "",
              slaDays: s.sladays,
              userRole: s.fwduserid,
              active: yn(s.activestatus),
            }))
          )
        )
      );
      setRows(perCategory.flat());
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // The documents have no User Role list API, so the dropdown offers the roles already used in the data.
  const roles = [...new Set(rows.map((r) => r.userRole).filter((v) => v !== null && v !== undefined))].sort(
    (a, b) => a - b
  );

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.catCode) e.catCode = "Select grievance type";
    if (!form.nameEn.trim()) e.nameEn = "Enter subject name (English)";
    if (!form.nameLocal.trim()) e.nameLocal = "Enter subject name (Local)";
    if (!/^\d+$/.test(String(form.slaDays)) || Number(form.slaDays) < 1) e.slaDays = "Enter SLA days";
    if (form.userRole === "") e.userRole = "Select user role";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    const isEdit = form.id !== "";

const payload = {
  catcode: Number(form.catCode),
  subCateCode: isEdit ? Number(form.id) : 0,
  subCateName: form.nameEn.trim(),
  subcatstatelangname: form.nameLocal.trim(),
  sladays: Number(form.slaDays),
  fwduserid: Number(form.userRole),
  activestatus: form.active ? "Y" : "N",
  statecode: STATE_CODE,
  username: API_USERNAME,
  clientpublicip: CLIENT_PUBLIC_IP, // Added required field
    clientserverip: CLIENT_SERVER_IP, //
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
      load(); // reload table
    } catch (err) {
      setMsg({ ok: false, text: `Not saved: ${err.message}` });
    }
  };

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Grievance Subject</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={submit} noValidate>
          {/* three columns side by side, like the department page */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 30px", padding: "14px 20px" }}>
            <Field label="Grievance Type" required error={errors.catCode}>
              <select value={form.catCode} onChange={(e) => set("catCode", e.target.value)} disabled={loading}>
                <option value="">{loading ? "Loading…" : "Select"}</option>
                {categories
                  .filter((c) => c.active || c.code === form.catCode)
                  .map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Subject Code">
              <input value={form.id} readOnly placeholder="Subject Code" />
            </Field>

            <Field label="Subject Name ( English )" required error={errors.nameEn}>
              <input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Subject Name ( English )" />
            </Field>

            <Field label="Subject Name (Local)" required error={errors.nameLocal}>
              <input value={form.nameLocal} onChange={(e) => set("nameLocal", e.target.value)} placeholder="Subject Name (Local)" />
            </Field>

            <Field label="SLA Days" required error={errors.slaDays}>
              <input
                value={form.slaDays}
                onChange={(e) => set("slaDays", e.target.value.replace(/\D/g, ""))}
                placeholder="SLA Days"
                inputMode="numeric"
                maxLength={3}
              />
            </Field>

            <Field label="User Role" required error={errors.userRole}>
              <select value={form.userRole} onChange={(e) => set("userRole", e.target.value)}>
                <option value="">Select</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
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
        <div className="card-title">Grievance Subject Details</div>
        <div className="status-scroll" style={{ maxHeight: 340, overflowY: "auto" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Category Name (English)</th>
                <th>Sub Category Code</th>
                <th>Sub Category English Name</th>
                <th>Sub Category State Name</th>
                <th>SLA Days</th>
                <th>User Role</th>
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
                <tr key={`${r.catCode}-${r.id}`}>
                  <td>{r.catName}</td>
                  <td>{r.id}</td>
                  <td>{r.nameEn}</td>
                  <td>{r.nameLocal}</td>
                  <td>{r.slaDays}</td>
                  <td>{r.userRole}</td>
                  <td>{r.active ? "Y" : "N"}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={() => {
                        setForm({
                          id: r.id,
                          catCode: r.catCode,
                          nameEn: r.nameEn,
                          nameLocal: r.nameLocal,
                          slaDays: String(r.slaDays ?? ""),
                          userRole: String(r.userRole ?? ""),
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
