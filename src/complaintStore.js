// src/complaintStore.js
const STORAGE_KEY = "igrms_local_complaints";

// Default seed data matching your sample screenshots
const DEFAULT_COMPLAINTS = [
  {
    complaintId: "26024194",
    mobile: "9381353334",
    submittedAt: "2026-10-26T11:41:00.000Z",
    details: {
      complaintSource: "Call Center",
      complaineeType: "Shop Dealer",
      grievanceType: "Quality of Service by FPS dealer",
      grievanceSubject: "Behaviour",
      fpShopNo: "476585",
      rationCardExists: "N",
      rationCardNo: "",
      description: "From India",
      name: "Yuva Teja",
      gender: "Male",
      email: "yuva09.teja@yahoo.org",
      district: "Karimnagar",
      mandal: "GANGADHARA",
      village: "",
      address: "Near PVNR Park KPHB 6Th Phase Kukatpally",
      pincode: "500085",
    },
    history: [
      {
        complaintId: "26024194",
        disposalType: "Entry",
        actionFromUser: "ASO TAHR",
        forwardToUser: "",
        forwardDistrict: "",
        forwardMandal: "",
        remarks: "",
        entryDate: "2026-10-26T11:41:00.000Z",
      },
    ],
  },
];

export function getAllSubmissions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COMPLAINTS));
      return DEFAULT_COMPLAINTS;
    }
    return JSON.parse(data);
  } catch {
    return DEFAULT_COMPLAINTS;
  }
}

export function saveSubmission(record) {
  try {
    const list = getAllSubmissions();
    const existingIndex = list.findIndex((r) => r.complaintId === record.complaintId);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to save complaint to local storage", e);
  }
}

export function findByComplaintNo(complaintNo) {
  const list = getAllSubmissions();
  return list.find((r) => String(r.complaintId) === String(complaintNo)) || null;
}

export function findByMobile(mobileNo) {
  const list = getAllSubmissions();
  return list.filter((r) => String(r.mobile) === String(mobileNo));
}