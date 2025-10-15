import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Cart, Clock, PersonCircle } from "react-bootstrap-icons";
import { api } from "../api";

export default function ProductDetailScreen({ user, onLogout }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('');
  const [hasPendingOrder, setHasPendingOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [displayUser, setDisplayUser] = useState({ prenom: user?.prenom, nom: user?.nom });
  
  // Données de progression réelles
  const [orderStats, setOrderStats] = useState({
    consecutiveOrders: 0, // Commandes consécutives
    maxOrders: 120, // Maximum de commandes pour le dernier badge
    currentLevel: 0, // Niveau actuel basé sur les commandes consécutives
    badges: [
      { id: 1, name: "Débutant", threshold: 30, earned: false, icon: "🌱" },
      { id: 2, name: "Régulier", threshold: 60, earned: false, icon: "⭐" },
      { id: 3, name: "Expert", threshold: 90, earned: false, icon: "🏆" },
      { id: 4, name: "Master", threshold: 120, earned: false, icon: "👑" }
    ]
  });

  // Calculer le pourcentage basé sur les commandes consécutives / 120
  const progressPercentage = (orderStats.consecutiveOrders / orderStats.maxOrders) * 100;

  // Calculer le temps restant de la session
  useEffect(() => {
    const updateSessionTime = () => {
      try {
        const sessionExpiry = localStorage.getItem('maplenou_session_expiry');
        if (sessionExpiry) {
          const now = new Date().getTime();
          const expiryTime = parseInt(sessionExpiry);
          const timeLeft = expiryTime - now;
          
          if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            setSessionTimeLeft(`${hours}h ${minutes}m`);
          } else {
            setSessionTimeLeft('Expirée');
          }
        }
      } catch (error) {
        console.error('Erreur calcul session:', error);
      }
    };

    updateSessionTime();
    const interval = setInterval(updateSessionTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Charger les données réelles
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les informations du produit
        const productResponse = await api.get('/product');
        if (productResponse.data.success) {
      setProduct({
            ...productResponse.data.data,
            image: "🥐" // Conserver l'emoji croissant
          });
        }

        // Charger le stock restant pour l'utilisateur
        const stockResponse = await api.get('/orders/stock-remaining', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (stockResponse.data.success) {
          setProduct(prev => ({
            ...prev,
            stock: stockResponse.data.stock || 0
          }));
        }

        // Vérifier s'il y a une commande en attente
        const pendingResponse = await api.get('/orders/pending', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (pendingResponse.data.success) {
          setHasPendingOrder(pendingResponse.data.hasPendingOrder);
          setPendingOrder(pendingResponse.data.order);
        }

        // Charger les données de progression de l'utilisateur depuis la base de données
        let userProgression = {
          consecutiveOrders: user?.streak_consecutif || 0,
          maxOrders: 120
        };

        // Récupérer les données utilisateur mises à jour depuis l'API
        try {
          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          
          if (userResponse.data.success) {
            const userData = userResponse.data.user;
            userProgression = {
              consecutiveOrders: userData.streak_consecutif || 0,
              maxOrders: 120
            };
            console.log('Données utilisateur mises à jour:', userData);
            setDisplayUser({ prenom: userData.prenom, nom: userData.nom });
          }
        } catch (error) {
          console.error('Erreur lors du chargement des données utilisateur:', error);
        }

        // Calculer les badges gagnés
        const updatedBadges = orderStats.badges.map(badge => ({
          ...badge,
          earned: userProgression.consecutiveOrders >= badge.threshold
        }));

        // Déterminer le niveau actuel
        const currentLevel = updatedBadges.filter(badge => badge.earned).length;

        setOrderStats(prev => ({
          ...prev,
          consecutiveOrders: userProgression.consecutiveOrders,
          currentLevel,
          badges: updatedBadges
        }));

        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Vérifier périodiquement si la commande en attente a été traitée
  useEffect(() => {
    if (!hasPendingOrder) return;

    const checkOrderStatus = async () => {
      try {
        const pendingResponse = await api.get('/orders/pending', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        if (pendingResponse.data.success && !pendingResponse.data.hasPendingOrder) {
          // La commande a été traitée
          setHasPendingOrder(false);
          setPendingOrder(null);
          setOrderSuccess(false);
          
          // Recharger les données utilisateur pour mettre à jour le streak
          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          
          if (userResponse.data.success) {
            // Mettre à jour les stats avec les nouvelles données
            const newStreak = userResponse.data.user.streak_consecutif || 0;
            setDisplayUser({ prenom: userResponse.data.user.prenom, nom: userResponse.data.user.nom });
            setOrderStats(prev => {
              const updatedBadges = prev.badges.map(badge => ({
                ...badge,
                earned: newStreak >= badge.threshold
              }));
              const newLevel = updatedBadges.filter(badge => badge.earned).length;

              return {
                ...prev,
                consecutiveOrders: newStreak,
                currentLevel: newLevel,
                badges: updatedBadges
              };
            });
          }
          
          // Recharger le stock
          const stockResponse = await api.get('/orders/stock-remaining', {
            headers: { Authorization: `Bearer ${user.token}` }
          });
          if (stockResponse.data.success) {
            setProduct(prev => ({
              ...prev,
              stock: stockResponse.data.stock || 0
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
      }
    };

    const interval = setInterval(checkOrderStatus, 5000); // Vérifier toutes les 5 secondes
    return () => clearInterval(interval);
  }, [hasPendingOrder, user.token]);

  const handleOrder = async () => {
    console.log('Bouton Commander cliqué');
    console.log('hasPendingOrder:', hasPendingOrder);
    console.log('product.stock:', product?.stock);
    console.log('user:', user);

    // Vérifier le stock avant de commander
    if (!product?.stock || product.stock <= 0) {
      console.log('Stock épuisé');
      alert('Désolé, le stock est épuisé. Vous ne pouvez pas commander pour le moment.');
      return;
    }

    // Vérifier que l'utilisateur est connecté
    if (!user || !user.token) {
      console.log('Utilisateur non connecté');
      alert('Vous devez être connecté pour commander.');
      return;
    }

    try {
      console.log('Début de la commande...');
      setIsOrdering(true);
      setOrderSuccess(true);
      
      // Créer la commande via l'API
      console.log('Envoi de la requête API...');
      const response = await api.post('/orders', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      console.log('Réponse API:', response.data);

      if (response.data.success) {
        console.log('Commande créée avec succès');
        // Marquer qu'il y a maintenant une commande en attente
        setHasPendingOrder(true);
        
        // Ne pas mettre à jour les stats ici - attendre que le vendeur accepte

        // Recharger les données pour s'assurer de la cohérence
        setTimeout(async () => {
          try {
            const stockResponse = await api.get('/orders/stock-remaining', {
              headers: { Authorization: `Bearer ${user.token}` }
            });
            if (stockResponse.data.success) {
              setProduct(prev => ({
                ...prev,
                stock: stockResponse.data.stock || 0
              }));
            }
          } catch (error) {
            console.error('Erreur lors du rechargement du stock:', error);
          }
    }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de la commande:', error);
      console.error('Détails de l\'erreur:', error.response?.data);
      setOrderSuccess(false);
      setIsOrdering(false);
      
      // Vérifier si c'est une erreur de stock
      if (error.response?.data?.message?.includes('Stock vendeur indisponible')) {
        alert('Désolé, le stock de votre vendeur est épuisé. Vous ne pouvez pas commander pour le moment.');
      } else if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
      } else if (error.response?.status === 500) {
        alert('Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        alert(`Erreur lors de la commande: ${error.response?.data?.message || error.message}`);
      }
    }

    setTimeout(() => {
      setOrderSuccess(false);
      setIsOrdering(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" 
           style={{ background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)" }}>
        <div className="text-center text-white">
          <div className="spinner-border mb-3" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #1187ff 0%, #0f7be8 100%)",
        minHeight: "100vh",
        height: "100vh",
        overflowY: "auto",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}
    >
      {/* Header simplifié */}
      <div className="text-center px-3 pt-4 pb-3 text-white">
        <div className="fw-bold mb-1" style={{ fontSize: "1.1rem" }}>Bienvenue</div>
        <div className="d-flex align-items-center justify-content-center">
          <PersonCircle className="me-2" size={20} />
          <span style={{ fontSize: "1rem" }}>{displayUser?.prenom} {displayUser?.nom}</span>
        </div>
      </div>

      <div className="px-3 pb-5">
        {/* Section Progress Bar */}
        <div className="bg-white rounded-4 shadow-sm p-4 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
              <h6 className="fw-bold mb-1" style={{ color: "#1e293b" }}>Votre Progression</h6>
            {/*<small className="text-muted">Niveau {orderStats.currentLevel} - Continue comme ça !</small> */}
            </div>
            <div className="text-end">
              <div className="fw-bold" style={{ color: "#1187ff", fontSize: "1.1rem" }}>
                {orderStats.consecutiveOrders}/{orderStats.maxOrders}
              </div>
              <small className="text-muted">commandes consécutives</small>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="position-relative mb-4">
            <div 
              className="w-100 rounded-pill"
              style={{ 
                height: "12px", 
                backgroundColor: "#e9ecef"
              }}
            >
              <div 
                className="rounded-pill h-100 position-relative"
                style={{ 
                  width: `${progressPercentage}%`,
                  background: "linear-gradient(90deg, #1187ff 0%, #00d4ff 100%)",
                  transition: "width 0.5s ease"
                }}
              >
                <div 
                  className="position-absolute end-0 top-50 translate-middle-y me-2 text-white fw-bold"
                  style={{ fontSize: "0.7rem" }}
                >
                  {Math.round(progressPercentage)}%
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="d-flex gap-2 mb-2">
            {orderStats.badges.map((badge) => (
              <div
                key={badge.id}
                className="flex-fill text-center rounded-3 p-2"
                style={{
                  backgroundColor: badge.earned ? "#e0f2fe" : "#f1f5f9",
                  border: badge.earned ? "2px solid #1187ff" : "2px solid #e2e8f0",
                  opacity: badge.earned ? 1 : 0.5,
                  transition: "all 0.3s"
                }}
              >
                <div style={{ fontSize: "1.5rem" }}>{badge.icon}</div>
                <div className="small fw-medium" style={{ 
                  color: badge.earned ? "#1187ff" : "#94a3b8",
                  fontSize: "0.7rem" 
                }}>
                  {badge.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carte produit */}
        <div className="bg-white rounded-4 shadow-sm overflow-hidden mb-3">
          {/* Image et titre produit */}
          <div className="text-center p-4" style={{ backgroundColor: "#f8fafc" }}>
            <div 
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ 
                width: "100px", 
                height: "100px", 
                backgroundColor: "#1187ff10",
                fontSize: "3.5rem"
              }}
            >
              {product?.image}
            </div>
            <h3 className="fw-bold mb-2" style={{ color: "#1e293b" }}>{product?.nom}</h3>
            <p className="text-muted mb-0 small">{product?.description}</p>
          </div>

          {/* Détails produit */}
          <div className="p-4">
            {/* Prix et stock */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 rounded-3" style={{ backgroundColor: "#f8fafc" }}>
              <div>
                <div className="text-muted small mb-1">Prix</div>
                <div className="fw-bold fs-4" style={{ color: "#1187ff" }}>
                  {Math.floor(product?.prix || 0)} FCFA
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted small mb-1">Stock</div>
                <div className="fw-bold text-success">
                  {product?.stock} disponibles
                </div>
              </div>
            </div>

            {/* Bouton commande */}
            <button
              className={`btn w-100 py-3 fw-semibold text-white border-0 rounded-3 mb-3 ${
                orderSuccess ? 'btn-success' : ''
              }`}
              onClick={handleOrder}
              onTouchEnd={handleOrder}
              disabled={orderSuccess || !product?.stock || product.stock <= 0 || hasPendingOrder || isOrdering}
              style={{
                background: orderSuccess 
                  ? "#28a745" 
                  : hasPendingOrder
                    ? "#ffc107"
                    : (!product?.stock || product.stock <= 0)
                      ? "#6c757d"
                  : "linear-gradient(180deg, #1187ff 0%, #0e73e6 100%)",
                fontSize: "1.05rem",
                boxShadow: "0 4px 12px rgba(17,135,255,0.3)",
                transition: "all 0.3s",
                touchAction: "manipulation",
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none"
              }}
            >
              {orderSuccess ? (
                <>
                  <span className="me-2">✓</span>
                  Commande validée !
                </>
              ) : isOrdering ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Traitement...
                </>
              ) : hasPendingOrder ? (
                <>
                  <span className="me-2">⏳</span>
                  Déjà commandé aujourd'hui
                </>
              ) : (!product?.stock || product.stock <= 0) ? (
                <>
                  <span className="me-2">⚠️</span>
                  Stock épuisé
                </>
              ) : (
                <>
                  <Cart className="me-2" size={20} />
                  Commander maintenant
                </>
              )}
            </button>

            {/* Message info */}
            <div className="text-center">
              <small className="text-muted">
                <Clock size={14} className="me-1" />
                Une seule commande par jour • Maximum 30 jours
              </small>
            </div>
          </div>
        </div>

        

        {/* Bouton Déconnexion */}
        <div className="text-center mb-4">
          <button 
            className="btn btn-outline-light text-white px-5 py-2"
            onClick={onLogout}
            style={{ 
              fontSize: "1rem",
              borderRadius: "12px",
              fontWeight: 500
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}