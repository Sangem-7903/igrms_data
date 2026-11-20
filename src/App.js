// src/App.js

import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import "./GrievanceForm.css";
import "./home.css";

import {
  saveSubmission,
  findByMobile,
} from "./complaintStore";

import FeedbackForm from "./FeedbackForm";
import { RequireAdmin, DashboardPage } from "./Dashboard";

import AdminTypeMaster from "./AdminTypeMaster";
import AdminSubjectMaster from "./AdminSubjectMaster";
import AdminSourceMaster from "./AdminSourceMaster";
import AdminUserMapping from "./AdminUserMapping";
import AdminDisposalUserRoleMapping from "./AdminDisposalUserRoleMapping";
import AdminDisposalTypeMaster from "./AdminDisposalTypeMaster";
import AdminMenuMaster from "./AdminMenuMaster";
import AdminCategoryMapping from "./AdminCategoryMapping";

import AdminSlaReport from "./AdminSlaReport";
import AdminComplaineeWiseReport from "./AdminComplaineeWiseReport";
import AdminBtwDatesReport from "./AdminBtwDatesReport";
import AdminUserRoleReport from "./AdminUserRoleReport";
import AdminComplaintSearchPage from "./AdminComplaintSearchPage";
import AdminAllMastersReport from "./AdminAllMastersReport";
import AdminComplaintDetails from "./AdminComplaintDetails";
import RationCardMemberModal from "./RationCardMemberModal";

// -----------------------------------------------------------------------------
// LOGIN USERS
// -----------------------------------------------------------------------------

export const ADMIN_USER = "admin_pmu";

export const LOGIN_USERS = {
  admin_pmu: {
    password: "Admin@123",
    role: "PMU",
    roleId: "42",
    distCode: "All",
    officeCode: "All",
    dashboard: "/dashboard",
  },
  admin: {
    password: "Admin@123",
    role: "ADMIN",
    roleId: "32",
    distCode: "All",
    officeCode: "All",
    dashboard: "/dashboard",
  },
  admin_aso: {
    password: "Aso@123",
    role: "ASO",
    roleId: "35",
    distCode: "SESSION_DISTRICT",
    officeCode: "SESSION_MANDAL",
    dashboard: "/dashboard",
  },
  admin_insp: {
    password: "Insp@123",
    role: "INSPECTOR",
    roleId: "34",
    distCode: "SESSION_DISTRICT",
    officeCode: "SESSION_MANDAL",
    dashboard: "/dashboard",
  },
  admin_dso: {
    password: "Dso@123",
    role: "DSO",
    roleId: "4",
    distCode: "SESSION_DISTRICT",
    officeCode: "All",
    dashboard: "/dashboard",
  },
  admin_dgro: {
    password: "Dgro@123",
    role: "DGRO",
    roleId: "62",
    distCode: "SESSION_DISTRICT",
    officeCode: "All",
    dashboard: "/dashboard",
  },
};
//category-mapping
// -----------------------------------------------------------------------------
// SHARED HEADER AND FOOTER
// -----------------------------------------------------------------------------

const FOOTER_TEXT =
  "Disclaimer: Content on this website is published and managed by Commissioner of Civil Supplies, Hyderabad.";

const hideBroken = (e) => {
  e.target.style.display = "none";
};

const img = (name) => `${process.env.PUBLIC_URL}/${name}`;

// -----------------------------------------------------------------------------
// MASTERS MENU
// -----------------------------------------------------------------------------


const MASTER_PAGES = [
  { to: "/masters/complaint-source", label: "Complaint Source" },
  { to: "/masters/complainee-type", label: "Complainee Type" },
  { to: "/masters/subject", label: "Grievance Subject" },
  { to: "/masters/user-mapping", label: "User Roles Mapping" },
  { to: "/masters/disposal-type", label: "Disposal Type" },
  { to: "/masters/disposal-mapping", label: "Disposal Role Mapping" },
  { to: "/masters/menu", label: "Menu Master" },
  { to: "/masters/category-mapping", label: "Complainee Type Mapping" },
];

// -----------------------------------------------------------------------------
// REPORTS MENU
// -----------------------------------------------------------------------------

const validateRationCardNo = (rationCardNo) => {
    if (!rationCardNo || !rationCardNo.trim()) {
        alert("Please enter Ration Card Number.");
        return false;
    }

    if (!/^\d{12}$/.test(rationCardNo.trim())) {
        alert("Invalid Ration Card Number. Please enter exactly 12 digits.");
        return false;
    }

    return true;
};
const REPORT_PAGES = [
  { to: "/reports", label: "District wise (till date)" },
  { to: "/reports/sla", label: "SLA Days" },
  { to: "/reports/complainee-wise", label: "Complainee Type wise" },
    { to: "/reports/complainee-search", label: "Complainee Search Page" },
  { to: "/reports/complaint-btwdates", label: "Between Dates" },
  { to: "/reports/complaint-userrole", label: "User Role" },
    { to: "/reports/complaint-allmasters", label: "All Masters" },
    { to: "/reports/complaint-complaint-details", label: "Complaint Details" },
];

const validateFPSShopNo = (fpShopNo, distCode) => {
    if (!fpShopNo || !fpShopNo.trim()) {
        alert("Please enter FP Shop No.");
        return false;
    }

    if (!/^\d+$/.test(fpShopNo.trim())) {
        alert("Invalid FP Shop No. Please enter a valid shop number.");
        return false;
    }

    if (!fpShopNo.trim().startsWith(distCode)) {
        alert("Invalid FP Shop No. Please enter a valid FP Shop No for the selected district.");
        return false;
    }

    return true;
};
// -----------------------------------------------------------------------------
// NAVIGATION DROPDOWN
// -----------------------------------------------------------------------------

function NavDropdown({ label, to, pages }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={to}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      >
        {label} ▾
      </a>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: 210,
            background: "#8b6a14",
            borderRadius: "0 0 6px 6px",
            boxShadow: "0 6px 14px rgba(0,0,0,.3)",
            padding: "6px 0",
            zIndex: 50,
          }}
        >
          {pages.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "9px 18px",
                whiteSpace: "nowrap",
              }}
            >
              {m.label}
            </Link>
          ))}
        </div>
      )}
    </span>
  );
}

// -----------------------------------------------------------------------------
// LAYOUT
// -----------------------------------------------------------------------------

