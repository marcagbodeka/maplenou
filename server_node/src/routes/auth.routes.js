const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { jwtSecret } = require('../config/env');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Fonction pour vérifier et réinitialiser le streak d'un client
async function checkAndResetStreak(user) {
  try {
    const usersCol = getCollection('utilisateurs');
    const commandes = getCollection('commandes');
    const allocations = getCollection('allocations_vendeurs');
    
    // Calculer hier
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Normaliser institut/parcours du client
    let institut = user.institut || null;
    let parcours = user.parcours || null;
    const knownParcours = new Set(['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat']);
    const knownInstituts = new Set(['ISSJ', 'ISEG', 'ESI/DGI', 'HEC', 'IAEC']);
    
    if (!parcours && knownParcours.has(String(institut))) {
      parcours = institut;
      institut = null;
    }
    if (!institut && knownInstituts.has(String(parcours))) {
      institut = parcours;
      parcours = null;
    }
    
    if (!institut) return; // Pas de vendeur cible → conserver la progression
    
    // Trouver le vendeur correspondant
    let vendeur = null;
    if (parcours) {
      vendeur = await usersCol.findOne({ role: 'vendeur', institut, parcours });
    }
    if (!vendeur) {
      vendeur = await usersCol.findOne({ role: 'vendeur', institut });
    }
    if (!vendeur) return; // Pas de vendeur → conserver la progression
    
    // Vérifier si le vendeur a reçu une allocation hier
    const hadAllocation = await allocations.findOne({
      vendeur_id: vendeur._id,
      date_jour: yesterdayStr
    });
    
    if (!hadAllocation) return; // Pas d'allocation hier → conserver la progression
    
    // Vérifier si le client a commandé hier
    const hadOrder = await commandes.findOne({
      utilisateur_id: user._id,
      statut: 'traitee',
      date_commande: { $gte: yesterday, $lt: today }
    });
    
    if (hadOrder) return; // A commandé hier → conserver la progression
    
    // Reset de la progression
    await usersCol.updateOne(
      { _id: user._id },
      { 
        $set: { 
          streak_consecutif: 0, 
          badge_niveau: 0, 
          eligible_loterie: false,
          updated_at: new Date()
        } 
      }
    );
    
    console.log(`Streak reset for client ${user.nom} ${user.prenom} - no order yesterday despite vendor allocation`);
  } catch (err) {
    console.error('Error checking streak reset:', err);
  }
}

router.post('/register', async (req, res) => {
  const { nom, prenom, email, password, whatsapp, telephone, institut, parcours } = req.body || {};
  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ success: false, message: 'Champs requis: nom, prenom, email, password' });
  }
  try {
    const usersCol = getCollection('utilisateurs');
    const phone = whatsapp || telephone || null;
    const existing = await usersCol.findOne({ $or: [ { email }, ...(phone ? [{ whatsapp: phone }] : []) ] });
    if (existing) {
      if (existing.email === email) {
        return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      }
      if (phone && existing.whatsapp === phone) {
        return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }
    // Normaliser institut/parcours si inversés
    const knownParcours = new Set(['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat']);
    const knownInstituts = new Set(['ISSJ', 'ISEG', 'ESI/DGI', 'HEC', 'IAEC']);
    let normInstitut = institut || null;
    let normParcours = parcours || null;
    if (!normParcours && knownParcours.has(String(normInstitut))) {
      normParcours = normInstitut;
      normInstitut = null;
    }
    if (!normInstitut && knownInstituts.has(String(normParcours))) {
      normInstitut = normParcours;
      normParcours = null;
    }

    const hash = await bcrypt.hash(password, 10);
    await usersCol.insertOne({
      nom,
      prenom,
      email,
      hash_mot_de_passe: hash,
      role: 'client',
      whatsapp: phone,
      institut: normInstitut,
      parcours: normParcours,
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

    // Vérification et reset de streak pour les clients
    if (user.role === 'client' && user.streak_consecutif > 0) {
      await checkAndResetStreak(user);
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


