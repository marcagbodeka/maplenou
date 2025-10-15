const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { jwtSecret } = require('../config/env');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { nom, prenom, email, password, whatsapp, institut, parcours } = req.body || {};
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ success: false, message: 'Champs requis: nom, prenom, email, password' });
  }
  try {
    const usersCol = getCollection('utilisateurs');
    const existing = await usersCol.findOne({ $or: [ { email }, ...(whatsapp ? [{ whatsapp }] : []) ] });
    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      }
      if (whatsapp && existing.whatsapp === whatsapp) {
        return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }
    const hash = await bcrypt.hash(password, 10);
    await usersCol.insertOne({
      nom,
      prenom,
      email,
      hash_mot_de_passe: hash,
      role: 'client',
      whatsapp: whatsapp || null,
      institut: institut || null,
      parcours: parcours || null,
      streak_consecutif: 0,
      badge_niveau: 0,
      eligible_loterie: false,
      created_at: new Date(),
      updated_at: new Date()
    });
    return res.status(201).json({ success: true, message: 'Utilisateur créé' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const usersCol = getCollection('utilisateurs');
    const user = await usersCol.findOne({ email });
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

    const id = (user._id && user._id.toString()) || String(user.id);
    const role = user.role || 'client';
    const token = jwt.sign({ id, role }, jwtSecret, { expiresIn: '12h' });
    return res.json({ success: true, token, role });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(error?.message || error) });
  }
});

// GET /api/auth/me - Récupérer les données de l'utilisateur connecté
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = String(req.user.id || '');
    if (!ObjectId.isValid(userId)) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const usersCol = getCollection('utilisateurs');
    const doc = await usersCol.findOne({ _id: new ObjectId(userId) });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    const user = {
      id: doc._id.toString(),
      nom: doc.nom,
      prenom: doc.prenom,
      email: doc.email,
      role: doc.role,
      institut: doc.institut,
      parcours: doc.parcours,
      streak_consecutif: doc.streak_consecutif || 0,
      badge_niveau: doc.badge_niveau || 0,
      dernier_achat_date: doc.dernier_achat_date || null
    };
    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur récupération utilisateur', detail: String(err) });
  }
});

module.exports = router;


