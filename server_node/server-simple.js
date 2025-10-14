const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { port, corsOrigin } = require('./src/config/env');
const { connectDB } = require('./src/config/mongodb');

const app = express();
const PORT = port;

// Connexion à MongoDB
connectDB().catch(console.error);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      return callback(null, true);
    }
    const allowed = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// Routes API
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/product', require('./src/routes/product.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));

// Health check (DB connectivity)
app.get('/api/health', async (req, res) => {
  try {
    const { getDb } = require('./src/config/mongodb');
    const db = getDb();
    await db.admin().ping();
    return res.json({ ok: true, db: 'connected' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API !' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
