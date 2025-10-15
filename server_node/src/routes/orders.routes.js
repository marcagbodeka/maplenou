const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { orderLimiter } = require('../middlewares/rateLimit');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// POST /api/orders - créer une commande pour aujourd'hui
router.post('/', authMiddleware, orderLimiter, async (req, res) => {
  try {
    const userIdStr = String(req.user.id || '');
    if (!ObjectId.isValid(userIdStr)) {
      return res.status(401).json({ success: false, message: 'Session invalide' });
    }
    const { vendeur_id = null } = req.body || {};
    const usersCol = getCollection('utilisateurs');
    const prodCol = getCollection('produit_unique');
    const commandes = getCollection('commandes');

    // Une commande par jour
    const start = new Date(); start.setUTCHours(0,0,0,0);
    const end = new Date(start.getTime() + 24*60*60*1000);
    const existing = await commandes.findOne({ utilisateur_id: new ObjectId(userIdStr), date_commande: { $gte: start, $lt: end } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Commande déjà passée aujourd\'hui' });
    }

    // Produit actif et prix
    const fixedId = new ObjectId('652a71111111111111111111');
    const prod = await prodCol.findOne({ _id: fixedId }) || await prodCol.findOne({});
    if (!prod || prod.statut !== 'actif') {
      return res.status(400).json({ success: false, message: 'Produit non disponible' });
    }
    const prix = prod.prix || 0;

    // Déterminer le vendeur cible (pas de décrément ici)
    let targetVendorId = vendeur_id && ObjectId.isValid(String(vendeur_id)) ? new ObjectId(String(vendeur_id)) : null;
    if (!targetVendorId) {
      const userDoc = await usersCol.findOne({ _id: new ObjectId(userIdStr) });
      const { institut, parcours } = userDoc || {};
      let vendor = null;
      if (institut && parcours) {
        vendor = await usersCol.findOne({ role: 'vendeur', institut, parcours });
      }
      if (!vendor && institut) {
        vendor = await usersCol.findOne({ role: 'vendeur', institut });
      }
      if (vendor) targetVendorId = vendor._id;
    }

    await commandes.insertOne({
      utilisateur_id: new ObjectId(userIdStr),
      vendeur_id: targetVendorId || null,
      quantite: 1,
      prix_total: prix,
      prix_unitaire: prix,
      statut: 'en_attente',
      date_commande: new Date(),
    });

    return res.status(201).json({ success: true, message: 'Commande créée' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur création commande', detail: String(err) });
  }
});

// GET /api/orders/stock-remaining - stock restant pour l'utilisateur (par vendeur institut et parcours)
router.get('/stock-remaining', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const usersCol = getCollection('utilisateurs');
    const allocCol = getCollection('allocations_vendeurs');

    let user = null;
    const userIdStr = String(userId || '');
    if (ObjectId.isValid(userIdStr)) {
      user = await usersCol.findOne({ _id: new ObjectId(userIdStr) });
    }
    if (!user) {
      return res.json({ success: true, scope: 'vendor', stock: 0, message: 'Utilisateur introuvable' });
    }
    const institut = user?.institut;
    const parcours = user?.parcours;

    if (!institut) {
      // Pas d'institut → pas de vendeur ciblé
      return res.json({ success: true, scope: 'global', stock: 0 });
    }

    // Trouver un vendeur pour l'institut (priorité même parcours)
    let vendor = null;
    if (parcours) {
      vendor = await usersCol.findOne({ role: 'vendeur', institut, parcours });
    }
    if (!vendor) {
      vendor = await usersCol.findOne({ role: 'vendeur', institut });
    }
    if (!vendor) {
      return res.json({ success: true, scope: 'vendor', stock: 0, message: 'Aucun vendeur pour cet institut' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    // Support legacy documents where vendeur_id may be stored as a string
    const alloc = await allocCol.findOne({
      date_jour: dateStr,
      $or: [
        { vendeur_id: vendor._id },
        { vendeur_id: vendor._id.toString() }
      ]
    });
    return res.json({ success: true, scope: 'vendor', stock: alloc?.stock_restant ?? 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lecture stock', detail: String(err) });
  }
});

// GET /api/orders/pending - Vérifier si l'utilisateur a une commande en attente aujourd'hui
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const userIdStr = String(req.user.id || '');
    if (!ObjectId.isValid(userIdStr)) {
      return res.json({ success: true, hasPendingOrder: false, order: null });
    }
    const commandes = getCollection('commandes');
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const pendingOrder = await commandes.findOne({
      utilisateur_id: new ObjectId(userIdStr),
      statut: 'en_attente',
      date_commande: { $gte: start, $lt: end }
    }, { sort: { date_commande: -1 } });

    return res.json({ success: true, hasPendingOrder: !!pendingOrder, order: pendingOrder || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur vérification commande', detail: String(err) });
  }
});

// GET /api/orders/vendor/:vendeurId - Récupérer les commandes en attente pour un vendeur
router.get('/vendor/:vendeurId', authMiddleware, async (req, res) => {
  try {
    const { vendeurId } = req.params;
    const vendeurIdStr = String(vendeurId || '');
    if (!ObjectId.isValid(vendeurIdStr)) {
      return res.json({ success: true, orders: [] });
    }
    // Vérifier rôle
    if (req.user.role !== 'admin' && String(req.user.id) !== vendeurIdStr) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    const commandes = getCollection('commandes');
    const usersCol = getCollection('utilisateurs');
    const orders = await commandes.find({ vendeur_id: new ObjectId(vendeurIdStr), statut: 'en_attente' }).sort({ date_commande: 1 }).toArray();
    const enriched = [];
    for (const c of orders) {
      const u = c.utilisateur_id ? await usersCol.findOne({ _id: c.utilisateur_id }) : null;
      enriched.push({
        id: c._id.toString(),
        client_id: c.utilisateur_id?.toString() || null,
        quantite: c.quantite,
        prix_total: c.prix_total,
        date_commande: c.date_commande,
        statut: c.statut,
        client_nom: u?.nom || '',
        client_prenom: u?.prenom || '',
        client_institut: u?.institut || '',
        client_parcours: u?.parcours || ''
      });
    }
    return res.json({ success: true, orders: enriched });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur récupération commandes', detail: String(err) });
  }
});

// PUT /api/orders/:orderId/process - Traiter une commande (vendeur)
router.put('/:orderId/process', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'accept' ou 'reject'
    if (!ObjectId.isValid(String(orderId))) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }
    if (req.user.role !== 'vendeur' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Seuls les vendeurs peuvent traiter les commandes' });
    }
    const commandes = getCollection('commandes');
    const usersCol = getCollection('utilisateurs');
    const allocCol = getCollection('allocations_vendeurs');

    const order = await commandes.findOne({ _id: new ObjectId(String(orderId)) });
    if (!order) return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    if (order.statut !== 'en_attente') return res.status(400).json({ success: false, message: 'Cette commande a déjà été traitée' });
    if (req.user.role === 'vendeur' && order.vendeur_id && String(order.vendeur_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Cette commande ne vous appartient pas' });
    }

    const newStatus = action === 'reject' ? 'annule' : 'traitee';
    const now = new Date();
    await commandes.updateOne({ _id: order._id }, { $set: { statut: newStatus, date_traitement: now } });

    if (action === 'accept') {
      // décrément stock vendeur si vendeur_id présent
      if (order.vendeur_id) {
        const dateStr = new Date().toISOString().split('T')[0];
        await allocCol.updateOne({ vendeur_id: order.vendeur_id, date_jour: dateStr }, { $inc: { stock_restant: -1 } });
      }
      // streak client
      const client = await usersCol.findOne({ _id: order.utilisateur_id });
      const today = new Date(); today.setUTCHours(0,0,0,0);
      const yesterday = new Date(today.getTime() - 24*60*60*1000);
      const last = client?.dernier_achat_date ? new Date(client.dernier_achat_date) : null;
      let newStreak = 1;
      if (last && last.toISOString().slice(0,10) === yesterday.toISOString().slice(0,10)) {
        newStreak = (client?.streak_consecutif || 0) + 1;
      }
      await usersCol.updateOne({ _id: client._id }, { $set: { streak_consecutif: newStreak, dernier_achat_date: today, eligible_loterie: ((client?.badge_niveau || 0) >= 4) } });
      // badge
      const defs = await getCollection('badges_definitions').find({}).sort({ niveau: 1 }).toArray();
      let awarded = null; for (const d of defs) { if (newStreak >= (d.jours_consecutifs_requis || 0)) awarded = d.niveau; }
      if (awarded && awarded > (client?.badge_niveau || 0)) {
        await usersCol.updateOne({ _id: client._id }, { $set: { badge_niveau: awarded, eligible_loterie: (awarded >= 4) } });
      }
    }

    const message = action === 'reject' ? 'Commande refusée' : 'Commande traitée avec succès';
    return res.json({ success: true, message });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur traitement commande', detail: String(err) });
  }
});

module.exports = router;




