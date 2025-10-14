const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { getDbPool } = require('../config/db');

// GET /api/product - public
router.get('/', async (req, res) => {
  const pool = getDbPool();
  const [rows] = await pool.query('SELECT * FROM produit_unique WHERE id = 1');
  return res.json({ success: true, data: rows[0] || null });
});

// PATCH /api/product - admin
router.patch('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { nom, prix, statut } = req.body;
  const pool = getDbPool();
  await pool.query(
    'UPDATE produit_unique SET nom = COALESCE(?, nom), prix = COALESCE(?, prix), statut = COALESCE(?, statut), updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [nom ?? null, prix ?? null, statut ?? null]
  );
  return res.json({ success: true, message: 'Produit mis à jour' });
});

// PATCH /api/product/stock - admin
router.patch('/stock', authMiddleware, requireRole('admin'), async (req, res) => {
  const { stock_total_du_jour } = req.body;
  const pool = getDbPool();
  await pool.query(
    'UPDATE produit_unique SET stock_total_du_jour = ?, stock_restant_du_jour = ? WHERE id = 1',
    [Number(stock_total_du_jour), Number(stock_total_du_jour)]
  );
  return res.json({ success: true, message: 'Stock mis à jour' });
});

module.exports = router;