export function Layout({
  children,
  home = false,
  nav = false,
  admin = false,
}) {
  const navigate = useNavigate();

  const portal = home || nav || admin;
  const isAdmin = sessionStorage.getItem("igrms_admin") === "1";


  const logout = () => {
    sessionStorage.removeItem("igrms_admin");
    sessionStorage.removeItem("igrms_username");
    sessionStorage.removeItem("igrms_role");
    sessionStorage.removeItem("igrms_roleId");
    sessionStorage.removeItem("igrms_distCode");
    sessionStorage.removeItem("igrms_officeCode");

    navigate("/", { replace: true });
  };

  return (
    <div className={`igrms-page ${portal ? "home-page" : ""}`}>
      <header className="igrms-header">
        <img
          className="emblem"
          src={img("emblem.png")}
          alt="Government of Telangana"
          onError={hideBroken}
        />

        <div className="igrms-titles">
          <h1>
            Integrated <span className="cap">G</span>rievance{" "}
            <span className="cap">R</span>edressal{" "}
            <span className="cap">M</span>onitoring{" "}
            <span className="cap">S</span>ystem(
            <span className="cap">IGRMS</span>) for impds
          </h1>

          <p>
            Department of Consumer affairs, food &amp; civil supplies,
            GOVERNMENT OF TELANGANA
          </p>
        </div>

        {home ? (
          <img
            className="rising-logo"
            src={img("telangana-rising.png")}
            alt="Telangana Rising"
            onError={hideBroken}
          />
        ) : nav || admin ? null : (
          <Link className="home-btn" to={isAdmin ? "/dashboard" : "/"}>
            {isAdmin ? "Dashboard" : "Home"}
          </Link>
        )}
      </header>

      {portal && (
        <nav className="home-nav">
          {admin ? (
            <>
              <Link to="/dashboard">Home</Link>
              <Link to="/lodge-grievance">Grievance Entry Form</Link>
              <NavDropdown label="Reports" to="/reports" pages={REPORT_PAGES} />
              <NavDropdown label="Masters" to="/masters/complaint-source" pages={MASTER_PAGES} />
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                }}
              >
                LogOut
              </a>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              {isAdmin && <Link to="/dashboard">Dashboard</Link>}
              {home && <Link to="/contact">Contact</Link>}
              <Link to="/reports">Reports</Link>
            </>
          )}
        </nav>
      )}

      {children}

      {home && (
        <div className="partner-logos">
          <img src={img("logo-epos.png")} alt="ePoS" onError={hideBroken} />
          <img src={img("logo-civil-supplies.png")} alt="Civil Supplies" onError={hideBroken} />
          <img src={img("logo-food-security.png")} alt="National Food Security Cards" onError={hideBroken} />
          <img src={img("nic-logo.png")} alt="National Informatics Centre" onError={hideBroken} />
        </div>
      )}

      <footer className="igrms-footer">
        <img
          className="nic-logo"
          src={img("nic-logo.png")}
          alt="National Informatics Centre"
          onError={hideBroken}
        />
        <span>{FOOTER_TEXT}</span>
      </footer>
    </div>
  );
}

// -----------------------------------------------------------------------------
// FRONT PAGE AND LOGIN
// -----------------------------------------------------------------------------

function newCaptcha() {
  return String(
    100000 +
      (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)
  );
}

function LoginCard() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
    captcha: "",
  });

  const [captcha, setCaptcha] = useState(newCaptcha);
  const [msg, setMsg] = useState(null);

  const change = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const refresh = () => {
    setCaptcha(newCaptcha());
    setForm((p) => ({
      ...p,
      captcha: "",
    }));
  };

  const reset = () => {
    setForm({
      username: "",
      password: "",
      captcha: "",
    });
    setCaptcha(newCaptcha());
    setMsg(null);
  };

  const login = (e) => {
    e.preventDefault();
    const user = form.username.trim().toLowerCase();

    if (!user || !form.password) {
      setMsg({ ok: false, text: "Enter your username and password" });
      return;
    }

    if (form.captcha.trim() !== captcha) {
      setMsg({ ok: false, text: "Captcha does not match" });
      refresh();
      return;
    }

    const userDetails = LOGIN_USERS[user];

    if (!userDetails || form.password !== userDetails.password) {
      setMsg({ ok: false, text: "Invalid username or password." });
      refresh();
      return;
    }

    sessionStorage.removeItem("igrms_admin");
    sessionStorage.removeItem("igrms_username");
    sessionStorage.removeItem("igrms_role");
    sessionStorage.removeItem("igrms_roleId");
    sessionStorage.removeItem("igrms_distCode");
    sessionStorage.removeItem("igrms_officeCode");

    sessionStorage.setItem("igrms_admin", "1");
    sessionStorage.setItem("igrms_username", user);
    sessionStorage.setItem("igrms_role", userDetails.role);
    sessionStorage.setItem("igrms_roleId", userDetails.roleId);
    sessionStorage.setItem("igrms_distCode", userDetails.distCode);
    sessionStorage.setItem("igrms_officeCode", userDetails.officeCode);

    navigate(userDetails.dashboard, { replace: true });
  };

  return (
    <form className="login-card" onSubmit={login} noValidate autoComplete="off">
      <div className="login-title">Login</div>
      <div className="login-body">
        <label htmlFor="lg-user">Username</label>
        <input
          id="lg-user"
          name="username"
          value={form.username}
          onChange={change}
          placeholder="Enter Username"
          autoComplete="off"
        />

        <label htmlFor="lg-pass">Password</label>
        <input
          id="lg-pass"
          name="password"
          type="password"
          value={form.password}
          onChange={change}
          placeholder="Enter Password"
          autoComplete="new-password"
        />

        <span />

        <div className="captcha-row">
          <span className="captcha-box">{captcha}</span>
          <button
            type="button"
            className="captcha-refresh"
            onClick={refresh}
            aria-label="Refresh captcha"
            title="Refresh captcha"
          >
            ↻
          </button>
        </div>

        <label htmlFor="lg-cap">Captcha</label>
        <input
          id="lg-cap"
          name="captcha"
          value={form.captcha}
          onChange={change}
          placeholder="Enter Captcha"
          inputMode="numeric"
          maxLength={6}
        />

        <span />

        <div className="login-actions">
          <button type="submit" className="login-btn">Login</button>
          <button type="button" className="reset-btn" onClick={reset}>Reset</button>
        </div>
      </div>

      {msg && (
        <div className={`login-msg ${msg.ok ? "ok" : "fail"}`}>
          {msg.text}
        </div>
      )}
    </form>
  );
}

// -----------------------------------------------------------------------------
// HOME PAGE
// -----------------------------------------------------------------------------

