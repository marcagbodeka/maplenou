import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function WelcomeScreen({ onLogin, onRegister }) {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center min-vh-100 text-center"
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        fontFamily: "Inter, sans-serif",
        color: "white",
      }}
    >
      {/* Logo */}
      <div
        className="d-flex justify-content-center align-items-center rounded-4 mb-4"
        style={{
          width: "96px",
          height: "96px",
          background: "rgba(255,255,255,0.12)",
          boxShadow: "inset 0 -6px 18px rgba(255,255,255,0.02)",
        }}
      >
        {/* Croissant SVG */}
        <svg
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
        >
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="1" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M8 34c1.6-6.8 10.5-19.8 28-18 11 1.2 18.8 9 23 18 0 0-7.6-7.2-18-8-6.8-.6-17 2.6-25 8z"
            fill="url(#g)"
          />
          <path
            d="M12 38c3-4 12-12 28-10 8 1.1 17 6.3 22 10-4-3-10-6-18-6-12 0-22 5-32 6z"
            fill="rgba(255,255,255,0.9)"
          />
          <path
            d="M16 28c5 0 10-4 18-6"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Texte */}
      <h1 className="fw-bold text-white fs-2 mb-1">Maplénou</h1>
      <p className="text-white-50 mb-5">
        Commandez, savourez, recommencez
      </p>

      {/* Boutons */}
      <div className="d-grid gap-3 w-100 px-4" style={{ maxWidth: "360px" }}>
        <button
          className="btn fw-semibold py-2"
          style={{
            background: "white",
            color: "#0b2a4a",
            borderRadius: "999px",
            boxShadow: "0 10px 24px rgba(17,135,255,0.2)",
          }}
          onClick={onLogin}
        >
          Se connecter
        </button>

        <button
          className="btn fw-semibold py-2 border-2"
          style={{
            background: "transparent",
            borderColor: "rgba(255,255,255,0.4)",
            color: "white",
            borderRadius: "999px",
          }}
          onClick={onRegister}
        >
          S'inscrire
        </button>
      </div>
    </div>
  );
}
