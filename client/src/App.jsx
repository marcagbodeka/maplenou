import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import WelcomeScreen from './pages/WelcomeScreen.jsx';
import LoginScreen from './pages/LoginScreen.jsx';
import RegisterScreen from './pages/RegisterScreen.jsx';
import ProductDetailScreen from './pages/ProductDetailScreen.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Vendeur from './pages/Vendeur.jsx';

function App() {
  const [view, setView] = useState('landing'); // landing | login | register | product | admin | vendeur
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Use production API URL or fallback to proxy in dev
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  // Vérifier la session au chargement de l'app
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Decode JWT payload (base64url) to extract role
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Pad base64 to length multiple of 4 for atob compatibility
      while (base64.length % 4 !== 0) base64 += '=';
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Vérifier s'il y a une session active
  const checkExistingSession = () => {
    try {
      const savedUser = localStorage.getItem('maplenou_user');
      const sessionExpiry = localStorage.getItem('maplenou_session_expiry');
      
      if (savedUser && sessionExpiry) {
        const now = new Date().getTime();
        const expiryTime = parseInt(sessionExpiry);
        
        if (now < expiryTime) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          const role = parsed?.role;
          if (role === 'admin') {
            setView('admin');
          } else if (role === 'vendeur') {
            setView('vendeur');
          } else {
            setView('product');
          }
          console.log('Session restaurée automatiquement');
        } else {
          // Session expirée, nettoyer le localStorage
          clearSession();
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de session:', error);
      clearSession();
    }
  };

  // Sauvegarder la session
  const saveSession = (userData) => {
    const now = new Date().getTime();
    const expiryTime = now + (24 * 60 * 60 * 1000); // 24 heures
    
    localStorage.setItem('maplenou_user', JSON.stringify(userData));
    localStorage.setItem('maplenou_session_expiry', expiryTime.toString());
  };

  // Nettoyer la session
  const clearSession = () => {
    localStorage.removeItem('maplenou_user');
    localStorage.removeItem('maplenou_session_expiry');
    setUser(null);
    setView('landing');
  };

  // Fonction de connexion
  const handleLogin = async (loginData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      if (response.data.success) {
        const token = response.data.token;
        const backendRole = response.data.role;
        const payload = parseJwt(token) || {};
        const role = backendRole || payload?.role || 'client';
        const userData = {
          id: payload?.id || 1,
          nom: loginData.email.split('@')[0],
          email: loginData.email,
          role,
          token
        };
        
        setUser(userData);
        saveSession(userData); // Sauvegarder la session
        if (role === 'admin') {
          setView('admin');
        } else if (role === 'vendeur') {
          setView('vendeur');
        } else {
          setView('product');
        }
        setMessage('Connexion réussie !');
      } else {
        setMessage('Email ou mot de passe incorrect');
      }
    } catch (error) {
      const detail = error?.response?.data || error?.message || error;
      console.error('Erreur de connexion:', detail);
      setMessage(
        typeof detail === 'object' && detail?.message
          ? `Erreur serveur: ${detail.message}`
          : 'Erreur de connexion au serveur'
      );
    }
    setLoading(false);
  };

  // Fonction d'inscription
  const handleRegister = async (registerData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, registerData);
      if (response.data.success) {
        // Simuler les données utilisateur (le backend ne retourne que le message de succès)
        const userData = {
          id: 1,
          nom: registerData.nom,
          prenom: registerData.prenom,
          email: registerData.email,
          institut: registerData.institut,
          parcours: registerData.parcours
        };
        
        setUser(userData);
        saveSession(userData); // Sauvegarder la session
        setView('product');
        setMessage('Inscription réussie !');
      } else {
        setMessage('Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      setMessage('Erreur lors de l\'inscription');
    }
    setLoading(false);
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    clearSession(); // Nettoyer la session
    setMessage('');
  };

  // Page d'accueil
  if (view === 'landing') {
    return (
      <WelcomeScreen 
        onLogin={() => setView('login')} 
        onRegister={() => setView('register')} 
      />
    );
  }

  // Page de connexion
  if (view === 'login') {
    return (
      <LoginScreen 
        onLogin={handleLogin}
        onRegister={() => setView('register')} 
      />
    );
  }

  // Page d'inscription
  if (view === 'register') {
    return (
      <RegisterScreen 
        onRegister={handleRegister}
        onLogin={() => setView('login')} 
      />
    );
  }

  // Page produit (après connexion/inscription)
  if (view === 'product') {
    return (
      <ProductDetailScreen 
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Page admin (après connexion admin)
  if (view === 'admin') {
    return (
      <AdminDashboard
        admin={user}
        onLogout={handleLogout}
      />
    );
  }

  // Page vendeur (après connexion vendeur)
  if (view === 'vendeur') {
    return (
      <Vendeur
        vendeur={user}
        onLogout={handleLogout}
      />
    );
  }

  // Message d'erreur si aucune vue valide
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <h2>Erreur</h2>
        <p>Vue non trouvée</p>
        <button 
          className="btn btn-primary"
          onClick={() => setView('landing')}
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export default App;