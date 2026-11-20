import { useState } from "react";
import "./OtpVerification.css";

// Configure the URL in your .env file.
// Example: VITE_API_BASE_URL=http://localhost:8080/your-context-path/api
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

export default function OtpVerification() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const setNotice = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const readResponse = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  const handleMobileChange = (event) => {
    const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
    setMessage("");
    setMessageType("");
    // A new mobile number requires a new OTP request.
    setOtpRequested(false);
    setOtp("");
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setNotice("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setSendingOtp(true);

      const response = await fetch(`${API_BASE_URL}/otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await readResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to send OTP. Please try again.");
      }

      setOtpRequested(true);
      setOtp("");
      setNotice(
        data.message || "OTP request successful. Check your registered mobile.",
        "success"
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to connect to the server. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      setNotice("Enter a valid 10-digit mobile number.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setNotice("Enter the 6-digit OTP.");
      return;
    }

    try {
      setVerifyingOtp(true);

      const response = await fetch(`${API_BASE_URL}/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobileNumber, otp }),
      });

      const data = await readResponse(response);

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Invalid or expired OTP.");
      }

      setNotice("Mobile number verified successfully.", "success");

      // Change this route to the actual route for your grievance form.
      // Prefer server-issued session/token authentication for protected pages.
      window.location.assign("/grievance");
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="igrms-page">
      <div className="igrms-shell">
        <header className="igrms-header">
          <div className="igrms-emblem" aria-hidden="true">TG</div>
          <div className="igrms-heading">
            <h1>Integrated Grievance Redressal Monitoring System (IGRMS) for IMPDS</h1>
            <p>
              Department of Consumer Affairs, Food &amp; Civil Supplies,
              Government of Telangana
            </p>
          </div>
          <a className="home-btn" href="/">Home</a>
        </header>

        <section className="otp-card" aria-labelledby="otp-title">
          <h2 id="otp-title">Lodge Grievance</h2>

          <form className="otp-form" onSubmit={handleSendOtp}>
            <div className="otp-field">
              <label htmlFor="mobileNumber">Mobile Number<span>*</span></label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="Enter Mobile Number"
                value={mobileNumber}
                onChange={handleMobileChange}
                maxLength={10}
                required
                aria-describedby="mobile-help"
              />
              <small id="mobile-help">Enter your 10-digit mobile number.</small>
            </div>

            <button
              className="otp-button"
              type="submit"
              disabled={sendingOtp || verifyingOtp}
            >
              {sendingOtp ? "Sending..." : otpRequested ? "Resend OTP" : "Send OTP"}
            </button>

            <div className="otp-field">
              <label htmlFor="otp">Enter OTP<span>*</span></label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                disabled={!otpRequested || sendingOtp || verifyingOtp}
                required
              />
            </div>

            <button
              className="otp-button"
              type="button"
              onClick={handleVerifyOtp}
              disabled={!otpRequested || verifyingOtp || sendingOtp}
            >
              {verifyingOtp ? "Verifying..." : "Verify"}
            </button>
          </form>

          {message && (
            <p className={`otp-message ${messageType}`} role="status" aria-live="polite">
              {message}
            </p>
          )}
        </section>

        <footer className="igrms-footer">
          <strong className="nic-logo">NIC</strong>
          <p>
            Disclaimer: Content on this website is published and managed by
            Commissioner of Civil Supplies, Hyderabad.
          </p>
        </footer>
      </div>
    </div>
  );
}