function HomePage() {
  const navigate = useNavigate();

  return (
    <Layout home>
      <div className="home-main">
        <aside className="home-left">
          <img
            className="home-illustration"
            src={img("call-center.png")}
            alt="Call centre"
            onError={hideBroken}
          />

          <div className="toll-free">
            <div className="toll-label">Toll Free Number</div>
            <div className="toll-number">Call 1967</div>
            <div className="whatsapp">
              <span className="wa-icon" aria-hidden="true">✆</span>
              <span>
                <strong>WhatsApp</strong>
                <br />
                18004254614
              </span>
            </div>
          </div>
        </aside>

        <section className="home-center">
          <div className="home-title-bar">
            Grievance Redressal Monitoring System
          </div>

          <p className="home-text">
            Citizens can lodge their grievances related to Public
            Distribution System through this portal. The grievance
            would be forwarded to the concerned authorities for
            needful action. PDS Public Grievance Redressal Cell-Call
            Center is a physical place, which works 24X7, where
            anybody can make telephone calls to 1967 (Tollfree number)
            and can give their complaints to PDS Public Grievance
            Redressal Cell-Call Center.
          </p>

          <div className="home-actions">
            <button
              type="button"
              className="green-btn"
              onClick={() => navigate("/lodge-grievance")}
            >
              Lodge your grievance
            </button>

            <button
              type="button"
              className="green-btn"
              onClick={() => navigate("/grievance-status")}
            >
              View Grievance Status
            </button>

            <button
              type="button"
              className="green-btn"
              onClick={() => navigate("/feedback")}
            >
              Feedback Form
            </button>
          </div>
        </section>

        <section className="home-right">
          <LoginCard />
        </section>
      </div>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// INFORMATION PAGE
// -----------------------------------------------------------------------------

function InfoPage({ title, children }) {
  return (
    <Layout>
      <div className="igrms-card">
        <div className="card-title">{title}</div>
        <div className="home-body">{children}</div>
      </div>
    </Layout>
  );
}

function ContactPage() {
  return (
    <InfoPage title="Contact">
      <p>
        Toll Free Number: <strong>1967</strong> (works 24X7)
      </p>
      <p>
        WhatsApp: <strong>18004254614</strong>
      </p>
    </InfoPage>
  );
}

// -----------------------------------------------------------------------------
// VIEW GRIEVANCE STATUS & LIVE API
// -----------------------------------------------------------------------------

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function fmtEntryDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()} ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

const maskMobile = (m) =>
  m ? `${m.slice(0, 2)}XXXXX${m.slice(-3)}` : "";

async function fetchComplaintStatus(complaintNo) {
  const data = await callApi("ComplaintDetailsForComplaintNumber", {
    stateCode: 36,
    complaintNO: complaintNo,
  });
  const code = String(data.respCode);
  if (code !== "0") throw new Error(data.respMessage || data.respMsg || "Complaint not found");
  return {
    complaintId: complaintNo,
    details: data.complaintList?.[0] || {},
    history: data.complaintListHistory || [],
  };
}

function ComplaintResult({ r }) {
  const d = r.details;
  const rows = [
    [["Complaint NO", r.complaintId], ["Complaint Source", d.compSourceEngName], ["Complainee Type", d.compTypeEngName]],
    [["Grievance Type", d.categoryEngName], ["Grievance Subject", d.subCategoryEngName], ["FP Shop NO", d.fpShopNo || "N/A"]],
    [["Do You Have Ration Card", d.rationCardExists], ["Ration Card No", d.rationCardNo || "N/A"], ["Description", d.complaintDescription]],
    [["Name", d.name], ["Gender", d.gender], ["Email", d.email || "N/A"]],
    [["Mobile Number", d.contactNumber], ["District", d.distName], ["Mandal", d.officeName]],
    [["Village/Ward", d.village || "N/A"], ["Address", d.address], null],
  ];
  return (
    <div className="status-result">
      <div className="igrms-card status-card">
        <div className="card-title">Complaint Details</div>
        <table className="status-table">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {row.flatMap((cell, j) => [
                  <th key={`h${j}`}>{cell ? cell[0] : ""}</th>,
                  <td key={`v${j}`} style={{ whiteSpace: "pre-wrap" }}>{cell ? cell[1] : ""}</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="igrms-card status-card">
        <div className="card-title">Complaint History</div>
        <div className="status-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>Grievance Complaint ID</th>
                <th>DisposalType</th>
                <th>Complaint Action from User</th>
                <th>Complaint Forward to User</th>
                <th>Forward District</th>
                <th>Forward Mandal</th>
                <th>Complaint Transaction Remarks</th>
                <th>Entry Date</th>
              </tr>
            </thead>
            <tbody>
              {r.history.map((h, i) => (
                <tr key={i}>
                  <td>{h.complaintNO}</td>
                  <td>{h.disposalTypeEngName}</td>
                  <td>{h.role}</td>
                  <td>{h.forwardUser || "-"}</td>
                  <td>{h.hoDistEngName || "-"}</td>
                  <td>{h.hoMandalEngName || "-"}</td>
                  <td>{h.complaintTransactionRemarks || "-"}</td>
                  <td>{h.entryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPage() {
  const [searchType, setSearchType] = useState("complaint");
  const [complaintNo, setComplaintNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [err, setErr] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const clear = () => {
    setErr("");
    setNotFound(false);
    setResults(null);
    setSelected(null);
  };

  const track = async (e) => {
    e.preventDefault();
    clear();

    if (searchType === "complaint") {
      if (!complaintNo.trim()) {
        setErr("Enter a valid complaint number");
        return;
      }
      setLoading(true);
      try {
        const rec = await fetchComplaintStatus(complaintNo.trim());
        setSelected(rec);
      } catch (err) {
        setErr(err.message || "No complaint found.");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    } else {
  if (!/^[6-9]\d{9}$/.test(mobileNo)) {
    setErr("Enter a valid 10-digit mobile number");
    return;
  }

  setLoading(true);

  try {
    const localList = findByMobile(mobileNo);

    if (localList.length === 0) {
      throw new Error(
        "No complaints found for this mobile number in this browser."
      );
    }

const fullList = await Promise.all(
  localList.map(async (item) => {
    try {
      const live = await fetchComplaintStatus(item.complaintId);
      return {
        ...item,
        ...live,
        details: { ...item.details, ...live.details },
      };
    } catch {
      return item;
    }
  })
);

    // Always display the complaint list, even for one complaint.
    setSelected(null);
    setResults(fullList);

  } catch (err) {
    setErr(err.message || "No complaints found.");
    setNotFound(true);
  } finally {
    setLoading(false);
  }
}
  };

  return (
    <Layout>
      <div className="igrms-card status-card status-search no-print">
        <div className="card-title">View Complaint Status</div>

        <form onSubmit={track} noValidate>
          <div className="status-options">
            <label>
              <input
                type="radio"
                name="searchType"
                value="complaint"
                checked={searchType === "complaint"}
                onChange={() => {
                  setSearchType("complaint");
                  clear();
                }}
              />
              Complaint No.
            </label>

            <label>
              <input
                type="radio"
                name="searchType"
                value="mobile"
                checked={searchType === "mobile"}
                onChange={() => {
                  setSearchType("mobile");
                  clear();
                }}
              />
              Mobile Number
            </label>
          </div>

          <div className="status-row">
            <label htmlFor="status-input">
              {searchType === "complaint" ? "Complaint Number" : "Mobile Number"}
            </label>

            {searchType === "complaint" ? (
              <input
                id="status-input"
                type="text"
                value={complaintNo}
                onChange={(e) => setComplaintNo(e.target.value)}
                placeholder="Enter Complaint No."
              />
            ) : (
              <input
                id="status-input"
                type="text"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter Mobile Number"
                maxLength={10}
                inputMode="numeric"
              />
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Searching..." : "Submit"}
            </button>

            <button
              type="button"
              className="print-btn"
              onClick={() => window.print()}
              disabled={!selected}
            >
              Print
            </button>
          </div>

          {err && (
            <div className="error-text status-error" role="alert">
              {err}
            </div>
          )}
        </form>
      </div>

      {results && (
        <div className="igrms-card status-card no-print">
          <div className="card-title">Complaints for {maskMobile(mobileNo)}</div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Complaint No</th>
                <th>Grievance Subject</th>
                <th>Entry Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.complaintId}>
                  <td>{r.complaintId}</td>
                  <td>{r.details.grievanceSubject}</td>
                  <td>{fmtEntryDate(r.submittedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-submit"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const rec = await fetchComplaintStatus(r.complaintId);
                          setSelected(rec);
                          setResults(null);
                        } catch (err) {
                          setErr(err.message || "Could not load complaint details.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <ComplaintResult r={selected} />}
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// DISTRICT-WISE REPORT
// -----------------------------------------------------------------------------

async function fetchDistrictReport() {
  const data = await callApi("TotalCountTillDateAllDist", {
    distCode: "All",
    ofcCode: "All",
  });

  const code = String(data.respCode);
  if (code !== "0" && code !== "-104") {
    throw new Error(data.respMsg || data.respMessage || "Could not load the report.");
  }

  return {
    asOf: new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    rows: (data.totalCountList || []).map((r) => ({
      districtName: r.distName,
      total: Number(r.totalCount) || 0,
      pending: Number(r.pending) || 0,
      disposal: Number(r.approved) || 0,
      rejected: Number(r.rejected) || 0,
    })),
  };
}

function ReportsPage() {
  const [report, setReport] = useState({ asOf: "", rows: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDistrictReport()
      .then(setReport)
      .catch((e) => setError(`Could not load the report: ${e.message}`));
  }, []);

  const sum = (key) => report.rows.reduce((n, r) => n + r[key], 0);

  return (
    <Layout nav>
      <div className="report-page">
        <div className="report-toolbar no-print">
          <button type="button" className="print-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>

        <div className="print-only report-print-head">
          <strong>Integrated Grievance Redressal Monitoring System (IGRMS) for IMPDS</strong>
          <div>Department of Consumer Affairs, Food &amp; Civil Supplies, Government of Telangana</div>
        </div>

        <div className="report-box">
          <div className="report-title">District wise Complaint Details</div>
          {error && <div className="error-text" style={{ padding: 12 }}>{error}</div>}

          <table className="report-table">
            <thead>
              <tr>
                <th>District Name</th>
                <th>Total</th>
                <th>Pending</th>
                <th>Disposal</th>
                <th>Rejected</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.districtName}>
                  <td>{r.districtName}</td>
                  <td>{r.total}</td>
                  <td>{r.pending}</td>
                  <td>{r.disposal}</td>
                  <td>{r.rejected}</td>
                </tr>
              ))}
            </tbody>
            {report.rows.length > 0 && (
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th>{sum("total")}</th>
                  <th>{sum("pending")}</th>
                  <th>{sum("disposal")}</th>
                  <th>{sum("rejected")}</th>
                </tr>
              </tfoot>
            )}
          </table>

          {report.asOf && <div className="report-asof">Data as on {report.asOf}</div>}
        </div>
      </div>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// GRIEVANCE FORM AND API HELPERS
// -----------------------------------------------------------------------------

const MAX_FILE_SIZE = 1024 * 1024;
const ALLOWED_EXT = ["pdf", "jpg", "jpeg"];
const GENDERS = ["Male", "Female", "Other"];

const EPDS_BASE = "/GrievanceServices/epds";
const STATE_CODE = 36;
const DISPOSAL_TYPE_CODE = 6;
const API_USERNAME = "admin_pmu";
const CLIENT_PUBLIC_IP = "10.160.19.152";
const CLIENT_SERVER_IP = "10.212.134.83";

const OTP_BASE = "/SMSService/epds";
const OTP_APP_TYPE = "6";
const SMS_APP_TYPE = "1";
const MOCK_OTP = true;
const TRACK_URL_BASE = "https://tgspdsgrams.telangana.gov.in/IGRMS/";
const SEND_CONFIRMATION_SMS = true;

const initialState = {
  hasOldComplaint: "no",
  oldComplaintId: "",
  complaintSource: "",
  complaineeType: "",
  mobileNumber: "",
  grievanceType: "",
  grievanceSubject: "",
  fpShopNo: "",
  hasRationCard: "no",
  rationCardNo: "",
  grievanceDescription: "",
  name: "",
  gender: "Male",
  email: "",
  district: "",
  taluka: "",
  villageWard: "",
  address: "",
  pincode: "",
  acceptTerms: false,
};


async function callApi(endpoint, body = {}) {
  const url = `${EPDS_BASE}/${endpoint}`;

  let res;

  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error(`${endpoint} Network Error:`, error);
    throw new Error(
      `Cannot connect to ${endpoint}. Check server connectivity and VPN.`
    );
  }

  const responseText = await res.text();

  let data = {};

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    console.error(`${endpoint} returned HTML or invalid JSON:`, {
      status: res.status,
      url,
      response: responseText.substring(0, 1000),
    });

    const isHtml = /<html|<!doctype|<body/i.test(responseText);

    throw new Error(
      isHtml
        ? `${endpoint}: Server returned an HTML error page. HTTP ${res.status}. Check the Java backend/WildFly logs.`
        : `${endpoint}: Invalid server response. HTTP ${res.status}.`
    );
  }

  console.log(`${endpoint} HTTP Status:`, res.status);
  console.log(`${endpoint} Response:`, data);

  if (!res.ok) {
    throw new Error(
      data.respMessage ||
      data.respMsg ||
      data.message ||
      `Server error: HTTP ${res.status}`
    );
  }

  return data;
}


async function loadList(endpoint, body, listKey) {
  const data = await callApi(endpoint, body);
  const code = String(data.respCode);
  if (code === "0") return data[listKey] || [];
  if (code === "-104") return [];
  throw new Error(data.respMessage || data.respMsg || "Could not load list");
}

const getNumericValue = (value, fieldName) => {
  const number = Number(value);
  if (value === "" || value === null || value === undefined || !Number.isFinite(number)) {
    throw new Error(`Please select a valid ${fieldName}.`);
  }
  return number;
};

async function smsCall(endpoint, body) {
  let res;
  try {
    res = await fetch(`${OTP_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the OTP service.");
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`OTP service error (${res.status})`);
  return data;
}

function useApiList(endpoint, body, listKey, enabled = true) {
  const [state, setState] = useState({
    list: [],
    loading: false,
    error: "",
  });

  const bodyKey = JSON.stringify(body);

  useEffect(() => {
    if (!enabled) {
      setState({ list: [], loading: false, error: "" });
      return;
    }

    let stale = false;

    setState({ list: [], loading: true, error: "" });

    loadList(endpoint, JSON.parse(bodyKey), listKey)
      .then((list) => {
        if (!stale) {
          setState({ list, loading: false, error: "" });
        }
      })
      .catch((e) => {
        if (!stale) {
          setState({ list: [], loading: false, error: e.message });
        }
      });

    return () => {
      stale = true;
    };
  }, [endpoint, bodyKey, listKey, enabled]);

  return state;
}
function DashboardWithComplaintSource() {
  const role = sessionStorage.getItem("igrms_role") || "";

  // Make sure "PMU" is explicitly included here
  const showSources = role === "PMU" || role === "DSO" || role === "ADMIN";

  const sources = useApiList(
    "ComplaintSource",
    {},
    "compSourceList",
    showSources
  );

  return (
    <DashboardPage

    />
  );
}

function RadioYesNo({ name, value, onChange }) {
  return (
    <div className="radio-group">
      {["yes", "no"].map((v) => (
        <label key={v}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={onChange} />
          {v === "yes" ? "Yes" : "No"}
        </label>
      ))}
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
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
}

function OtpGate({ onVerified }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMsg({ ok: false, text: "Please Enter a valid 10-digit Mobile Number" });
      return;
    }
    try {
      setBusy(true);
      const data = MOCK_OTP
        ? { respCode: "0", respMessage: "Test mode: use OTP 123456" }
        : await smsCall("getOTP", { appType: OTP_APP_TYPE, mobileNo: mobile });

      if (String(data.respCode) !== "0") throw new Error(data.respMessage || "Could not send OTP");
      setOtp("");
      setOtpSent(true);
      setMsg({ ok: true, text: data.respMessage || "OTP sent successfully" });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    if (!/^\d{4,6}$/.test(otp)) {
      setMsg({ ok: false, text: "Enter the OTP you received" });
      return;
    }
    try {
      setBusy(true);
      const data = MOCK_OTP
        ? { respCode: otp === "123456" ? "0" : "1", respMessage: "Invalid OTP" }
        : await smsCall("verifyOTP", { appType: OTP_APP_TYPE, mobileNo: mobile, otpNo: otp });

      if (String(data.respCode) !== "0") throw new Error(data.respMessage || "Invalid OTP");
      onVerified({ mobile });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="igrms-card">
      <div className="card-title">Lodge Grievance</div>
      {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`} role="status">{msg.text}</div>}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-around", alignItems: "center", gap: "12px 32px", padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="field-label" style={{ margin: 0, whiteSpace: "nowrap" }}>
            Mobile Number<span className="req">*</span>
          </label>
          <input
            style={{ width: 190, height: 36 }}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
            maxLength={10}
            inputMode="numeric"
            placeholder="Enter Mobile Number"
            disabled={otpSent}
            autoFocus
          />
          <button type="button" className="btn-submit" onClick={sendOtp} disabled={busy}>
            {otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="field-label" style={{ margin: 0, whiteSpace: "nowrap" }}>
            Enter OTP<span className="req">*</span>
          </label>
          <input
            style={{ width: 190, height: 36 }}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            inputMode="numeric"
            placeholder="Enter OTP"
            disabled={!otpSent}
          />
          <button type="button" className="btn-submit" onClick={verifyOtp} disabled={!otpSent || busy}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

function GrievanceForm() {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [rcCheck, setRcCheck] = useState({ status: "idle", text: "" });
  const [session, setSession] = useState(null);
const [rcMembers, setRcMembers] = useState([]);
const [rcMemberLoading, setRcMemberLoading] = useState(false);
const [showRCModal, setShowRCModal] = useState(false);
const [rcLoading, setRcLoading] = useState(false);
const [rcLoadedNo, setRcLoadedNo] = useState("");
const [showMembers, setShowMembers] = useState(false);
  const sources = useApiList("ComplaintSource", {}, "compSourceList");
  const types = useApiList("ComplianeeType", {}, "compTypeList");
  const districts = useApiList("getDistCodes", {}, "distList");
  console.log("Complaint Source object:", sources);
console.log("Complaint Source list:", sources.list);
console.log("Form complaintSource:", form.complaintSource);
  const categories = useApiList(
    "GetMappingDetails",
    { complianeeTypeCode: form.complaineeType },
    "getMappedDetailsList",
    !!form.complaineeType
  );
  const subjects = useApiList(
    "SubCategoryDetails",
    { catCode: form.grievanceType },
    "subCategoryList",
    !!form.grievanceType
  );
  const offices = useApiList(
    "getOfficeCodes",
    { distCode: form.district },
    "officeList",
    !!form.district
  );
useEffect(() => {
  if (form.complaintSource) return;

  const webPortal = (sources.list || []).find(
    (item) =>
      String(item.compSourceName || "").trim().toLowerCase() === "web portal"
  );

  if (webPortal) {
    setForm((prev) => ({
      ...prev,
      complaintSource: String(webPortal.compSourceCode),
    }));
  }
}, [sources.list, form.complaintSource]);

  console.log("hasRationCard:", form.hasRationCard);
  const selType = types.list.find((t) => String(t.compTypeCode) === form.complaineeType);
  const selSubject = subjects.list.find((s) => String(s.subCateCode) === form.grievanceSubject);
  const fpRequired = selType?.fpmandatory === "Y";
  const rcRequired = selType?.rcholdermandatory === "Y";
  const rationCardEnabled = form.hasRationCard === "yes" || rcRequired;

 
  // ---------- handlers ----------

const loadRationCardMembers = async () => {
  const rcNo = String(form.rationCardNo || "").trim();
  if (!rationCardEnabled || !rcNo) return;

  if (!/^\d{12}$/.test(rcNo)) {
    setRcMembers([]);
    setRcCheck({ status: "error", text: "Enter a valid 12-digit Ration Card No" });
    return;
  }
  if (rcNo === rcLoadedNo && rcMembers.length > 0) return; // already loaded: Tab again does not reopen it

  try {
    setRcMemberLoading(true);
    setRcMembers([]);
    setRcCheck({ status: "checking", text: "Validating ration card..." });

    const data = await callApi("RationCard", { rationCardNo: rcNo });
    const list = data.rcdetailslist || [];

    if (String(data.respCode) !== "0" || list.length === 0) {
      throw new Error(data.respMessage || data.respMsg || "Ration card not found");
    }

    setRcMembers(list);
    setRcLoadedNo(rcNo);
    setRcCheck({ status: "success", text: `Ration card validated · ${list.length} member(s)` });
    setShowMembers(true); // the popup opens here
  } catch (error) {
    setRcMembers([]);
    setRcCheck({ status: "error", text: error.message });
  } finally {
    setRcMemberLoading(false);
  }
};

// Select on a member fills Name, Gender, District, Taluka and Address
const applyMember = (m) => {
  const gender = GENDERS.includes(m.gender) ? m.gender : "Other";
  setForm((prev) => ({
    ...prev,
    name: m.membernames || "",
    gender,
    district: String(m.distcode || ""),
    taluka: String(m.mandalcode || ""),
    address: m.address ? String(m.address).replace(/^[,\s]+/, "") : prev.address,
  }));
  setErrors((prev) => ({ ...prev, name: undefined, gender: undefined, district: undefined, taluka: undefined, address: undefined }));
  setShowMembers(false);
};
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "rationCardNo") {
      setRcCheck({ status: "idle", text: "" });
      setRcMembers([]);
        setRcLoadedNo(""); 
    }

    const fieldValue =
      name === "rationCardNo"
        ? value.replace(/\D/g, "").slice(0, 12)
        : value;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : fieldValue,
      };

      if (name === "complaineeType") {
        next.grievanceType = "";
        next.grievanceSubject = "";
      }

      if (name === "grievanceType") next.grievanceSubject = "";
      if (name === "district") next.taluka = "";
      if (name === "hasOldComplaint" && value === "no") {
        next.oldComplaintId = "";
      }

      if (name === "hasRationCard" && value === "no") {
        next.rationCardNo = "";
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };




  const handleVerified = ({ mobile }) => {
    setSession({ mobile });
    setForm((prev) => ({ ...prev, mobileNumber: mobile }));
  };

const handleReset = () => {
  setForm({ ...initialState, mobileNumber: session?.mobile || "" });
  setErrors({});
  setRcCheck({ status: "idle", text: "" });
  setRcMembers([]);
  setRcLoadedNo("");
  setShowMembers(false);
};
  const validate = () => {
    const e = {};
    const req = (k, msg) => !String(form[k]).trim() && (e[k] = msg);

    if (form.hasOldComplaint === "yes") req("oldComplaintId", "Enter the old complaint ID");
    req("complaintSource", "Select complaint source");
    req("complaineeType", "Select complainee type");
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) e.mobileNumber = "Mobile number is not verified";
    req("grievanceType", "Select grievance type");
    req("grievanceSubject", "Select grievance subject");
    // FP Shop No: required for complaint types where FPS details are mandatory.
if (fpRequired) {
  const shopNo = String(form.fpShopNo || "").trim();
  const districtCode = String(form.district || "").trim();

  if (!shopNo) {
    e.fpShopNo = "FP Shop No is required";
  } else if (!/^\d+$/.test(shopNo)) {
    e.fpShopNo = "FP Shop No must contain digits only";
  } else if (!shopNo.startsWith(districtCode)) {
    e.fpShopNo =
      "Invalid FP Shop No for the selected district";
  }
}

    req("grievanceDescription", "Describe your grievance");

    // Ration Card No must be exactly 12 numeric digits whenever enabled.
if (rationCardEnabled) {
    const rcNo = String(form.rationCardNo || "").trim();

    if (!rcNo) {
        e.rationCardNo = "Enter Ration Card No";
    } else if (!/^\d{12}$/.test(rcNo)) {
        e.rationCardNo = "Ration Card No must contain exactly 12 digits";
    }
}
    req("name", "Enter your name");
    req("gender", "Select gender");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    req("district", "Select district");
    req("taluka", "Select taluka / circle");
    req("address", "Enter your address");
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    if (!form.acceptTerms) e.acceptTerms = "You must accept terms and conditions";
    return e;
  };

  const checkRationCard = async () => {
    if (!rationCardEnabled) return true;

    const rationCardNo = String(form.rationCardNo || "").trim();
    if (!rationCardNo) {
      setRcCheck({ status: "error", text: "Enter ration card number" });
      return false;
    }

    try {
      setRcCheck({ status: "checking", text: "Validating ration card..." });
      const data = await callApi("RationCard", {
        rationCardNo
      });

      if (String(data.respCode) === "0") {
        setRcCheck({ status: "success", text: "Ration card validated successfully" });
        return true;
      }
      setRcCheck({
        status: "error",
        text: data.respMessage || data.respMsg || "Invalid ration card number",
      });
      return false;
    } catch (error) {
      setRcCheck({ status: "error", text: error.message || "Unable to validate ration card" });
      return false;
    }
  };

  const nameOf = (list, valueKey, labelKey, value) =>
    list.find((item) => String(item[valueKey]) === String(value))?.[labelKey] || value;

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (submitting) return;

    setResult(null);

    const validationErrors = validate();
    setErrors(validationErrors);

if (Object.keys(validationErrors).length > 0) {

    if (validationErrors.rationCardNo) {
        alert("Ration Card No must contain exactly 12 digits.");
    } else if (validationErrors.fpShopNo) {
        alert(validationErrors.fpShopNo);
    } else {
        alert(
            Object.values(validationErrors)
                .filter(Boolean)
                .join("\n")
        );
    }

    setErrors(validationErrors);

    setResult({
        ok: false,
        message: "Please correct the highlighted fields and submit again."
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
}

    if (!session?.mobile || session.mobile !== form.mobileNumber) {
      window.alert("Mobile number verification is required. Please verify again.");
      setResult({ ok: false, message: "Mobile number verification is required. Please verify again." });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    try {
      const complianeeTypeCode = getNumericValue(form.complaineeType, "Complainee Type");
      const complaintSourceCode = getNumericValue(form.complaintSource, "Complaint Source");
      const categoryCode = getNumericValue(form.grievanceType, "Grievance Type");
      const subCategoryCode = getNumericValue(form.grievanceSubject, "Grievance Subject");
      const distCode = getNumericValue(form.district, "District");
      const mandalCode = getNumericValue(form.taluka, "Taluka / Circle");

      const rationCardValid = await checkRationCard();
      if (!rationCardValid) {
        window.alert("Ration card validation failed. Please check the ration card number.");
        setErrors((prev) => ({ ...prev, rationCardNo: "Enter a valid ration card number" }));
        setResult({ ok: false, message: "Ration card validation failed." });
        return;
      }

      const payload = {
        complianeeTypeCode,
        complaintSourceCode,
        categoryCode,
        subCategoryCode,
        fpShopNo: form.fpShopNo || "",
        vipName: "",
        vipType: "0",
        rationCardExists: rationCardEnabled ? "Y" : "N",
        rationCardNo: rationCardEnabled ? form.rationCardNo.trim() : "",
        complaintDescription: form.grievanceDescription,
        name: form.name,
        gender: form.gender,
        contactNumber: form.mobileNumber,
        email: form.email || "",
        stateCode: STATE_CODE,
        distCode,
        mandalCode,
        villageCode: "",
        village: form.villageWard || "",
        address: form.address,
        pincode: form.pincode,
        uploadFileType: "",
        uploadFilePath: "",
        status: "",
        complaintHandoverId: Number(selSubject?.fwduserid || 0),
        disposalTypeCode: DISPOSAL_TYPE_CODE,
        userName: API_USERNAME,
        clientPublicIp: CLIENT_PUBLIC_IP,
        clientServerIp: CLIENT_SERVER_IP,
        oldComplaintID: form.hasOldComplaint === "yes" ? form.oldComplaintId : "",
      };

      console.log("ComplaintDetails Payload:", payload);
      const data = await callApi("ComplaintDetails", payload);
      console.log("ComplaintDetails Response:", data);

      if (String(data.respCode) !== "0") {
        throw new Error(
          data.respMessage ||
            data.respMsg ||
            data.message ||
            `Complaint registration failed. Response code: ${data.respCode}`
        );
      }

      const complaintId = data.complaintId;

      setResult(
        complaintId
          ? {
              ok: true,
              message: `Your complaint has been registered successfully with complaint number: ${complaintId}. Track your details at `,
              link: `${TRACK_URL_BASE}${complaintId}`,
            }
          : { ok: true, message: data.respMessage || data.respMsg || "Grievance lodged successfully." }
      );

      if (complaintId) {
        saveSubmission({
          complaintId: String(complaintId),
          mobile: form.mobileNumber,
          submittedAt: new Date().toISOString(),
          details: {
            complaintSource: nameOf(sources.list, "compSourceCode", "compSourceName", form.complaintSource),
            complaineeType: nameOf(types.list, "compTypeCode", "compTypeName", form.complaineeType),
            grievanceType: nameOf(categories.list, "categoryCode", "catName", form.grievanceType),
            grievanceSubject: nameOf(subjects.list, "subCateCode", "subCateName", form.grievanceSubject),
            fpShopNo: form.fpShopNo,
            rationCardExists: rationCardEnabled ? "Y" : "N",
            rationCardNo: rationCardEnabled ? form.rationCardNo : "",
            description: form.grievanceDescription,
            name: form.name,
            gender: form.gender,
            email: form.email,
            district: nameOf(districts.list, "distCode", "distName", form.district),
            mandal: nameOf(offices.list, "officeCode", "officeName", form.taluka),
            village: form.villageWard,
            address: form.address,
            pincode: form.pincode,
          },
          api: data,
        });
      }

      if (SEND_CONFIRMATION_SMS && !MOCK_OTP && complaintId) {
        smsCall("sendSMS", {
          appType: SMS_APP_TYPE,
          mobileNo: form.mobileNumber,
          message: `Your complaint has been registered successfully with complaint number: ${complaintId}. Track your details at ${TRACK_URL_BASE}${complaintId}`,
        }).catch((smsError) => {
          console.error("Confirmation SMS Error:", smsError);
          setResult((cur) =>
            cur ? { ...cur, note: "Complaint registered, but confirmation SMS could not be sent." } : cur
          );
        });
      }

      handleReset();
    } catch (err) {
      console.error("Complaint Submission Failed:", err);
      setResult({ ok: false, message: err.message || "Unable to lodge grievance. Please try again." });
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ---------- OTP screen ----------

  if (!session) {
    return (
      <Layout>
        <OtpGate onVerified={handleVerified} />
      </Layout>
    );
  }



const apiSelect = (
  name,
  api,
  valueKey,
  labelKey,
  activeKey,
  {
    disabled = false,
    placeholder = "Select",
    filterOptions = null,
  } = {}
) => (
  <select
    name={name}
    value={form[name]}
    onChange={handleChange}
    disabled={disabled || api.loading}
  >
    <option value="">{placeholder}</option>

    {(api.list || [])
      .filter((item) => {
        if (!activeKey) return true;

        const status = item[activeKey];

        return (
          status == null ||
          status === "" ||
          ["Y", "YES", "1", "TRUE", "ACTIVE"].includes(
            String(status).trim().toUpperCase()
          )
        );
      })
      .filter((item) => !filterOptions || filterOptions(item))
      .map((item) => (
        <option
          key={item[valueKey]}
          value={String(item[valueKey])}
        >
          {item[labelKey]}
        </option>
      ))}
  </select>
);



  return (
    <Layout>
      <form className="igrms-card" onSubmit={handleSubmit} noValidate>
        <div className="card-title">Lodge Grievance</div>

        {result && (
          <div className={`banner ${result.ok ? "ok" : "fail"}`} role="status">
            {result.message}
            {result.link && (
              <a href={result.link} target="_blank" rel="noreferrer">{result.link}</a>
            )}
            {result.note && <div>{result.note}</div>}
          </div>
        )}

        <div className="verified-bar">
          Mobile number <strong>{session.mobile}</strong> verified <span className="tick">✓</span>
        </div>

        <div className="grid">
          {/* Column 1 */}
          <div className="col">
            <Field label="Do you have old Complaint ID">
              <RadioYesNo name="hasOldComplaint" value={form.hasOldComplaint} onChange={handleChange} />
            </Field>

{/* Complaint Source Field */}
{(() => {
  const isAdmin = sessionStorage.getItem("igrms_admin") === "1";

  return (
    <Field label="Complaint Source" required error={errors.complaintSource || sources.error}>
      <select
        className="form-select"
        name="complaintSource"
        value={form.complaintSource || ""}
        onChange={handleChange}
        disabled={!isAdmin} // Disabled for regular users (defaults to Web Portal), enabled for admins
      >
        <option value="">Select Complaint Source</option>

        {(sources.list || []).map((item) => (
          <option
            key={item.compSourceCode}
            value={String(item.compSourceCode)}
          >
            {item.compSourceName}
          </option>
        ))}
      </select>
    </Field>
  );
})()}

            <Field label="Grievance Type" required error={errors.grievanceType || categories.error}>
              {apiSelect("grievanceType", categories, "categoryCode", "catName", "activeStatus", {
                disabled: !form.complaineeType,
                placeholder: form.complaineeType ? "Select" : "Select complainee type first",
              })}
            </Field>
           <Field label="Do you have Ration Card">
  <RadioYesNo
    name="hasRationCard"
    value={form.hasRationCard}
    onChange={(e) => {
      handleChange(e);

      if (e.target.value === "No") {
        setForm((prev) => ({
          ...prev,
          rationCardNo: "",
        }));

        setRcMembers([]);
        setShowRCModal(false);
      }
    }}
  />
</Field>
         <Field label="Name" required error={errors.name}>
  {rcMembers.length > 0 ? (
    <select
      name="name"
      value={form.name}
      onChange={(e) => {
        const m = rcMembers.find((x) => x.membernames === e.target.value);
        if (m) applyMember(m);
      }}
    >
      <option value="">Select</option>
      {rcMembers.map((m, i) => (
        <option key={`${m.membernames}-${i}`} value={m.membernames}>{m.membernames}</option>
      ))}
    </select>
  ) : (
    <input name="name" value={form.name} onChange={handleChange} placeholder="Enter Name" />
  )}
</Field>
            <Field label="District" required error={errors.district || districts.error}>
              {apiSelect("district", districts, "distCode", "distName")}
            </Field>
            <Field label="Complete Address" required error={errors.address}>
              <textarea name="address" rows={3} value={form.address} onChange={handleChange} />
            </Field>
          </div>

          {/* Column 2 */}
          <div className="col">
            <Field label="Old Complaint ID" error={errors.oldComplaintId}>
              <input
                name="oldComplaintId"
                value={form.oldComplaintId}
                onChange={handleChange}
                placeholder="Old Complaint ID"
                disabled={form.hasOldComplaint === "no"}
              />
            </Field>
            <Field label="Complainee Type" required error={errors.complaineeType || types.error}>
              {apiSelect("complaineeType", types, "compTypeCode", "compTypeName", "activestatus")}
            </Field>
            <Field label="Grievance Subject" required error={errors.grievanceSubject || subjects.error}>
              {apiSelect("grievanceSubject", subjects, "subCateCode", "subCateName", "activestatus", {
                disabled: !form.grievanceType,
                placeholder: form.grievanceType ? "Select" : "Select grievance type first",
              })}
            </Field>
<Field
  label="Ration Card Number"
  required={form.hasRationCard === "Yes"}
  error={errors.rationCardNo}
>
  <input
    name="rationCardNo"
    value={form.rationCardNo || ""}
    onChange={handleChange}
    onBlur={loadRationCardMembers}
    maxLength={12}
    placeholder="Enter Ration Card Number"
disabled={
  ["NO", "N", "0", "FALSE"].includes(
    String(form.hasRationCard || "").trim().toUpperCase()
  )
}
  />

    {rcMemberLoading && <span>Loading ration card details...</span>}

  {rcCheck.text && (
    <span className={rcCheck.status === "error" ? "error-text" : ""}>
      {rcCheck.text}
    </span>
  )}
</Field>
            <Field label="Gender" required error={errors.gender}>
              <select name="gender" value={form.gender} onChange={handleChange}>
                {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </Field>
            <Field label="Taluka / Circle" required error={errors.taluka || offices.error}>
              {apiSelect("taluka", offices, "officeCode", "officeName", null, { disabled: !form.district })}
            </Field>
            <Field label="Pincode" required error={errors.pincode}>
              <input name="pincode" value={form.pincode} onChange={handleChange} maxLength={6} inputMode="numeric" />
            </Field>
          </div>

          {/* Column 3 */}
          <div className="col">
            <Field label="Mobile Number" required error={errors.mobileNumber}>
              <input name="mobileNumber" value={form.mobileNumber} readOnly className="verified-input" />
              <span className="verified-badge">✓ Verified</span>
            </Field>
            <Field label="FP Shop No" required={fpRequired} error={errors.fpShopNo}>
              <input
              name="fpShopNo"
              value={form.fpShopNo}
              onChange={handleChange}
              onBlur={() => {
                if (!fpRequired || !form.fpShopNo) return;
                setErrors((prev) => ({
                  ...prev,
                  fpShopNo: /^\\d+$/.test(form.fpShopNo.trim())
                    ? undefined
                    : "FP Shop No must contain only digits",
                }));
              }}
              placeholder="FP Shop NO"
              inputMode="numeric"
            />
            </Field>
            <Field label="Grievance Description" required error={errors.grievanceDescription}>
              <textarea
                name="grievanceDescription"
                rows={3}
                value={form.grievanceDescription}
                onChange={handleChange}
                placeholder="Enter Description"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter Email" />
            </Field>
            <Field label="Village / Ward">
              <input name="villageWard" value={form.villageWard} onChange={handleChange} placeholder="Village Name" />
            </Field>
          </div>
        </div>

        <label className="terms">
          <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} />
          I hereby accept the terms and conditions for using this site
        </label>
        {errors.acceptTerms && <span className="error-text terms-error">{errors.acceptTerms}</span>}

        <div className="actions">
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
          <button type="button" className="btn-reset" onClick={handleReset}>Reset</button>
        </div>
        {showMembers && (
  <RationCardMemberModal
    members={rcMembers}
    onSelect={applyMember}
    onClose={() => setShowMembers(false)}
  />
)}
      </form>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// APPLICATION ROUTES
// -----------------------------------------------------------------------------

function App() {
  return (
    <BrowserRouter basename="/igrms">
      <Routes>
<Route
  path="/dashboard"
  element={
    <RequireAdmin>
     <DashboardPage />
    </RequireAdmin>
  }
/>
        <Route path="/masters/complainee-type" element={<RequireAdmin><AdminTypeMaster /></RequireAdmin>} />
        <Route path="/masters/subject" element={<RequireAdmin><AdminSubjectMaster /></RequireAdmin>} />
        <Route path="/masters/complaint-source" element={<RequireAdmin><AdminSourceMaster /></RequireAdmin>} />
        <Route path="/masters/user-mapping" element={<RequireAdmin><AdminUserMapping /></RequireAdmin>} />
        <Route path="/masters/disposal-mapping" element={<RequireAdmin><AdminDisposalUserRoleMapping /></RequireAdmin>} />
        <Route path="/masters/disposal-type" element={<RequireAdmin><AdminDisposalTypeMaster /></RequireAdmin>} />
        <Route path="/masters/menu" element={<RequireAdmin><AdminMenuMaster /></RequireAdmin>} />
        <Route path="/masters/category-mapping" element={<RequireAdmin><AdminCategoryMapping /></RequireAdmin>} />
        <Route path="/masters/rationcard-popup" element={<RequireAdmin><RationCardMemberModal/></RequireAdmin>} />
        <Route path="/reports/sla" element={<RequireAdmin><AdminSlaReport /></RequireAdmin>} />
        <Route path="/reports/complainee-wise" element={<RequireAdmin><AdminComplaineeWiseReport /></RequireAdmin>} />
             <Route path="/reports/complainee-search" element={<RequireAdmin><AdminComplaintSearchPage /></RequireAdmin>} />
        <Route path="/reports/complaint-btwdates" element={<RequireAdmin><AdminBtwDatesReport /></RequireAdmin>} />
        <Route path="/reports/complaint-userrole" element={<RequireAdmin><AdminUserRoleReport /></RequireAdmin>} />
            <Route path="/reports/complaint-allmasters" element={<RequireAdmin><AdminAllMastersReport /></RequireAdmin>} />
<Route path="/reports/complaint-complaint-details" element={<RequireAdmin><AdminComplaintDetails /></RequireAdmin>} />
        <Route path="/" element={<HomePage />} />
        <Route path="/lodge-grievance" element={<GrievanceForm />} />
        <Route path="/grievance-status" element={<StatusPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/feedback" element={<FeedbackForm />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;