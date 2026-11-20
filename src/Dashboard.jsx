import React from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "./App";

export function DashboardPage({ extraContent }) {
  const username = sessionStorage.getItem("igrms_username") || "";
  const role = sessionStorage.getItem("igrms_role") || "";

  return (
    <Layout admin>
      <div className="igrms-card">
        <div className="card-title">Dashboard</div>
        <div className="home-body">
          <p>
            Welcome, <strong>{username}</strong> (Role: <strong>{role}</strong>)
          </p>
        </div>
      </div>

      {/* Renders the extra content table for PMU / DSO */}
      {extraContent}
    </Layout>
  );
}

// Ensure the 'export' keyword is present here:
export function RequireAdmin({ children }) {
  const isAdmin = sessionStorage.getItem("igrms_admin") === "1";
  return isAdmin ? children : <Navigate to="/" replace />;
}