import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BoxSeam, Cart, People, CashCoin, Calendar3 } from "react-bootstrap-icons";
import { api } from "../api";
import AdminAllocations from "./AdminAllocations.jsx";
import AdminUtilisateurs from "./AdminUtilisateurs.jsx";

function AdminDashboard({ admin, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currentView, setCurrentView] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    chiffreAffaires: 0,
    produit: {
      nom: "Croissant Premium",
      prix: 500,
      statut: "actif",
      acceptedOrders: 0,
      totalAllocations: 0,
      image: "🥐",
    },
    vendeurs: [],
  });

  useEffect(() => {
    const loadData = async () => {
      if (!admin?.token) return;

      setLoading(true);
      try {
        const revenueResponse = await api.get(`/admin/revenue/${selectedDate}`, {
          headers: { Authorization: `Bearer ${admin.token}` },
        });

        const productResponse = await api.get(`/admin/product-stats/${selectedDate}`, {
          headers: { Authorization: `Bearer ${admin.token}` },
        });

        const vendorsResponse = await api.get(`/admin/vendors-stats/${selectedDate}`, {
          headers: { Authorization: `Bearer ${admin.token}` },
        });

        setStats((prev) => ({
          ...prev,
          chiffreAffaires: revenueResponse.data.revenue || 0,
          produit: {
            ...prev.produit,
            acceptedOrders: productResponse.data.acceptedOrders || 0,
            totalAllocations: productResponse.data.totalAllocations || 0,
          },
          vendeurs: vendorsResponse.data.vendors || [],
        }));
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate, admin?.token]);

  const pourcentageStock =
    stats.produit.totalAllocations > 0
      ? ((stats.produit.acceptedOrders / stats.produit.totalAllocations) * 100).toFixed(1)
      : 0;

  const handleNavigation = (view) => setCurrentView(view);
  const handleBack = () => setCurrentView("dashboard");

  if (currentView === "allocations")
    return <AdminAllocations admin={admin} onBack={handleBack} onLogout={onLogout} />;
  if (currentView === "users")
    return <AdminUtilisateurs admin={admin} onBack={handleBack} onLogout={onLogout} />;

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        minHeight: "100dvh",
        paddingTop: "15rem",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain",
        position: "relative",
      }}
    >
      <div className="px-4">
        {/* 🔹 Filtres et résumé général */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
            <h5 className="fw-bold mb-3 mb-md-0" style={{ color: "#1e293b" }}>
              Résumé de la journée
            </h5>
            <div className="d-flex align-items-center bg-light rounded-3 px-3 py-2">
              <Calendar3 size={18} className="text-primary me-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-control border-0 bg-transparent p-0"
                style={{ fontSize: "0.9rem", width: "auto" }}
              />
            </div>
          </div>

          {/* Chiffre d'affaires */}
          <div className="bg-primary text-white rounded-4 p-4 d-flex flex-column justify-content-center shadow-sm">
            <div className="d-flex align-items-center mb-2">
              <CashCoin size={22} className="me-2" />
              <h6 className="mb-0" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                CHIFFRE D’AFFAIRES
              </h6>
            </div>
            <h3 className="fw-bold mb-0">{stats.chiffreAffaires.toLocaleString()} FCFA</h3>
          </div>
        </div>

        {/* 🔸 Produit du jour */}
        <div className="col-12 mb-3">
          <div className="bg-white rounded-4 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <h6
                  className="text-muted mb-2"
                  style={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  PRODUIT DU JOUR
                </h6>
                <div className="d-flex align-items-center">
                  <span style={{ fontSize: "2rem" }} className="me-2">
                    {stats.produit.image}
                  </span>
                  <div>
                    <h4 className="mb-0 fw-bold" style={{ color: "#1e293b" }}>
                      {stats.produit.nom}
                    </h4>
                    <div className="text-muted">{stats.produit.prix} FCFA</div>
                  </div>
                </div>
              </div>
              <div className="text-end">
                <span
                  className={`badge px-3 py-2 ${
                    stats.produit.statut === "actif" ? "bg-success" : "bg-secondary"
                  }`}
                  style={{ fontSize: "0.85rem" }}
                >
                  {stats.produit.statut === "actif" ? "● Actif" : "● Pause"}
                </span>
              </div>
            </div>

            {/* Barre de stock */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Commandes acceptées</span>
                <span className="fw-bold" style={{ color: "#1187ff", fontSize: "1.1rem" }}>
                  {stats.produit.acceptedOrders} / {stats.produit.totalAllocations}
                </span>
              </div>
              <div className="position-relative">
                <div
                  className="w-100 rounded-pill"
                  style={{ height: "10px", backgroundColor: "#e9ecef" }}
                >
                  <div
                    className="rounded-pill h-100"
                    style={{
                      width: `${pourcentageStock}%`,
                      background:
                        pourcentageStock > 50
                          ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                          : pourcentageStock > 20
                          ? "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)"
                          : "linear-gradient(90deg, #ef4444 0%, #f87171 100%)",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
              <div className="text-center mt-2">
                <small className="text-muted">{pourcentageStock}% restant</small>
              </div>
            </div>
          </div>
        </div>

        {/* 🔸 Liste des vendeurs avec scroll */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
          <h6 className="fw-bold mb-3" style={{ color: "#1e293b" }}>
            🧾 Liste des Vendeurs
          </h6>
          <div 
            className="d-grid gap-2"
            style={{
              maxHeight: "40vh",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain"
            }}
          >
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : stats.vendeurs.length === 0 ? (
              <div className="text-center text-muted py-3">Aucun vendeur trouvé</div>
            ) : (
              stats.vendeurs.map((vendeur) => (
                <div
                  key={vendeur.id}
                  className="d-flex align-items-center justify-content-between p-3 rounded-3"
                  style={{ backgroundColor: "#f8fafc" }}
                >
                  <div>
                    <div className="fw-medium" style={{ color: "#1e293b" }}>
                      {vendeur.nom} {vendeur.prenom}
                    </div>
                    <small className="text-muted">
                      {vendeur.institut} - {vendeur.parcours}
                    </small>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold" style={{ color: "#1187ff" }}>
                      {vendeur.accepted_orders} / {vendeur.stock_alloue}
                    </div>
                    <small className="text-muted">commandes acceptées</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 🔹 Actions rapides */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
          <h6 className="fw-bold mb-3" style={{ color: "#1e293b" }}>
            Actions Rapides
          </h6>
          <div className="row g-2">
            <div className="col-6">
              <button
                className="btn btn-outline-primary w-100 py-3 rounded-3"
                onClick={() => handleNavigation("allocations")}
              >
                <People size={20} className="mb-1" />
                <div className="small">Allocations</div>
              </button>
            </div>
            <div className="col-6">
              <button
                className="btn btn-outline-primary w-100 py-3 rounded-3"
                onClick={() => handleNavigation("users")}
              >
                <Cart size={20} className="mb-1" />
                <div className="small">Utilisateurs</div>
              </button>
            </div>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <div className="text-center">
          <button
            className="btn btn-outline-light text-white px-5 py-2"
            onClick={onLogout}
            style={{ fontSize: "1rem", borderRadius: "12px", fontWeight: 500 }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
