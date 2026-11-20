// src/RationCardMemberModal.js
import { useEffect } from "react";

// The popup of the live Lodge Grievance page: after a ration card number is entered and Tab is pressed, the family
// members returned by the RationCard API are listed, and Select fills the form with that member.
// members: the rcdetailslist of the RationCard response
//   [{ rationCardNo, address, membernames, memberage, gender, distcode, mandalcode, districtname, mandalname }]
export default function RationCardMemberModal({ members, onSelect, onClose }) {
  // Esc closes the popup
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const th = { background: "#5f8a4d", color: "#fff", padding: "6px 8px", border: "1px solid #333", textAlign: "center" };
  const td = { padding: "6px 8px", border: "1px solid #333", textAlign: "center" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ration card members"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ background: "#f8b93d", borderRadius: 6, padding: 14, width: "min(900px, 94vw)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Ration Card Members</div>

        <div style={{ overflow: "auto", background: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>Member Name</th>
                <th style={th}>Age</th>
                <th style={th}>Gender</th>
                <th style={th}>Address</th>
                <th style={th}>District</th>
                <th style={th}>Mandal</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr key={`${m.membernames}-${i}`}>
                  <td style={td}>{m.membernames}</td>
                  <td style={td}>{m.memberage}</td>
                  <td style={td}>{m.gender}</td>
                  <td style={td}>{m.address}</td>
                  <td style={td}>{m.districtname}</td>
                  <td style={td}>{m.mandalname}</td>
                  <td style={td}>
                    <button type="button" className="btn-submit" onClick={() => onSelect(m)}>
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 10 }}>
          <button type="button" className="btn-reset" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
