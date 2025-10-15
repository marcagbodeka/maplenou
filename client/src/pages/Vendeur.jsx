import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { CheckCircle, XCircle, Calendar3, BoxArrowRight } from "react-bootstrap-icons";
import { api } from "../api";

function VendeurInterface({ vendeur, onLogout }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [commandes, setCommandes] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Charger les commandes en attente
  useEffect(() => {
    const loadOrders = async () => {
      if (!vendeur?.id) return;
      
      try {
        setLoading(true);
        const response = await api.get(`/orders/vendor/${vendeur.id}`, {
          headers: { Authorization: `Bearer ${vendeur.token}` }
        });
        
        if (response.data.success) {
          setCommandes(response.data.orders);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
        setMessage('Erreur lors du chargement des commandes');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [vendeur]);

  const handleAccepter = async (id) => {
    try {
      setLoading(true);
      const response = await api.put(`/orders/${id}/process`, { action: 'accept' }, {
        headers: { Authorization: `Bearer ${vendeur.token}` }
      });

      if (response.data.success) {
        // Retirer la commande de la liste (elle est maintenant traitée)
        setCommandes(prev => prev.filter(c => c.id !== id));
        const commande = commandes.find(c => c.id === id);
        setMessage(`✅ Commande de ${commande?.client_nom} ${commande?.client_prenom} traitée avec succès !`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la commande:', error);
      setMessage('Erreur lors du traitement de la commande');
    } finally {
      setLoading(false);
    }
  };

  const handleRefuser = async (id) => {
    try {
      setLoading(true);
      const response = await api.put(`/orders/${id}/process`, { action: 'reject' }, {
        headers: { Authorization: `Bearer ${vendeur.token}` }
      });

      if (response.data.success) {
        // Retirer la commande de la liste (elle est maintenant refusée)
        setCommandes(prev => prev.filter(c => c.id !== id));
        const commande = commandes.find(c => c.id === id);
        setMessage(`❌ Commande de ${commande?.client_nom} ${commande?.client_prenom} refusée !`);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error('Erreur lors du refus de la commande:', error);
      setMessage('Erreur lors du refus de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les commandes par date (format YYYY-MM-DD)
  const commandesFiltrees = commandes.filter(c => {
    const commandDate = new Date(c.date_commande).toISOString().split('T')[0];
    return commandDate === selectedDate;
  });

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        minHeight: "100dvh",
        paddingTop: "6rem",
        paddingBottom: "3rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div className="container px-4 flex-grow-1">
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
          <h5 className="fw-bold mb-3" style={{ color: "#1e293b" }}>
            🛒 Commandes à traiter
          </h5>

          {/* Filtre par date */}
          <div className="d-flex align-items-center mb-3">
            <Calendar3 size={20} className="me-2 text-primary" />
            <input
              type="date"
              className="form-control w-auto"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Liste des commandes */}
          <div className="d-grid gap-3 mb-3">
            {loading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : commandesFiltrees.length === 0 ? (
              <div className="text-center text-muted">Aucune commande en attente pour cette date.</div>
            ) : (
              commandesFiltrees.map((commande) => (
                <div
                  key={commande.id}
                  className="d-flex flex-column justify-content-between bg-light p-3 rounded-4 shadow-sm"
                  style={{ minHeight: "100px" }}
                >
                  {/* Informations du client */}
                  <div>
                    <div className="fw-bold" style={{ color: "#1e293b" }}>
                      {commande.client_nom} {commande.client_prenom}
                    </div>
                    <small className="text-muted">
                      {commande.client_institut} - {commande.client_parcours}
                    </small>
                    <div className="mt-1">
                      <small className="text-muted">
                        {new Date(commande.date_commande).toLocaleString('fr-FR')}
                      </small>
                    </div>
                  </div>

                  {/* Boutons en bas */}
                  <div className="mt-3 d-flex gap-2">
                    <button
                      className="btn btn-success btn-sm flex-grow-1"
                      onClick={() => handleAccepter(commande.id)}
                      disabled={loading}
                    >
                      <CheckCircle className="me-1" /> Accepter
                    </button>
                    <button
                      className="btn btn-danger btn-sm flex-grow-1"
                      onClick={() => handleRefuser(commande.id)}
                      disabled={loading}
                    >
                      <XCircle className="me-1" /> Refuser
                    </button>
                  </div>

                  {/* Quantité et prix */}
                  <div className="mt-2 d-flex justify-content-between">
                    <small className="text-muted">{commande.quantite} croissant(s)</small>
                    <small className="fw-bold text-primary">{commande.prix_total} FCFA</small>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message de confirmation */}
          {message && (
            <div
              className="alert alert-info rounded-3 text-center py-2 mt-3"
              style={{ fontSize: "0.9rem" }}
            >
              {message}
            </div>
          )}
        </div>

        {/* Bouton Déconnexion en bas */}
        <div className="text-center mt-auto">
          <button
            className="btn btn-outline-light text-white px-5 py-2"
            onClick={onLogout}
            style={{ fontSize: "1rem", borderRadius: "12px", fontWeight: 500 }}
          >
            <BoxArrowRight className="me-1" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default VendeurInterface;
