import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GrievanceForm.css";

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const ALLOWED_EXT = ["pdf", "jpg", "jpeg"];
const GENDERS = ["Male", "Female", "Other"];

// Department API, reached through the "proxy" in package.json (CRA dev server)
const EPDS_BASE = "/GrievanceServices/epds";
const STATE_CODE = 36; // Telangana
const DISPOSAL_TYPE_CODE = 6; // value from the API document sample; confirm with the department
// Dev only: the user name the API expects (put REACT_APP_EPDS_USERNAME=... in a .env file)
const API_USERNAME = process.env.REACT_APP_EPDS_USERNAME || "";

// OTP + SMS service (separate server from the grievance API; reached through setupProxy.js)
const OTP_BASE = "/SMSService/epds";
const OTP_APP_TYPE = "6"; // appType used for getOTP / verifyOTP in the API document
const SMS_APP_TYPE = "1"; // appType used for sendSMS in the API document
const SEND_CONFIRMATION_SMS = true; // send the "complaint registered" SMS after a successful submit

const FOOTER_TEXT =
  "Disclaimer: Content on this website is published and managed by Commissioner of Civil Supplies, Hyderabad.";

const initialState = {
  hasOldComplaint: "no",
  oldComplaintId: "",
  complaintSource: "", // ComplaintSource      -> compSourceCode
  complaineeType: "", // ComplianeeType        -> compTypeCode
  mobileNumber: "",
  grievanceType: "", // GetMappingDetails      -> categoryCode
  grievanceSubject: "", // SubCategoryDetails  -> subCateCode
  fpShopNo: "",
  hasRationCard: "no",
  rationCardNo: "",
  grievanceDescription: "",
  name: "",
  gender: "Male",
  email: "",
  district: "", // getDistCodes               -> distCode
  taluka: "", // getOfficeCodes               -> officeCode
  villageWard: "",
  address: "",
  pincode: "",
  acceptTerms: false,
};

// ---------- API helpers ----------

// POSTs JSON to one department endpoint and returns the parsed response
async function callApi(endpoint, body = {}) {
  let res;
  try {
    res = await fetch(`${EPDS_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check that npm start was restarted after adding the proxy.");
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`Server error (${res.status})`);
  return data;
}

// Returns the list inside `listKey`. respCode "0" = ok, "-104" = no data, anything else = error.
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
// POSTs JSON to the OTP / SMS service. respCode "0" = success.
async function smsCall(endpoint, body) {
  let res;
  try {
    res = await fetch(`${OTP_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the OTP service. Check the network / VPN and that setupProxy.js is in place.");
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new Error(`OTP service error (${res.status}). Is the SMS server reachable from this machine?`);
  return data;
}

// Dropdown loader: reloads when the parent value changes, stays empty while `enabled` is false
function useApiList(endpoint, body, listKey, enabled = true) {
  const [state, setState] = useState({ list: [], loading: false, error: "" });
  const bodyKey = JSON.stringify(body);

  useEffect(() => {
    if (!enabled) {
      setState({ list: [], loading: false, error: "" });
      return;
    }
    let stale = false;
    setState({ list: [], loading: true, error: "" });
    loadList(endpoint, JSON.parse(bodyKey), listKey)
      .then((list) => !stale && setState({ list, loading: false, error: "" }))
      .catch((e) => !stale && setState({ list: [], loading: false, error: e.message }));
    return () => {
      stale = true;
    };
  }, [endpoint, bodyKey, listKey, enabled]);

  return state;
}

// ---------- Small components ----------

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

function Header({ onHome }) {
  return (
    <header className="igrms-header">
      <div>
        <h1>Integrated Grievance Redressal Monitoring System (IGRMS) for IMPDS</h1>
        <p>Department of Consumer Affairs, Food &amp; Civil Supplies, Government of Telangana</p>
      </div>
      <a
        className="home-btn"
        href="/"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        Home
      </a>
    </header>
  );
}

// Mobile number + OTP page. Uses the getOTP and verifyOTP APIs.
function OtpGate({ onVerified }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMsg({ ok: false, text: "Please Enter a valid 10-digit Mobile Number" });
      return;
    }
    try {
      setBusy(true);
      const data = await smsCall("getOTP", { appType: OTP_APP_TYPE, mobileNo: mobile });
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
      const data = await smsCall("verifyOTP", { appType: OTP_APP_TYPE, mobileNo: mobile, otpNo: otp });
      if (String(data.respCode) !== "0") throw new Error(data.respMessage || "Invalid OTP");
      onVerified({ mobile });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const changeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setMsg(null);
  };

  return (
    <div className="igrms-card">
      <div className="card-title">Lodge Grievance</div>
      {msg && (
        <div className={`banner ${msg.ok ? "ok" : "fail"}`} role="status">
          {msg.text}
        </div>
      )}
      <div className="otp-row">
        <label className="field-label">
          Mobile Number<span className="req">*</span>
        </label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && !otpSent && sendOtp()}
          maxLength={10}
          inputMode="numeric"
          placeholder="Enter Mobile Number"
          disabled={otpSent}
          autoFocus
        />
        <button type="button" className="btn-submit" onClick={sendOtp} disabled={busy}>
          {otpSent ? "Resend OTP" : "Send OTP"}
        </button>

        <label className="field-label">
          Enter OTP<span className="req">*</span>
        </label>
        <input
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && otpSent && verifyOtp()}
          maxLength={6}
          inputMode="numeric"
          placeholder="Enter OTP"
          disabled={!otpSent}
        />
        <button type="button" className="btn-submit" onClick={verifyOtp} disabled={!otpSent || busy}>
          Verify
        </button>
      </div>
      {otpSent && (
        <button type="button" className="btn-reset" onClick={changeNumber} style={{ margin: "0 16px 16px" }}>
          Change number
        </button>
      )}
    </div>
  );
}

export default function GrievanceForm() {
   const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const fileInputRef = useRef(null);
  const [session, setSession] = useState(null); // { mobile } after the OTP is verified

  // ---------- Dropdown data (all from the department APIs) ----------
  const sources = useApiList("ComplaintSource", {}, "compSourceList");
  const types = useApiList("ComplianeeType", {}, "compTypeList");
  const districts = useApiList("getDistCodes", {}, "distList");
  const categories = useApiList(
    "GetMappingDetails",
    { complianeeTypeCode: form.complaineeType },
    "getMappedDetailsList",
    !!form.complaineeType
  );
  const subjects = useApiList("SubCategoryDetails", { catCode: form.grievanceType }, "subCategoryList", !!form.grievanceType);
  const offices = useApiList("getOfficeCodes", { distCode: form.district }, "officeList", !!form.district);

  // Rules come from the chosen rows
  const selType = types.list.find((t) => String(t.compTypeCode) === form.complaineeType);
  const selSubject = subjects.list.find((s) => String(s.subCateCode) === form.grievanceSubject);
  const fpRequired = selType?.fpmandatory === "Y";
  const rcRequired = selType?.rcholdermandatory === "Y";
  const rationCardEnabled = form.hasRationCard === "yes" || rcRequired;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };
      // changing a parent clears everything below it
      if (name === "complaineeType") {
        next.grievanceType = "";
        next.grievanceSubject = "";
      }
      if (name === "grievanceType") next.grievanceSubject = "";
      if (name === "district") next.taluka = "";
      if (name === "hasOldComplaint" && value === "no") next.oldComplaintId = "";
      if (name === "hasRationCard" && value === "no") next.rationCardNo = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };


