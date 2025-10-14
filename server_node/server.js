const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { port, corsOrigin, db: dbCfg } = require('./src/config/env');
const { getDbPool } = require('./src/config/db');
const { scheduleDailyReset } = require('./src/jobs/dailyReset');
const { initializeProduction } = require('./scripts/init-production');

const app = express();
const PORT = port;

// Initialisation automatique en production
if (process.env.NODE_ENV === 'production') {
  initializeProduction().catch(console.error);
}

// Middleware
// Support multiple allowed origins and handle preflight
app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (no origin header)
    if (!origin) return callback(null, true);

    // In development, allow private LAN origins (e.g., phone on same Wi‑Fi)
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

// Prime DB pool (throws if misconfigured)
getDbPool();

// Routes de base
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API !' });
});

// Routes API
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/product', require('./src/routes/product.routes'));
app.use('/api/orders', require('./src/routes/orders.routes'));
app.use('/api/admin', require('./src/routes/admin.routes'));

// Health check (DB connectivity)
app.get('/api/health', async (req, res) => {
  try {
    const pool = getDbPool();
    const [rows] = await pool.query('SELECT 1 AS ok');
    return res.json({ ok: true, db: rows?.[0]?.ok === 1 });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  // Planifier les tâches quotidiennes
  scheduleDailyReset();
});