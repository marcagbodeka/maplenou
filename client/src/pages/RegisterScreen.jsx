import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { PersonFill, EnvelopeFill, TelephoneFill, BuildingFill, LockFill, ArrowLeft } from "react-bootstrap-icons";

function RegisterScreen({ onRegister, onLogin }) {
  const [step, setStep] = useState(1); // Étape 1 ou 2
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    telephone: "",
    email: "",
    institut: "",
    parcours: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    // Validation étape 1
    if (!formData.prenom || !formData.nom || !formData.telephone || !formData.email) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation étape 2
    if (!formData.institut || !formData.parcours || !formData.password || !formData.confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      if (onRegister) {
        await onRegister(formData);
      }
    } catch (error) {
      setError("Erreur lors de l'inscription");
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
        {/* Bouton retour */}
        <button
          onClick={() => step === 1 ? onLogin() : setStep(1)}
          className="btn btn-link text-white text-decoration-none p-0 mb-3"
          style={{ fontSize: "0.95rem" }}
        >
          <ArrowLeft className="me-2" />
          Retour
        </button>

        {/* Titre */}
        <div className="text-center mb-4">
          <h1 className="text-white mb-2" style={{ fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.5px" }}>
            {step === 1 ? "Créer un compte" : "Finaliser"}
          </h1>
          <p className="text-white mb-0" style={{ fontSize: "1rem", opacity: 0.9 }}>
            {step === 1 ? "Étape 1 sur 2 - Informations personnelles" : "Étape 2 sur 2 - Sécurité"}
          </p>
        </div>

        {/* Indicateur d'étapes */}
        <div className="d-flex gap-2 mb-4">
          <div style={{
            flex: 1,
            height: "4px",
            backgroundColor: "rgba(255,255,255,0.9)",
            borderRadius: "2px"
          }}></div>
          <div style={{
            flex: 1,
            height: "4px",
            backgroundColor: step === 2 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
            borderRadius: "2px"
          }}></div>
        </div>

        {error && (
          <div className="alert alert-danger text-center mb-3" style={{ borderRadius: "12px" }}>
            {error}
          </div>
        )}

        {/* ÉTAPE 1 */}
        {step === 1 && (
          <form onSubmit={handleNextStep}>
            {/* Prénom */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <PersonFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="text"
                  name="prenom"
                  className="form-control border-0 bg-transparent"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Nom */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <PersonFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="text"
                  name="nom"
                  className="form-control border-0 bg-transparent"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <TelephoneFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="tel"
                  name="telephone"
                  className="form-control border-0 bg-transparent"
                  placeholder="Numéro de téléphone"
                  value={formData.telephone}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <EnvelopeFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="email"
                  name="email"
                  className="form-control border-0 bg-transparent"
                  placeholder="Adresse e-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Bouton suivant */}
            <button
              type="submit"
              className="btn text-white w-100 border-0"
              style={{
                backgroundColor: "#000",
                borderRadius: "12px",
                fontSize: "1.05rem",
                padding: "1rem",
                fontWeight: 600,
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
              }}
            >
              Suivant
            </button>
          </form>
        )}

        {/* ÉTAPE 2 */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {/* Institut */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <BuildingFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <select
                  name="institut"
                  className="form-select border-0 bg-transparent"
                  value={formData.institut}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: formData.institut ? "#333" : "#999", outline: "none", boxShadow: "none" }}
                >
                  <option value="">Sélectionnez votre institut</option>
                  <option value="ISSJ">ISSJ</option>
                  <option value="ISEG">ISEG</option>
                  <option value="ESI/DGI">ESI/DGI</option>
                  <option value="HEC">HEC</option>
                  <option value="IAEC">IAEC</option>
                </select>
              </div>
            </div>

            {/* Parcours */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <BuildingFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <select
                  name="parcours"
                  className="form-select border-0 bg-transparent"
                  value={formData.parcours}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: formData.parcours ? "#333" : "#999", outline: "none", boxShadow: "none" }}
                >
                  <option value="">Sélectionnez votre parcours</option>
                  <option value="Licence 1">Licence 1</option>
                  <option value="Licence 2">Licence 2</option>
                  <option value="Licence 3">Licence 3</option>
                  <option value="Master 1">Master 1</option>
                  <option value="Master 2">Master 2</option>
                  <option value="Doctorat">Doctorat</option>
                </select>
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-3">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <LockFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="password"
                  name="password"
                  className="form-control border-0 bg-transparent"
                  placeholder="Mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div className="mb-4">
              <div className="d-flex align-items-center" style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)"
              }}>
                <LockFill className="text-secondary ms-3" style={{ fontSize: "1.1rem", opacity: 0.6 }} />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control border-0 bg-transparent"
                  placeholder="Confirmer le mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ fontSize: "1rem", padding: "1rem 0.75rem", color: "#333", outline: "none", boxShadow: "none" }}
                />
              </div>
            </div>

            {/* Bouton créer le compte */}
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
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
              }}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Création en cours...
                </span>
              ) : (
                "Créer mon compte"
              )}
            </button>
          </form>
        )}

        {/* Lien connexion */}
        <div className="text-center mt-4">
          <span className="text-white" style={{ fontSize: "0.95rem", opacity: 0.9 }}>
            Vous avez déjà un compte ?{" "}
          </span>
          <button
            type="button"
            onClick={onLogin}
            className="btn btn-link p-0 text-white border-0 fw-semibold"
            style={{ textDecoration: "none", fontSize: "0.95rem" }}
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterScreen;