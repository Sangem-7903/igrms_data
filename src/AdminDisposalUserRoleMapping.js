// src/AdminDisposalUserRoleMapping.js
import { useEffect, useRef, useState } from "react";
import { Layout } from "./App";

const EPDS_BASE = "/GrievanceServices/epds"; // same proxy path App.js uses

// All five are documented in the Disposal_UserRole_Mapping Master Page section of MASTERS.docx (POST, JSON)
const ROLES_METHOD = "UserRoleDetails"; // {} -> { userRoleList: [{ roleId, role }] }
const DISPOSAL_TYPES_METHOD = "DisposalType"; // {} -> { dispTypeList: [{ dispTypeCode, dispTypeName, dispLangname, dispstatus }] }
const GET_MAPPING_METHOD = "GetDisposalMappingDetails"; // { userRoleId } -> { disposalStatusList: [{ disposalTypeCode, activeStatus }] }
const DELETE_MAPPING_METHOD = "DeleteDisposalMappingDetails"; // { userRoleId }
const INSERT_MAPPING_METHOD = "InsertDisposalMappingDetails"; // one call per disposal type

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

export default function AdminDisposalUserRoleMapping() {
  const [roles, setRoles] = useState([]);
  const [disposalTypes, setDisposalTypes] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedDisposals, setSelectedDisposals] = useState({}); // { [dispTypeCode]: true }
  const [loading, setLoading] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const latestRole = useRef(""); // ignores a slow answer for a role the user has already moved away from

  // Load User Roles and Disposal Types once on page open
  useEffect(() => {
    (async () => {
      try {
        const [rolesRes, dispRes] = await Promise.all([post(ROLES_METHOD, {}), post(DISPOSAL_TYPES_METHOD, {})]);
        mustSucceed(rolesRes, "User roles", true);
        mustSucceed(dispRes, "Disposal types", true);
        setRoles(rolesRes.userRoleList || []);
        setDisposalTypes(dispRes.dispTypeList || []);
      } catch (e) {
        setMsg({ ok: false, text: `Could not load master data: ${e.message}` });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Loads the disposal types already mapped to a role and ticks them
  const loadMapping = async (roleId) => {
    setLoadingMapping(true);
    try {
      const data = mustSucceed(await post(GET_MAPPING_METHOD, { userRoleId: Number(roleId) }), "Saved mapping", true);
      if (latestRole.current !== roleId) return; // the user picked another role meanwhile
      const mapped = {};
      (data.disposalStatusList || []).forEach((item) => {
        if (item.activeStatus === "Y") mapped[item.disposalTypeCode] = true;
      });
      setSelectedDisposals(mapped);
    } catch (e) {
      if (latestRole.current === roleId) setMsg({ ok: false, text: `Could not load the saved mapping: ${e.message}` });
    } finally {
      if (latestRole.current === roleId) setLoadingMapping(false);
    }
  };

  const handleRoleChange = (roleId) => {
    latestRole.current = roleId;
    setSelectedRole(roleId);
    setSelectedDisposals({});
    setMsg(null);
    if (roleId) loadMapping(roleId);
    else setLoadingMapping(false);
  };

  const toggle = (code) => setSelectedDisposals((prev) => ({ ...prev, [code]: !prev[code] }));

  const allChecked = disposalTypes.length > 0 && disposalTypes.every((d) => selectedDisposals[d.dispTypeCode]);
  const toggleAll = () => {
    const next = {};
    if (!allChecked) disposalTypes.forEach((d) => (next[d.dispTypeCode] = true));
    setSelectedDisposals(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!selectedRole) {
      setMsg({ ok: false, text: "Please select a User Role" });
      return;
    }

    const codes = disposalTypes.map((d) => d.dispTypeCode).filter((c) => selectedDisposals[c]);

    setSubmitting(true);
    try {
      // 1. Remove the role's existing mappings (same delete-then-insert pattern as the other mapping pages)
      mustSucceed(await post(DELETE_MAPPING_METHOD, { userRoleId: Number(selectedRole) }), "Delete", true);

      // 2. Insert every ticked disposal type. Each answer is checked, so one failure is not reported as success.
      for (const code of codes) {
        const res = await post(INSERT_MAPPING_METHOD, {
          userRoleId: String(selectedRole),
          disposalTypeCode: String(code),
          activeStatus: "Y",
          userName: API_USERNAME,
          publicIP: CLIENT_PUBLIC_IP,
          serverIP: CLIENT_SERVER_IP,
          stateCode: String(STATE_CODE),
        });
        mustSucceed(res, `Disposal type ${code}`);
      }

      await loadMapping(selectedRole); // show what the server really holds now
      setMsg({
        ok: true,
        text: codes.length ? "Disposal mapping updated successfully." : "All disposal mappings removed for this role.",
      });
    } catch (err) {
      await loadMapping(selectedRole);
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
        <div className="card-title">User Role and Disposal Masters Mapping</div>
        {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* User Role selection */}
          <div style={{ padding: "16px 20px 10px", display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
            <label className="field-label" style={{ margin: 0 }}>
              User Role<span className="req">*</span>
            </label>
            <select
              style={{ width: 340, height: 38 }}
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={loading || submitting}
            >
              <option value="">{loading ? "Loading…" : "Select"}</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {r.roleId} - {r.role}
                </option>
              ))}
            </select>
          </div>

          {/* Disposal Details box, like the department page */}
          <div style={{ margin: "10px 20px 16px", border: "1px solid #4a7a3b" }}>
            <div style={{ background: "#5f8a4d", color: "#fff", fontWeight: 700, padding: "9px 16px" }}>
              Disposal Details {loadingMapping && <span style={{ fontWeight: 400 }}> (loading saved mapping…)</span>}
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
                        disabled={!selectedRole || loadingMapping}
                        title="Select all"
                      />
                    </th>
                    <th>Disposal Type ID</th>
                    <th>Disposal Type Name (English)</th>
                    <th>Disposal Type Name (Local)</th>
                    <th>Disposal Type Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 15 }}>Loading…</td>
                    </tr>
                  )}
                  {!loading && disposalTypes.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 15 }}>No disposal types found</td>
                    </tr>
                  )}
                  {disposalTypes.map((d) => (
                    <tr key={d.dispTypeCode}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!selectedDisposals[d.dispTypeCode]}
                          onChange={() => toggle(d.dispTypeCode)}
                          disabled={!selectedRole || loadingMapping}
                        />
                      </td>
                      <td>{d.dispTypeCode}</td>
                      <td>{d.dispTypeName}</td>
                      <td>{d.dispLangname}</td>
                      <td>{d.dispstatus}</td>
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
