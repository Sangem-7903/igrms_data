// src/api/epds.js
// The ONLY file that knows the department API: URLs, request shapes, respCode handling.
// The UI never calls fetch() for dropdown data or submit; it calls epdsApi.* instead.

// Dev: "/GrievanceServices/epds" + "proxy" in package.json.  Deployed: your Spring Boot proxy, e.g.
// REACT_APP_EPDS_BASE=http://localhost:8080/api/epds
const EPDS_BASE = process.env.REACT_APP_EPDS_BASE || "/GrievanceServices/epds";

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

async function post(endpoint, body = {}, headers = {}) {
  let res;
  try {
    res = await fetch(`${EPDS_BASE}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check that the backend is running.", "NETWORK");
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new ApiError(`Server error (${res.status})`, String(res.status));
  return data;
}

const messageOf = (d) => d.respMessage || d.respMsg || "Request failed";

// respCode "0" = success, "-104" = no data (empty list), anything else = error
async function list(endpoint, body, listKey) {
  const data = await post(endpoint, body);
  const code = String(data.respCode);
  if (code === "0") return data[listKey] || [];
  if (code === "-104") return [];
  throw new ApiError(messageOf(data), code);
}

// API rows -> dropdown options. `raw` keeps the full row (fpmandatory, fwduserid, ...)
const toOptions = (items, valueKey, labelKey, activeKey) =>
  items
    .filter((i) => !activeKey || !i[activeKey] || i[activeKey] === "Y")
    .map((i) => ({ value: String(i[valueKey]), label: i[labelKey], raw: i }));

export const epdsApi = {
  // ---- dropdown lists ----
  complaintSources: async () =>
    toOptions(await list("ComplaintSource", {}, "compSourceList"), "compSourceCode", "compSourceName", "activeStatus"),

  complaineeTypes: async () =>
    toOptions(await list("ComplianeeType", {}, "compTypeList"), "compTypeCode", "compTypeName", "activestatus"),

  districts: async () => toOptions(await list("getDistCodes", {}, "distList"), "distCode", "distName"),

  // depends on the complainee type
  categories: async (complaineeTypeCode) =>
    toOptions(
      await list("GetMappingDetails", { complianeeTypeCode: String(complaineeTypeCode) }, "getMappedDetailsList"),
      "categoryCode",
      "catName",
      "activeStatus"
    ),

  // depends on the category
  subCategories: async (catCode) =>
    toOptions(
      await list("SubCategoryDetails", { catCode: String(catCode) }, "subCategoryList"),
      "subCateCode",
      "subCateName",
      "activestatus"
    ),

  // depends on the district
  offices: async (distCode) =>
    toOptions(await list("getOfficeCodes", { distCode: String(distCode) }, "officeList"), "officeCode", "officeName"),

  // ---- submit ----
  submitComplaint: async (payload, otpToken) => {
    const data = await post("ComplaintDetails", payload, otpToken ? { "X-OTP-Token": otpToken } : {});
    if (String(data.respCode) !== "0") throw new ApiError(messageOf(data), String(data.respCode));
    return data; // contains complaintId
  },
};
