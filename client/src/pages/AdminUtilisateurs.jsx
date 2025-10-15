import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { People, ArrowLeft, Trophy, Star, Award } from "react-bootstrap-icons";
import { api } from '../api';

function AdminUtilisateurs({ admin, onBack, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les données depuis l'API
  useEffect(() => {
    const loadUsers = async () => {
      if (!admin?.token) return;
      
      setLoading(true);
      try {
        const response = await api.get('/admin/users-ranking', {
          headers: { Authorization: `Bearer ${admin.token}` }
        });
        
        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [admin?.token]);

  // Fonction pour obtenir l'icône du rang
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="text-warning" size={20} />;
    if (rank === 2) return <Award className="text-secondary" size={20} />;
    if (rank === 3) return <Award className="text-warning" size={20} />;
    return <span className="fw-bold text-muted">#{rank}</span>;
  };

  // Fonction pour obtenir la couleur du streak
  const getStreakColor = (streak) => {
    if (streak >= 120) return "#8b5cf6"; // Violet pour champion
    if (streak >= 90) return "#f59e0b";  // Orange pour expert
    if (streak >= 60) return "#10b981";  // Vert pour avancé
    if (streak >= 30) return "#3b82f6";  // Bleu pour intermédiaire
    if (streak >= 1) return "#6b7280";   // Gris pour débutant
    return "#ef4444";                    // Rouge pour nouveau
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        minHeight: "100dvh",
        paddingTop: "45rem", // ✅ Décalage du contenu vers le bas
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        overscrollBehaviorY: "contain"
      }}
    >
      <div className="container px-4">
        <div className="bg-white rounded-4 shadow-sm p-4 mb-4">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: "#1e293b" }}>
              <Trophy className="me-2 text-warning" />
              Classement des Utilisateurs
            </h5>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={onLogout}
            >
              Se déconnecter
            </button>
          </div>

          {/* Description */}
          <div className="text-muted mb-4 small">
            Classement par nombre de commandes consécutives
          </div>

          {/* Liste des utilisateurs */}
          <div className="d-grid gap-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-muted py-4">Aucun utilisateur trouvé</div>
            ) : (
              users.map((user, index) => (
                <div
                  key={user.id}
                  className="d-flex justify-content-between align-items-center bg-light p-3 rounded-4 shadow-sm"
                  style={{
                    borderLeft: `4px solid ${getStreakColor(user.streak_consecutif)}`
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      {getRankIcon(index + 1)}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ color: "#1e293b" }}>
                        {user.nom} {user.prenom}
                      </div>
                      <small className="text-muted">
                        {user.institut && user.parcours 
                          ? `${user.institut} - ${user.parcours}`
                          : user.institut || user.parcours || 'Non spécifié'
                        }
                      </small>
                      <div className="mt-1">
                        <span 
                          className="badge px-2 py-1"
                          style={{ 
                            backgroundColor: getStreakColor(user.streak_consecutif),
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        >
                          {user.niveau_badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div
                      className="fw-bold"
                      style={{
                        color: getStreakColor(user.streak_consecutif),
                        fontSize: "1.2rem"
                      }}
                    >
                      {user.streak_consecutif}
                    </div>
                    <small className="text-muted">commandes consécutives</small>
                    {user.dernier_achat_date && (
                      <div className="mt-1">
                        <small className="text-muted">
                          Dernier achat: {new Date(user.dernier_achat_date).toLocaleDateString('fr-FR')}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Statistiques globales */}
          {users.length > 0 && (
            <div className="mt-4 text-center">
              <div className="row">
                <div className="col-4">
                  <div className="text-muted small">Total utilisateurs</div>
                  <div className="fw-bold" style={{ color: "#1187ff" }}>
                    {users.length}
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-muted small">Meilleur streak</div>
                  <div className="fw-bold" style={{ color: "#10b981" }}>
                    {Math.max(...users.map(u => u.streak_consecutif))}
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-muted small">Streak moyen</div>
                  <div className="fw-bold" style={{ color: "#f59e0b" }}>
                    {Math.round(users.reduce((acc, u) => acc + u.streak_consecutif, 0) / users.length)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton retour */}
          <div className="text-center mt-4">
            <button
              className="btn btn-outline-primary px-5 py-2"
              onClick={onBack}
            >
              <ArrowLeft size={18} className="me-1" />
              Retour au Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUtilisateurs;
