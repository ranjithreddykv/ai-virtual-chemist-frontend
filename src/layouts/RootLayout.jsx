// src/layouts/RootLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import AITutorWidget from "../components/AITutorWidget";

export default function RootLayout() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white" }}>
      {/* You can place navbar/header here */}
      {/* <Navbar /> */}

      <main style={{ padding: "16px" }}>
        <Outlet />
      </main>

      {/* AI Tutor is ALWAYS mounted */}
      <AITutorWidget />
    </div>
  );
}
