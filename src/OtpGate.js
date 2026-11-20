function OtpGate({ onVerified }) {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const post = async (path, payload) => {
    const res = await fetch(`${OTP_URL}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  };

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setMsg({ ok: false, text: "Enter a valid 10-digit mobile number" });
      return;
    }
    try {
      setBusy(true);
      await post("send", { mobileNumber: mobile });
      setOtp("");
      setOtpSent(true);
      setMsg({ ok: true, text: "OTP sent to your mobile number" });
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
      const data = await post("verify", { mobileNumber: mobile, otp });
      onVerified({ mobile, token: data.token });
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
      {msg && <div className={`banner ${msg.ok ? "ok" : "fail"}`} role="status">{msg.text}</div>}
      <div className="otp-row">
        <label className="field-label">Mobile Number<span className="req">*</span></label>
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && !otpSent && sendOtp()}
          maxLength={10}
          inputMode="numeric"
          placeholder="Enter Mobile Number"
          disabled={otpSent}
        />
        <button type="button" className="btn-submit" onClick={sendOtp} disabled={busy}>
          {otpSent ? "Resend OTP" : "Send OTP"}
        </button>

        <label className="field-label">Enter OTP<span className="req">*</span></label>
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