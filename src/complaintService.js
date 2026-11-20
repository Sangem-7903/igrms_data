// src/services/complaintService.js
// Business rules from the API document: what is mandatory and how the form becomes the ComplaintDetails payload.

const STATE_CODE = 36; // Telangana
const DISPOSAL_TYPE_CODE = 6; // from the API document sample; confirm with the department

// rules come from the chosen complainee type row: { fpRequired, rcRequired }
export function getRules(selectedType) {
  return {
    fpRequired: selectedType?.fpmandatory === "Y",
    rcRequired: selectedType?.rcholdermandatory === "Y",
  };
}

export function validateComplaint(form, { fpRequired, rcRequired }) {
  const e = {};
  const req = (k, msg) => !String(form[k]).trim() && (e[k] = msg);
  const rationCardNeeded = form.hasRationCard === "yes" || rcRequired;

  if (form.hasOldComplaint === "yes") req("oldComplaintId", "Enter the old complaint ID");
  req("complaintSource", "Select complaint source");
  req("complaineeType", "Select complainee type");
  if (!/^[6-9]\d{9}$/.test(form.mobileNumber)) e.mobileNumber = "Enter a valid 10-digit mobile number";
  req("grievanceType", "Select grievance type");
  req("grievanceSubject", "Select grievance subject");
  if (fpRequired) req("fpShopNo", "FP shop number is required for this complainee type");
  req("grievanceDescription", "Describe your grievance");
  if (rationCardNeeded) req("rationCardNo", "Enter ration card number");
  req("name", "Enter your name");
  req("gender", "Select gender");
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address";
  req("district", "Select district");
  req("taluka", "Select taluka / circle");
  req("address", "Enter your address");
  if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
  if (!form.acceptTerms) e.acceptTerms = "You must accept the terms and conditions";
  return e;
}

// selectedSubCategory = the raw SubCategoryDetails row (its fwduserid becomes complaintHandoverId)
export function buildComplaintPayload(form, selectedSubCategory, { rcRequired = false } = {}) {
  const rationCardNeeded = form.hasRationCard === "yes" || rcRequired;
  return {
    complianeeTypeCode: Number(form.complaineeType),
    complaintSourceCode: Number(form.complaintSource),
    categoryCode: Number(form.grievanceType),
    subCategoryCode: Number(form.grievanceSubject),
    fpShopNo: form.fpShopNo,
    vipName: "",
    vipType: "0",
    rationCardExists: rationCardNeeded ? "Y" : "N",
    rationCardNo: rationCardNeeded ? form.rationCardNo : "",
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
    uploadFileType: "", // no upload API in the document yet
    uploadFilePath: "",
    status: "",
    complaintHandoverId: selectedSubCategory?.fwduserid ?? 0,
    disposalTypeCode: DISPOSAL_TYPE_CODE,
    // filled in by the Spring Boot proxy, never trusted from the browser
    userName: "",
    clientPublicIp: "",
    clientServerIp: "",
    oldComplaintID: form.hasOldComplaint === "yes" ? form.oldComplaintId : "",
  };
}
