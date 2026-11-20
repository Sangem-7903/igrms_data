// src/App.js
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import "./GrievanceForm.css"; // the lodge-grievance form pages
import "./home.css"; // the front page and the report pages (scoped to .home-page)
import { DISTRICT_REPORT } from "./districtReportData";
import { saveSubmission, findByComplaintNo, findByMobile } from "./complaintStore";
import FeedbackForm from "./FeedbackForm";
import { RequireAdmin, DashboardPage } from "./Dashboard";
import ComplianeeTypeMaster from "./ComplianeeTypeMaster"; // NEW: Masters > Complianee Type (admin)
// ---- Shared header + footer ----
const FOOTER_TEXT =
  "Disclaimer: Content on this website is published and managed by Commissioner of Civil Supplies, Hyderabad.";

const hideBroken = (e) => (e.target.style.display = "none");
const img = (name) => `${process.env.PUBLIC_URL}/${name}`;

// home = front page (Telangana Rising logo, partner logos).  nav = menu bar only (report pages).
// admin = logged-in admin pages: horizontal menu Home / Grievance Entry Form / Reports / Masters / LogOut
export function Layout({ children, home = false, nav = false, admin = false }) {
  const navigate = useNavigate();
  const portal = home || nav || admin;
  const isAdmin = sessionStorage.getItem("igrms_admin") === "1";
  const logout = () => {
    sessionStorage.removeItem("igrms_admin");
    navigate("/", { replace: true });
  };
  return (
    <div className={`igrms-page ${portal ? "home-page" : ""}`}>
      <header className="igrms-header">
        <img className="emblem" src={img("emblem.png")} alt="Government of Telangana" onError={hideBroken} />
        <div className="igrms-titles">
          <h1>
            Integrated <span className="cap">G</span>rievance <span className="cap">R</span>edressal{" "}
            <span className="cap">M</span>onitoring <span className="cap">S</span>ystem(
            <span className="cap">IGRMS</span>) for impds
          </h1>
          <p>Department of Consumer affairs, food &amp; civil supplies, GOVERNMENT OF TELANGANA</p>
        </div>
        {home ? (
          <img className="rising-logo" src={img("telangana-rising.png")} alt="Telangana Rising" onError={hideBroken} />
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
              <Link to="/reports">Reports</Link>
              <Link to="/masters/complainee-type">Masters</Link>
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
        <img className="nic-logo" src={img("nic-logo.png")} alt="National Informatics Centre" onError={hideBroken} />
        <span>{FOOTER_TEXT}</span>
      </footer>
    </div>
  );
}
