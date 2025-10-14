import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { EyeFill, EyeSlashFill, EnvelopeFill, LockFill } from "react-bootstrap-icons";

export default function LoginScreen({ onLogin, onRegister }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      if (onLogin) {
        await onLogin(formData);
      }
    } catch (error) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4"
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Formulaire */}
      <div className="w-100" style={{ maxWidth: "420px" }}>
        {/* Titre */}
        <div className="text-center mb-5">
          <h1 className="text-white mb-3" style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
            Bienvenue 👋
          </h1>
          <p className="text-white mb-0" style={{ fontSize: "1.05rem", opacity: 0.9 }}>
            Connectez-vous pour continuer
          </p>
        </div>

        {error && (
          <div className="alert alert-danger text-center mb-3" style={{ borderRadius: "12px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <div className="d-flex align-items-center position-relative" style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              transition: "all 0.3s"
            }}>
              <EnvelopeFill 
                className="text-secondary ms-3" 
                style={{ 
                  fontSize: "1.1rem",
                  opacity: 0.6
                }} 
              />
              <input
                type="email"
                className="form-control border-0 bg-transparent"
                placeholder="Adresse e-mail"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ 
                  fontSize: "1rem",
                  padding: "1rem 1rem 1rem 0.75rem",
                  color: "#333",
                  outline: "none",
                  boxShadow: "none"
                }}
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="mb-4">
            <div className="d-flex align-items-center" style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              transition: "all 0.3s"
            }}>
              <LockFill 
                className="text-secondary ms-3" 
                style={{ 
                  fontSize: "1.1rem",
                  opacity: 0.6
                }} 
              />
              <input
                type="password"
                className="form-control border-0 bg-transparent"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={{ 
                  fontSize: "1rem",
                  padding: "1rem 0.75rem",
                  color: "#333",
                  outline: "none",
                  boxShadow: "none"
                }}
              />
            </div>
          </div>

          {/* Mot de passe oublié */}
          <div className="text-end mb-4">
            <a 
              href="#" 
              className="text-white text-decoration-none"
              style={{ 
                fontSize: "0.9rem",
                fontWeight: 500,
                opacity: 0.9
              }}
            >
              Mot de passe oublié ?
            </a>
          </div>

          {/* Bouton connexion */}
          <button
            type="submit"
            className="btn text-white w-100 border-0"
            disabled={loading}
            style={{
              backgroundColor: "#000",
              borderRadius: "12px",
              fontSize: "1.05rem",
              padding: "1rem",
              fontWeight: 600,
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              transition: "all 0.3s",
              transform: loading ? "scale(0.98)" : "scale(1)"
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = "translateY(-2px)")}
            onMouseOut={(e) => !loading && (e.target.style.transform = "translateY(0)")}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Connexion en cours...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Lien inscription */}
          <div className="text-center mt-4">
            <span className="text-white" style={{ fontSize: "0.95rem", opacity: 0.9 }}>
              Pas encore de compte ?{" "}
            </span>
            <button
              type="button"
              onClick={onRegister}
              className="btn btn-link p-0 text-white border-0 fw-semibold"
              style={{ textDecoration: "none", fontSize: "0.95rem" }}
            >
              S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}