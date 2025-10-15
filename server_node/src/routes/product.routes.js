const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { getCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// GET /api/product - public
router.get('/', async (req, res) => {
  try {
    const col = getCollection('produit_unique');
    // Try fixed ID first, else fallback to first document
    const fixedId = new ObjectId('652a71111111111111111111');
    let doc = await col.findOne({ _id: fixedId });
    if (!doc) {
      doc = await col.findOne({});
    }
    return res.json({ success: true, data: doc || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur produit', detail: String(err) });
  }
});

// PATCH /api/product - admin
router.patch('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { nom, prix, statut } = req.body || {};
    const col = getCollection('produit_unique');
    const fixedId = new ObjectId('652a71111111111111111111');
    await col.updateOne(
      { _id: fixedId },
      { $set: { ...(nom !== undefined ? { nom } : {}), ...(prix !== undefined ? { prix } : {}), ...(statut !== undefined ? { statut } : {}), updated_at: new Date() } },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Produit mis à jour' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur mise à jour produit', detail: String(err) });
  }
});

// PATCH /api/product/stock - admin
router.patch('/stock', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { stock_total_du_jour } = req.body || {};
    const total = Number(stock_total_du_jour);
    if (!Number.isFinite(total) || total < 0) {
      return res.status(400).json({ success: false, message: 'Quantité invalide' });
    }
    const col = getCollection('produit_unique');
    const fixedId = new ObjectId('652a71111111111111111111');
    await col.updateOne(
      { _id: fixedId },
      { $set: { stock_total_du_jour: total, stock_restant_du_jour: total, updated_at: new Date() } },
      { upsert: true }
    );
    return res.json({ success: true, message: 'Stock mis à jour' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur mise à jour stock', detail: String(err) });
  }
});

module.exports = router;






