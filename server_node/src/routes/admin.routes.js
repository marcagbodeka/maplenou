const express = require('express');
const bcrypt = require('bcrypt');
const { getDbPool } = require('../config/db-mongo-wrapper');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Accès refusé. Admin requis.' });
  }
  next();
};

// GET /api/users/vendors - Liste des vendeurs
router.get('/users/vendors', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const usersCol = getCollection('utilisateurs');
    const vendors = await usersCol
      .find({ role: 'vendeur' })
      .project({ hash_mot_de_passe: 0 })
      .sort({ nom: 1, prenom: 1 })
      .toArray();
    const mapped = vendors.map(v => ({
      id: v._id.toString(),
      nom: v.nom,
      prenom: v.prenom,
      email: v.email,
      whatsapp: v.whatsapp || null,
      institut: v.institut,
      parcours: v.parcours,
      created_at: v.created_at || null
    }));
    return res.json({ success: true, vendors: mapped });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des vendeurs', detail: String(err) });
  }
});

// POST /api/users/vendor - Créer un vendeur
router.post('/users/vendor', authMiddleware, adminMiddleware, async (req, res) => {
  const { nom, prenom, email, whatsapp, institut, parcours, password } = req.body;
  
  if (!nom || !prenom || !email || !password || !institut || !parcours) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    const usersCol = getCollection('utilisateurs');
    const existing = await usersCol.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
    }
    const hash = await bcrypt.hash(password, 10);
    await usersCol.insertOne({
      nom,
      prenom,
      email,
      whatsapp: whatsapp || null,
      institut,
      parcours,
      hash_mot_de_passe: hash,
      role: 'vendeur',
      created_at: new Date(),
      updated_at: new Date()
    });
    return res.json({ success: true, message: 'Vendeur créé avec succès' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la création du vendeur', detail: String(err) });
  }
});

// PUT /api/users/vendor/:id - Modifier un vendeur
router.put('/users/vendor/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email, whatsapp, institut, parcours, password } = req.body;
  
  if (!nom || !prenom || !email || !institut || !parcours) {
    return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
  }

  try {
    const usersCol = getCollection('utilisateurs');
    const _id = new ObjectId(id);
    const vendor = await usersCol.findOne({ _id, role: 'vendeur' });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    const update = {
      $set: {
        nom,
        prenom,
        email,
        whatsapp: whatsapp || null,
        institut,
        parcours,
        updated_at: new Date()
      }
    };
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      update.$set.hash_mot_de_passe = hash;
    }
    await usersCol.updateOne({ _id }, update);
    return res.json({ success: true, message: 'Vendeur modifié avec succès' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la modification du vendeur', detail: String(err) });
  }
});

