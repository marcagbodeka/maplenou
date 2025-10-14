const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { orderLimiter } = require('../middlewares/rateLimit');
const { getDbPool } = require('../config/db');

// POST /api/orders - créer une commande pour aujourd'hui
router.post('/', authMiddleware, orderLimiter, async (req, res) => {
  const userId = req.user.id;
  const { vendeur_id = null } = req.body || {};
  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Vérifier une commande par jour
    const [existing] = await conn.query(
      'SELECT id FROM commandes WHERE utilisateur_id = ? AND date_commande = CURRENT_DATE()',
      [userId]
    );
    if (existing.length) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Commande déjà passée aujourd\'hui' });
    }

    // Vérifier produit actif et stock
    const [prodRows] = await conn.query('SELECT statut, stock_restant_du_jour, prix FROM produit_unique WHERE id = 1 FOR UPDATE');
    if (!prodRows.length || prodRows[0].statut !== 'actif') {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Produit non disponible' });
    }

    let prix = prodRows[0].prix;

    // Déterminer le vendeur cible: prioriser vendeur_id fourni, sinon vendeur de l'institut et parcours du client
    let targetVendorId = vendeur_id;
    if (!targetVendorId) {
      const [[{ institut, parcours } = {}]] = await conn.query('SELECT institut, parcours FROM utilisateurs WHERE id = ? FOR UPDATE', [userId]);
      if (institut) {
        // Chercher un vendeur avec le même institut et parcours
        let vendor = null;
        if (parcours) {
          const [[vendorWithParcours]] = await conn.query(
            "SELECT id FROM utilisateurs WHERE role = 'vendeur' AND institut = ? AND parcours = ? LIMIT 1",
            [institut, parcours]
          );
          vendor = vendorWithParcours;
        }

        // Si pas de vendeur avec le même parcours, chercher n'importe quel vendeur de l'institut
        if (!vendor) {
          const [[vendorInInstitut]] = await conn.query(
            "SELECT id FROM utilisateurs WHERE role = 'vendeur' AND institut = ? LIMIT 1",
            [institut]
          );
          vendor = vendorInInstitut;
        }

        if (vendor) targetVendorId = vendor.id;
      }
    }

    if (targetVendorId) {
      // Consommer allocation vendeur
      const [alloc] = await conn.query(
        'SELECT id, stock_restant FROM allocations_vendeurs WHERE vendeur_id = ? AND date_jour = CURRENT_DATE() FOR UPDATE',
        [targetVendorId]
      );
      if (!alloc.length || alloc[0].stock_restant <= 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Stock vendeur indisponible' });
      }
      await conn.query('UPDATE allocations_vendeurs SET stock_restant = stock_restant - 1 WHERE id = ?', [alloc[0].id]);
    } else {
      // Consommer stock global
      if (prodRows[0].stock_restant_du_jour <= 0) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Stock épuisé' });
      }
      await conn.query('UPDATE produit_unique SET stock_restant_du_jour = stock_restant_du_jour - 1 WHERE id = 1');
    }

    // Créer la commande
    const [result] = await conn.query(
      'INSERT INTO commandes (utilisateur_id, vendeur_id, date_commande, prix_unitaire, prix_total, statut) VALUES (?, ?, CURRENT_DATE(), ?, ?, "en_attente")',
      [userId, targetVendorId || null, prix, prix]
    );

    // Ne pas mettre à jour le streak ici - seulement quand la commande est acceptée par le vendeur

    await conn.commit();
    return res.status(201).json({ success: true, message: 'Commande créée' });
  } catch (err) {
    await conn.rollback();
    return res.status(500).json({ success: false, message: 'Erreur création commande', detail: String(err) });
  } finally {
    conn.release();
  }
});

// GET /api/orders/stock-remaining - stock restant pour l'utilisateur (par vendeur institut et parcours)
router.get('/stock-remaining', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getDbPool();

    const [[{ institut, parcours } = {}]] = await pool.query('SELECT institut, parcours FROM utilisateurs WHERE id = ?', [userId]);
    if (!institut) {
      // Si pas d'institut défini, retourner le stock global du produit
      const [[prod]] = await pool.query('SELECT stock_restant_du_jour FROM produit_unique WHERE id = 1');
      return res.json({ success: true, scope: 'global', stock: prod?.stock_restant_du_jour ?? 0 });
    }

    // Chercher un vendeur avec le même institut et parcours
    let vendor = null;
    if (parcours) {
      const [[vendorWithParcours]] = await pool.query(
        "SELECT id FROM utilisateurs WHERE role = 'vendeur' AND institut = ? AND parcours = ? LIMIT 1", 
        [institut, parcours]
      );
      vendor = vendorWithParcours;
    }

    // Si pas de vendeur avec le même parcours, chercher n'importe quel vendeur de l'institut
    if (!vendor) {
      const [[vendorInInstitut]] = await pool.query(
        "SELECT id FROM utilisateurs WHERE role = 'vendeur' AND institut = ? LIMIT 1", 
        [institut]
      );
      vendor = vendorInInstitut;
    }

    if (!vendor) {
      return res.json({ success: true, scope: 'vendor', stock: 0, message: 'Aucun vendeur pour cet institut' });
    }

    const [[alloc]] = await pool.query(
      'SELECT stock_restant FROM allocations_vendeurs WHERE vendeur_id = ? AND date_jour = CURRENT_DATE()',
      [vendor.id]
    );
    return res.json({ success: true, scope: 'vendor', stock: alloc?.stock_restant ?? 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lecture stock', detail: String(err) });
  }
});

