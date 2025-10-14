const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDbPool } = require('../config/db');
const { jwtSecret } = require('../config/env');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nom, prenom, email, password, whatsapp, institut, parcours } = req.body || {};
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ success: false, message: 'Champs requis: nom, prenom, email, password' });
  }
  const pool = getDbPool();
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO utilisateurs (nom, prenom, email, hash_mot_de_passe, role, whatsapp, institut, parcours) VALUES (?, ?, ?, ?, "client", ?, ?, ?)',
      [nom, prenom, email, hash, whatsapp || null, institut || null, parcours || null]
    );
    return res.status(201).json({ success: true, message: 'Utilisateur créé' });
  } catch (err) {
    const errorMessage = String(err?.message || '');
    if (errorMessage.includes('Duplicate entry')) {
      if (errorMessage.includes('email')) {
        return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      } else if (errorMessage.includes('whatsapp')) {
        return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      } else {
        return res.status(409).json({ success: false, message: 'Email ou numéro déjà utilisé' });
      }
    }
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const pool = getDbPool();
    const [[user]] = await pool.query(
      'SELECT id, email, hash_mot_de_passe, role FROM utilisateurs WHERE email = ?',
      [email]
    );
    if (!user) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    let isPasswordValid = false;
    try {
      if (typeof user.hash_mot_de_passe === 'string' && user.hash_mot_de_passe.startsWith('$2')) {
        isPasswordValid = await bcrypt.compare(password, user.hash_mot_de_passe);
      } else {
        // Seeded placeholder or invalid hash format – treat as invalid credentials
        isPasswordValid = false;
      }
    } catch (_) {
      // Any bcrypt error should not 500 the request – treat as invalid credentials
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Identifiants invalides' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '12h' });
    return res.json({ success: true, token, role: user.role });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(error?.message || error) });
  }
});

// GET /api/auth/me - Récupérer les données de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getDbPool();
    
    const [[user]] = await pool.query(
      'SELECT id, nom, prenom, email, role, institut, parcours, streak_consecutif, badge_niveau, dernier_achat_date FROM utilisateurs WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur récupération utilisateur', detail: String(err) });
  }
});

module.exports = router;


