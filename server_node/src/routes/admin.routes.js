const express = require('express');
const bcrypt = require('bcrypt');
const { getDbPool } = require('../config/db');
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
    const pool = getDbPool();
    const [vendors] = await pool.query(
      "SELECT id, nom, prenom, email, whatsapp, institut, parcours, created_at FROM utilisateurs WHERE role = 'vendeur' ORDER BY nom, prenom"
    );
    
    return res.json({ success: true, vendors });
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
    const pool = getDbPool();
    const hash = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO utilisateurs (nom, prenom, email, whatsapp, institut, parcours, hash_mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?, ?, "vendeur")',
      [nom, prenom, email, whatsapp || null, institut, parcours, hash]
    );
    
    return res.json({ success: true, message: 'Vendeur créé avec succès' });
  } catch (err) {
    const errorMessage = String(err?.message || '');
    if (errorMessage.includes('Duplicate entry')) {
      if (errorMessage.includes('email')) {
        return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      } else if (errorMessage.includes('whatsapp')) {
        return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }
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
    const pool = getDbPool();
    
    // Vérifier que le vendeur existe
    const [[vendor]] = await pool.query('SELECT id FROM utilisateurs WHERE id = ? AND role = "vendeur"', [id]);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    let updateQuery = 'UPDATE utilisateurs SET nom = ?, prenom = ?, email = ?, whatsapp = ?, institut = ?, parcours = ?';
    let updateParams = [nom, prenom, email, whatsapp || null, institut, parcours];

    // Inclure le mot de passe seulement s'il est fourni
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateQuery += ', hash_mot_de_passe = ?';
      updateParams.push(hash);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);
    
    return res.json({ success: true, message: 'Vendeur modifié avec succès' });
  } catch (err) {
    const errorMessage = String(err?.message || '');
    if (errorMessage.includes('Duplicate entry')) {
      if (errorMessage.includes('email')) {
        return res.status(409).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      } else if (errorMessage.includes('whatsapp')) {
        return res.status(409).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      }
    }
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
    const pool = getDbPool();
    
    // Vérifier que le vendeur existe
    const [[vendor]] = await pool.query('SELECT id, nom, prenom FROM utilisateurs WHERE id = ? AND role = "vendeur"', [vendeur_id]);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    // Vérifier s'il y a déjà une allocation pour aujourd'hui
    const [[existingAllocation]] = await pool.query(
      'SELECT id, stock_restant FROM allocations_vendeurs WHERE vendeur_id = ? AND date_jour = CURRENT_DATE()',
      [vendeur_id]
    );

    if (existingAllocation) {
      // Mettre à jour l'allocation existante
      await pool.query(
        'UPDATE allocations_vendeurs SET stock_restant = stock_restant + ? WHERE id = ?',
        [quantite, existingAllocation.id]
      );
    } else {
      // Créer une nouvelle allocation
      await pool.query(
        'INSERT INTO allocations_vendeurs (vendeur_id, stock_restant, date_jour) VALUES (?, ?, CURRENT_DATE())',
        [vendeur_id, quantite]
      );
    }
    
    return res.json({ success: true, message: `${quantite} croissants alloués à ${vendor.nom} ${vendor.prenom}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'allocation', detail: String(err) });
  }
});

// GET /api/admin/revenue/:date - Chiffre d'affaires pour une date donnée
router.get('/revenue/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const pool = getDbPool();
    
    const [[{ revenue }]] = await pool.query(
      'SELECT COALESCE(SUM(prix_total), 0) as revenue FROM commandes WHERE statut = "traitee" AND DATE(date_commande) = ?',
      [date]
    );
    
    res.json({ success: true, revenue: revenue || 0 });
  } catch (err) {
    console.error('Erreur récupération chiffre d\'affaires:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

// GET /api/admin/product-stats/:date - Statistiques produit du jour
router.get('/product-stats/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const pool = getDbPool();
    
    // Commandes acceptées pour cette date
    const [[{ acceptedOrders }]] = await pool.query(
      'SELECT COUNT(*) as acceptedOrders FROM commandes WHERE statut = "traitee" AND DATE(date_commande) = ?',
      [date]
    );
    
    // Total des allocations pour cette date
    const [[{ totalAllocations }]] = await pool.query(
      'SELECT COALESCE(SUM(stock_alloue), 0) as totalAllocations FROM allocations_vendeurs WHERE date_jour = ?',
      [date]
    );
    
    res.json({ 
      success: true, 
      acceptedOrders: acceptedOrders || 0,
      totalAllocations: totalAllocations || 0
    });
  } catch (err) {
    console.error('Erreur récupération stats produit:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur', detail: String(err) });
  }
});

// GET /api/admin/vendors-stats/:date - Liste des vendeurs avec leurs stats
router.get('/vendors-stats/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const pool = getDbPool();
    
    const [vendors] = await pool.query(`
      SELECT 
        u.id,
        u.nom,
        u.prenom,
        u.institut,
        u.parcours,
        COALESCE(latest_allocation.stock_alloue, 0) as stock_alloue,
        COALESCE(latest_allocation.stock_restant, 0) as stock_restant,
        COALESCE(order_stats.accepted_orders, 0) as accepted_orders
      FROM utilisateurs u
      LEFT JOIN (
        SELECT 
          av1.vendeur_id,
          av1.stock_alloue,
          av1.stock_restant
        FROM allocations_vendeurs av1
        WHERE av1.date_jour = ?
        AND av1.id = (
          SELECT MAX(av2.id) 
          FROM allocations_vendeurs av2 
          WHERE av2.vendeur_id = av1.vendeur_id 
          AND av2.date_jour = ?
        )
      ) latest_allocation ON u.id = latest_allocation.vendeur_id
      LEFT JOIN (
        SELECT 
          vendeur_id,
          COUNT(*) as accepted_orders
        FROM commandes 
        WHERE statut = "traitee" AND DATE(date_commande) = ?
        GROUP BY vendeur_id
      ) order_stats ON u.id = order_stats.vendeur_id
      WHERE u.role = 'vendeur'
      ORDER BY u.nom, u.prenom
    `, [date, date, date]);
    
    res.json({ success: true, vendors });
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