// GET /api/orders/pending - Vérifier si l'utilisateur a une commande en attente aujourd'hui
router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getDbPool();

    const [[pendingOrder]] = await pool.query(
      'SELECT id, statut, date_commande FROM commandes WHERE utilisateur_id = ? AND statut = "en_attente" AND date_commande = CURRENT_DATE() ORDER BY date_commande DESC LIMIT 1',
      [userId]
    );

    return res.json({ 
      success: true, 
      hasPendingOrder: !!pendingOrder,
      order: pendingOrder || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur vérification commande', detail: String(err) });
  }
});

// GET /api/orders/vendor/:vendeurId - Récupérer les commandes en attente pour un vendeur
router.get('/vendor/:vendeurId', authMiddleware, async (req, res) => {
  try {
    const { vendeurId } = req.params;
    const pool = getDbPool();

    // Vérifier que l'utilisateur est le vendeur ou un admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(vendeurId)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const [orders] = await pool.query(`
      SELECT 
        c.id,
        c.utilisateur_id as client_id,
        c.quantite,
        c.prix_total,
        c.date_commande,
        c.statut,
        u.nom as client_nom,
        u.prenom as client_prenom,
        u.institut as client_institut,
        u.parcours as client_parcours
      FROM commandes c
      JOIN utilisateurs u ON c.utilisateur_id = u.id
      WHERE c.vendeur_id = ? AND c.statut = 'en_attente'
      ORDER BY c.date_commande ASC
    `, [vendeurId]);

    return res.json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur récupération commandes', detail: String(err) });
  }
});

// PUT /api/orders/:orderId/process - Traiter une commande (vendeur)
router.put('/:orderId/process', authMiddleware, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action } = req.body; // 'accept' ou 'reject'
    const pool = getDbPool();

    // Vérifier que l'utilisateur est un vendeur ou admin
    if (req.user.role !== 'vendeur' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Seuls les vendeurs peuvent traiter les commandes' });
    }

    // Vérifier que la commande existe et appartient au vendeur
    const [[order]] = await pool.query(
      'SELECT id, vendeur_id, utilisateur_id, statut FROM commandes WHERE id = ?',
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (order.statut !== 'en_attente') {
      return res.status(400).json({ success: false, message: 'Cette commande a déjà été traitée' });
    }

    if (req.user.role === 'vendeur' && order.vendeur_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Cette commande ne vous appartient pas' });
    }

    // Déterminer le nouveau statut
    const newStatus = action === 'reject' ? 'annule' : 'traitee';

    // Marquer la commande comme traitée ou annulée
    await pool.query(
      'UPDATE commandes SET statut = ?, date_traitement = NOW() WHERE id = ?',
      [newStatus, orderId]
    );

    // Si la commande est acceptée, mettre à jour le streak du client
    if (action === 'accept') {
      const [[client]] = await pool.query('SELECT streak_consecutif, dernier_achat_date, badge_niveau FROM utilisateurs WHERE id = ? FOR UPDATE', [order.utilisateur_id]);
      const [[{ today }]] = await pool.query('SELECT CURRENT_DATE() AS today');
      const [[{ yesterday }]] = await pool.query('SELECT DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY) AS yesterday');
      
      let newStreak = 1;
      if (client?.dernier_achat_date && String(client.dernier_achat_date) === String(yesterday)) {
        newStreak = client.streak_consecutif + 1;
      }

      await pool.query('UPDATE utilisateurs SET streak_consecutif = ?, dernier_achat_date = ?, eligible_loterie = (badge_niveau >= 4) WHERE id = ?', [newStreak, today, order.utilisateur_id]);

      // Vérifier badge
      const [defs] = await pool.query('SELECT niveau, jours_consecutifs_requis FROM badges_definitions ORDER BY niveau');
      let awarded = null;
      for (const d of defs) {
        if (newStreak >= d.jours_consecutifs_requis) awarded = d.niveau;
      }
      if (awarded && awarded > (client?.badge_niveau || 0)) {
        await pool.query('UPDATE utilisateurs SET badge_niveau = ?, eligible_loterie = (? >= 4) WHERE id = ?', [awarded, awarded, order.utilisateur_id]);
      }
      await pool.query('INSERT INTO progression_badges_utilisateurs (utilisateur_id, date_jour, streak_apres, badge_attribue) VALUES (?, CURRENT_DATE(), ?, ?)', [order.utilisateur_id, newStreak, awarded]);
    }

    const message = action === 'reject' ? 'Commande refusée' : 'Commande traitée avec succès';
    return res.json({ success: true, message });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur traitement commande', detail: String(err) });
  }
});

module.exports = router;