const handleFile = (e) => {
  const f = e.target.files?.[0];

  if (!f) {
    setFile(null);
    setErrors((prev) => ({ ...prev, file: "" }));
    return;
  }

  const allowedExtensions = /\.(pdf|jpe?g)$/i;
  const allowedMimeTypes = ["application/pdf", "image/jpeg"];

  if (
    !allowedExtensions.test(f.name) ||
    !allowedMimeTypes.includes(f.type)
  ) {
    setFile(null);
    setErrors((prev) => ({
      ...prev,
      file: "Only PDF, JPG, and JPEG files are allowed.",
    }));

    e.target.value = "";
    return;
  }

  if (f.size > MAX_FILE_SIZE) {
    setFile(null);
    setErrors((prev) => ({
      ...prev,
      file: "File size must not exceed 1 MB.",
    }));

    e.target.value = "";
    return;
  }

  setFile(f);
  setErrors((prev) => ({ ...prev, file: "" }));
};


  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setErrors((p) => ({ ...p, file: undefined }));
  };

  const validate = () => {
    const e = {};
    const req = (k, msg) => !String(form[k]).trim() && (e[k] = msg);

    if (form.hasOldComplaint === "yes") req("oldComplaintId", "Enter the old complaint ID");
    req("complaintSource", "Select complaint source");
    req("complaineeType", "Select complainee type");
    if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) e.mobileNumber = "Enter a valid 10-digit mobile number";
    req("grievanceType", "Select grievance type");
    req("grievanceSubject", "Select grievance subject");
    if (fpRequired) req("fpShopNo", "FP shop number is required for this complainee type");
    req("grievanceDescription", "Describe your grievance");
    if (rationCardEnabled) req("rationCardNo", "Enter ration card number");
    req("name", "Enter your name");
    req("gender", "Select gender");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
    req("district", "Select district");
    req("taluka", "Select taluka / circle");
    req("address", "Enter your address");
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    if (!form.acceptTerms) e.acceptTerms = "You must accept the terms and conditions";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setResult(null);
    const validationErrors = validate();
    setErrors((prev) => ({ ...prev, ...validationErrors }));

    // Do not submit if either form validation or file validation failed.
    if (Object.keys(validationErrors).length > 0 || errors.file) return;

    // Payload exactly as defined by the ComplaintDetails API
    const payload = {
      complianeeTypeCode: Number(form.complaineeType),
      complaintSourceCode: Number(form.complaintSource),
      categoryCode: Number(form.grievanceType),
      subCategoryCode: Number(form.grievanceSubject),
      fpShopNo: form.fpShopNo,
      vipName: "",
      vipType: "0",
      rationCardExists: rationCardEnabled ? "Y" : "N",
      rationCardNo: rationCardEnabled ? form.rationCardNo : "",
      complaintDescription: form.grievanceDescription,
      name: form.name,
      gender: form.gender,
      contactNumber: form.mobileNumber,
      email: form.email,
      stateCode: STATE_CODE,
      distCode: Number(form.district),
      mandalCode: Number(form.taluka), // office code
      villageCode: "",
      village: form.villageWard,
      address: form.address,
      pincode: form.pincode,
      uploadFileType: "", // the API document has no file-upload endpoint yet
      uploadFilePath: "",
      status: "",
      complaintHandoverId: selSubject?.fwduserid ?? 0, // forwarding user of the chosen subject
      disposalTypeCode: DISPOSAL_TYPE_CODE,
      userName: API_USERNAME,
      clientPublicIp: "",
      clientServerIp: "",
      oldComplaintID: form.hasOldComplaint === "yes" ? form.oldComplaintId : "",
    };

    try {
      setSubmitting(true);
      const data = await callApi("ComplaintDetails", payload);
      if (String(data.respCode) !== "0") throw new Error(data.respMessage || data.respMsg || "Could not lodge grievance");

      setResult({
        ok: true,
        message: data.complaintId
          ? `Grievance lodged successfully. Your complaint ID is ${data.complaintId}.`
          : "Grievance lodged successfully.",
      });

      console.log("Submitted grievance data:", payload);
console.log("Complaint API response:", data);

alert(
  "Grievance submitted successfully!\n\n" +
    "Submitted Data:\n" +
    JSON.stringify(payload, null, 2) +
    "\n\nAPI Response:\n" +
    JSON.stringify(data, null, 2)
);

      // Best effort: a failed SMS must not undo a successful registration
console.log("SEND_CONFIRMATION_SMS:", SEND_CONFIRMATION_SMS);
console.log("Complaint ID:", data.complaintId);
console.log("Mobile Number:", form.mobileNumber);

if (
  SEND_CONFIRMATION_SMS &&
  data.respCode === "0" &&
  data.complaintId
) {
  const smsPayload = {
    appType: SMS_APP_TYPE,
    mobileNo: form.mobileNumber,
    message:
      `Your complaint has been registered successfully with complaint number: ${data.complaintId}. ` +
      `Track your details at https://tgspdsgrams.telangana.gov.in/IGRMS/${data.complaintId}`,
  };

  console.log("Sending confirmation SMS for:", data.complaintId);

  smsCall("sendSMS", smsPayload)
    .then((response) => {
      console.log("Confirmation SMS response:", response);
    })
    .catch((error) => {
      console.error("Confirmation SMS failed:", error);
    });
}
      handleReset();

      // Return to the Home page after showing the success message briefly.
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err) {
      setResult({ ok: false, message: err.message || "Unable to lodge grievance. Please try again." });
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Keeps the verified mobile number after reset
  const handleReset = () => {
    setForm({ ...initialState, mobileNumber: session?.mobile || "" });
    setErrors({});
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVerified = ({ mobile }) => {
    setSession({ mobile });
    setForm((prev) => ({ ...prev, mobileNumber: mobile }));
  };

  // Home: clear everything and go back to the mobile number + OTP screen
  const goHome = () => {
    setForm(initialState);
    setErrors({});
    setResult(null);
    setFile(null);
    setSession(null);
  };

  // OTP screen (before verification)
  if (!session) {
    return (
      <div className="igrms-page">
        <Header onHome={goHome} />
        <OtpGate onVerified={handleVerified} />
        <footer className="igrms-footer">{FOOTER_TEXT}</footer>
      </div>
    );
  }

  // Dropdown bound to an API list. valueKey/labelKey/activeKey tell it which fields to use.
  const apiSelect = (name, api, valueKey, labelKey, activeKey, { disabled = false, placeholder = "Select" } = {}) => (
    <select name={name} value={form[name]} onChange={handleChange} disabled={disabled || api.loading}>
      <option value="">{api.loading ? "Loading…" : placeholder}</option>
      {api.list
        .filter((i) => !activeKey || !i[activeKey] || i[activeKey] === "Y")
        .map((i) => (
          <option key={i[valueKey]} value={i[valueKey]}>
            {i[labelKey]}
          </option>
        ))}
    </select>
  );

  return (
    <div className="igrms-page">
      <Header onHome={goHome} />

      <form className="igrms-card" onSubmit={handleSubmit} noValidate>
        <div className="card-title">Lodge Grievance</div>

        {result && (
          <div className={`banner ${result.ok ? "ok" : "fail"}`} role="status">{result.message}</div>
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
            <Field label="Complaint Source" required error={errors.complaintSource || sources.error}>
              {apiSelect("complaintSource", sources, "compSourceCode", "compSourceName", "activeStatus")}
            </Field>
            <Field label="Grievance Type" required error={errors.grievanceType || categories.error}>
              {apiSelect("grievanceType", categories, "categoryCode", "catName", "activeStatus", {
                disabled: !form.complaineeType,
                placeholder: form.complaineeType ? "Select" : "Select complainee type first",
              })}
            </Field>
            <Field label="Do you have Ration Card">
              <RadioYesNo name="hasRationCard" value={form.hasRationCard} onChange={handleChange} />
            </Field>
            <Field label="Name" required error={errors.name}>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Enter Name" />
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
            <Field label="Ration Card No" required={rcRequired} error={errors.rationCardNo}>
              <input
                name="rationCardNo"
                value={form.rationCardNo}
                onChange={handleChange}
                placeholder="Enter Ration Card No"
                disabled={!rationCardEnabled}
              />
            </Field>
            <Field label="Gender" required error={errors.gender}>
              <select name="gender" value={form.gender} onChange={handleChange}>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
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
              <input
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleChange}
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit mobile number"
                readOnly
                className="verified-input"
              />
              <span className="verified-badge">✓ Verified</span>
            </Field>
            <Field label="FP Shop No" required={fpRequired} error={errors.fpShopNo}>
              <input name="fpShopNo" value={form.fpShopNo} onChange={handleChange} placeholder="FP Shop NO" />
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
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Enter Email Address" />
            </Field>
            <Field label="Village / Ward">
              <input name="villageWard" value={form.villageWard} onChange={handleChange} placeholder="Village Name" />
            </Field>
          </div>
        </div>

        <div className="upload-row">
          <label className="field-label" htmlFor="scannedFile">Upload Scanned File</label>
          <div>
            <div className="upload-control">
              <input
                ref={fileInputRef}
                id="scannedFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                onChange={handleFile}
              />
              <span className={`file-pill ${file ? "has-file" : ""}`}>{file ? file.name : "No files Uploaded"}</span>
              {file && (
                <button type="button" className="remove-file" onClick={removeFile} aria-label="Remove file">×</button>
              )}
            </div>
            <small>(Only 'pdf', '.jpeg', '.jpg' formats are allowed. File size up to 1 MB)</small>
            {file && (
              <span className="error-text">
                Note: the API document has no file-upload endpoint yet, so this file will not be submitted.
              </span>
            )}
            {errors.file && <span className="error-text">{errors.file}</span>}
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
      </form>

      <footer className="igrms-footer">{FOOTER_TEXT}</footer>
    </div>
  );
}