// POST /api/admin/allocate - Allouer du stock à un vendeur
router.post('/allocate', authMiddleware, adminMiddleware, async (req, res) => {
  const { vendeur_id, quantite } = req.body;
  if (!vendeur_id || !quantite || quantite <= 0) {
    return res.status(400).json({ success: false, message: 'Vendeur et quantité valides requis' });
  }
  try {
    const usersCol = getCollection('utilisateurs');
    const allocCol = getCollection('allocations_vendeurs');
    const _id = new ObjectId(String(vendeur_id));
    const vendor = await usersCol.findOne({ _id, role: 'vendeur' });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }
    const dateStr = new Date().toISOString().split('T')[0];
    await allocCol.updateOne(
      { vendeur_id: _id, date_jour: dateStr },
      {
        $setOnInsert: { vendeur_id: _id, date_jour: dateStr },
        $inc: { stock_alloue: Number(quantite), stock_restant: Number(quantite) }
      },
      { upsert: true }
    );
    return res.json({ success: true, message: `${quantite} croissants alloués à ${vendor.nom} ${vendor.prenom}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'allocation', detail: String(err) });
  }
});

// GET /api/admin/revenue/:date - Chiffre d'affaires pour une date donnée
router.get('/revenue/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params; // format YYYY-MM-DD
    const commandes = getCollection('commandes');

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000);

    const agg = await commandes.aggregate([
      { $match: { statut: 'traitee', date_commande: { $gte: start, $lt: end } } },
      { $group: { _id: null, revenue: { $sum: { $ifNull: ['$prix_total', 0] } } } }
    ]).toArray();

    const revenue = agg[0]?.revenue || 0;
    res.json({ success: true, revenue });
  } catch (err) {
    console.error('Erreur récupération chiffre d\'affaires:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

// GET /api/admin/product-stats/:date - Statistiques produit du jour
router.get('/product-stats/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params; // YYYY-MM-DD
    const commandes = getCollection('commandes');
    const allocations = getCollection('allocations_vendeurs');

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000);

    const acceptedAgg = await commandes.aggregate([
      { $match: { statut: 'traitee', date_commande: { $gte: start, $lt: end } } },
      { $count: 'acceptedOrders' }
    ]).toArray();
    const acceptedOrders = acceptedAgg[0]?.acceptedOrders || 0;

    const totalAllocAgg = await allocations.aggregate([
      { $match: { date_jour: date } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$stock_alloue', 0] } } } }
    ]).toArray();
    const totalAllocations = totalAllocAgg[0]?.total || 0;

    res.json({ success: true, acceptedOrders, totalAllocations });
  } catch (err) {
    console.error('Erreur récupération stats produit:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

// GET /api/admin/vendors-stats/:date - Liste des vendeurs avec leurs stats
router.get('/vendors-stats/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params; // YYYY-MM-DD
    const usersCol = getCollection('utilisateurs');
    const allocCol = getCollection('allocations_vendeurs');
    const commandesCol = getCollection('commandes');

    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(new Date(start).getTime() + 24 * 60 * 60 * 1000);

    const vendors = await usersCol.find({ role: 'vendeur' }).project({ hash_mot_de_passe: 0 }).toArray();

    const allocations = await allocCol.find({ date_jour: date }).sort({ _id: -1 }).toArray();
    const latestAllocByVendor = {};
    for (const a of allocations) {
      const key = (a.vendeur_id && a.vendeur_id.toString()) || '';
      if (!latestAllocByVendor[key]) {
        latestAllocByVendor[key] = a;
      }
    }

    const ordersAgg = await commandesCol.aggregate([
      { $match: { statut: 'traitee', date_commande: { $gte: start, $lt: end } } },
      { $group: { _id: '$vendeur_id', count: { $sum: 1 } } }
    ]).toArray();
    const acceptedByVendor = {};
    for (const o of ordersAgg) {
      const key = o._id ? o._id.toString() : '';
      acceptedByVendor[key] = o.count;
    }

    const result = vendors.map(v => {
      const idStr = v._id.toString();
      const alloc = latestAllocByVendor[idStr];
      return {
        id: idStr,
        nom: v.nom,
        prenom: v.prenom,
        institut: v.institut,
        parcours: v.parcours,
        stock_alloue: alloc?.stock_alloue || 0,
        stock_restant: alloc?.stock_restant || 0,
        accepted_orders: acceptedByVendor[idStr] || 0,
      };
    });

    res.json({ success: true, vendors: result });
  } catch (err) {
    console.error('Erreur récupération stats vendeurs:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

// GET /api/admin/users-ranking - Classement des utilisateurs par streak
router.get('/users-ranking', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = getDbPool();
    
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.nom,
        u.prenom,
        u.email,
        u.institut,
        u.parcours,
        u.streak_consecutif,
        u.badge_niveau,
        u.dernier_achat_date,
        CASE 
          WHEN u.streak_consecutif >= 120 THEN '🏆 Champion'
          WHEN u.streak_consecutif >= 90 THEN '🥇 Expert'
          WHEN u.streak_consecutif >= 60 THEN '🥈 Avancé'
          WHEN u.streak_consecutif >= 30 THEN '🥉 Intermédiaire'
          WHEN u.streak_consecutif >= 1 THEN '⭐ Débutant'
          ELSE '🔰 Nouveau'
        END as niveau_badge,
        CASE 
          WHEN u.streak_consecutif >= 120 THEN 6
          WHEN u.streak_consecutif >= 90 THEN 5
          WHEN u.streak_consecutif >= 60 THEN 4
          WHEN u.streak_consecutif >= 30 THEN 3
          WHEN u.streak_consecutif >= 1 THEN 2
          ELSE 1
        END as niveau_ordre
      FROM utilisateurs u
      WHERE u.role = 'client'
      ORDER BY 
        u.streak_consecutif DESC,
        u.badge_niveau DESC,
        u.dernier_achat_date DESC,
        u.nom ASC
    `);
    
    res.json({ success: true, users });
  } catch (err) {
    console.error('Erreur récupération classement utilisateurs:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

module.exports = router;
