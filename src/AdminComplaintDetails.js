// src/AdminComplaintDetails.js
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "./App";
import ComplaintView from "./ComplaintView";

// Open it from a report with /reports/complaint?no=<complaint number>, or type the number in the box.
const btn = { color: "#fff", border: 0, borderRadius: 4, padding: "9px 22px", cursor: "pointer", fontWeight: 600 };

export default function AdminComplaintDetails() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const complaintNo = params.get("no") || "";
  const [input, setInput] = useState(complaintNo);
  const [error, setError] = useState("");

  useEffect(() => {
    setInput(complaintNo);
  }, [complaintNo]);

  const search = (e) => {
    e.preventDefault();
    const no = input.trim();
    if (!/^\d{4,12}$/.test(no)) return setError("Enter a valid complaint number");
    setError("");
    setParams({ no });
  };

  return (
    <Layout admin>
      <div className="igrms-card no-print">
        <form onSubmit={search} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", flexWrap: "wrap" }} noValidate>
          <label className="field-label" style={{ margin: 0 }}>Complaint No</label>
          <input
            style={{ width: 200, height: 36 }}
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))}
            maxLength={12}
            inputMode="numeric"
            placeholder="Enter Complaint No."
          />
          <button type="submit" style={{ ...btn, background: "#337ab7" }}>Show</button>
        </form>
        {error && <div className="banner fail">{error}</div>}
      </div>
      <ComplaintView complaintNo={complaintNo} onBack={() => navigate(-1)} />
    </Layout>
  );
}
