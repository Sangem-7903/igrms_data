import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./FeedbackForm.css";
import "./home.css";


const FOOTER_TEXT =
  "Disclaimer: Content on this website is published and managed by Commissioner of Civil Supplies, Hyderabad.";
function FeedbackForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    interface: "",
    information: "",
    usefulness: "",
    navigation: "",
    response: "",
    feedback: "",
  });

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ||
      !/^[6-9]\d{9}$/.test(form.mobile) ||
      !form.interface ||
      !form.information ||
      !form.usefulness ||
      !form.navigation ||
      !form.response ||
      rating === 0 ||
      !form.feedback.trim()
    ) {
      setMessage("Please fill in all required fields correctly.");
      return;
    }

    // Connect your feedback submission API here if required.
    setMessage("Feedback submitted successfully!");

    setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);
  };

  const questions = [
    { name: "interface", label: "User Interface" },
    { name: "information", label: "Sufficient information available" },
    { name: "usefulness", label: "Usefulness of Web site" },
    { name: "navigation", label: "Navigations" },
    { name: "response", label: "Timely Response" },
  ];

  const options = ["Excellent", "Very Good", "Good", "Average"];

  const hideBroken = (e) => (e.target.style.display = "none");
const img = (name) => `${process.env.PUBLIC_URL}/${name}`;
  return (
    <div className="feedback-page igrms-page">
      <header className="igrms-header feedback-header">
<img className="emblem" src={img("emblem.png")} alt="Government of Telangana" onError={hideBroken} />
        <div className="igrms-titles">
          <h1>
            Integrated Grievance Redressal Monitoring System (IGRMS) for IMPDS
          </h1>
          <p>
            Department of Consumer Affairs, Food &amp; Civil Supplies,
            GOVERNMENT OF TELANGANA
          </p>
        </div>

        <button
          type="button"
          className="feedback-home-btn"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </header>

      <div className="feedback-page-title">FeedBack Form</div>

      <main className="feedback-content">
        <form className="feedback-form" onSubmit={handleSubmit}>
          <h2>FeedBack Form</h2>

          <div className="feedback-field">
            <label htmlFor="feedback-name">Your Name*</label>
            <input
              id="feedback-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter Your Name"
              required
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-email">Email*</label>
            <input
              id="feedback-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ex:your_email@domain.com"
              required
            />
          </div>

          <div className="feedback-field">
            <label htmlFor="feedback-mobile">Mobile Number*</label>
            <input
              id="feedback-mobile"
              name="mobile"
              type="tel"
              maxLength={10}
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter Mobile Number"
              pattern="[6-9][0-9]{9}"
              required
            />
          </div>

          {questions.map((question) => (
            <fieldset className="rating-question" key={question.name}>
              <legend>{question.label}*</legend>

              <div className="rating-options">
                {options.map((option) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={question.name}
                      value={option}
                      checked={form[question.name] === option}
                      onChange={handleChange}
                      required
                    />
                    {option}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="overall-rating">
            <label>overallRating*</label>
            <div className="star-rating" aria-label="Overall rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= rating ? "star selected" : "star"}
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={rating === star}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="feedback-field feedback-message-field">
            <label htmlFor="feedback-comments">Your feedback*</label>
            <textarea
              id="feedback-comments"
              name="feedback"
              value={form.feedback}
              onChange={handleChange}
              placeholder="Type here..."
              rows={4}
              required
            />
          </div>

          {message && (
            <p
              className={
                message.includes("successfully")
                  ? "feedback-message success"
                  : "feedback-message error"
              }
              role="status"
            >
              {message}
            </p>
          )}

          <button type="submit" className="feedback-submit">
            SUBMIT
          </button>
        </form>
      </main>

        <footer className="igrms-footer">
        <img className="nic-logo" src={img("nic-logo.png")} alt="National Informatics Centre" onError={hideBroken} />
        <span>{FOOTER_TEXT}</span>
      </footer>
    </div>
  );
}

export default FeedbackForm;