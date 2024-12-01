import React from "react";
import { useNavigate } from "react-router-dom";

const Policies = () => {
    const navigate = useNavigate();
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Home Button */}
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Home
      </button>
      <h1>Policies</h1>

      {/* DMCA Section */}
      <section style={{ marginBottom: "30px" }}>
        <h2>DMCA Notice & Takedown Policy</h2>
        <p>
          Our Digital Millennium Copyright Act (DMCA) notice and takedown policy is publicly accessible.
        </p>
        <ul>
          <li>
            <a
              href="/dmca-notice"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              View DMCA Notice
            </a>
          </li>
          <li>
            Contact us for notices of infringement at:{" "}
            <a href="mailto:dmca@example.com" style={{ color: "blue", textDecoration: "underline" }}>
              dmca@example.com
            </a>
          </li>
        </ul>
      </section>

      {/* Acceptable Use Policy Section */}
      <section>
        <h2>Acceptable Use Policy (AUP)</h2>
        <p>
          Our Acceptable Use Policy (AUP) is publicly accessible to all users.
        </p>
        <ul>
          <li>
            <a
              href="/acceptable-use-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "blue", textDecoration: "underline" }}
            >
              View Acceptable Use Policy
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default Policies;
