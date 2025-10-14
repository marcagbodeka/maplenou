const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { port, corsOrigin } = require('./src/config/env');

const app = express();
const PORT = port;

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

// Routes API basiques
app.get('/api/health', async (req, res) => {
  try {
    // Test simple de connexion MongoDB
    const { MongoClient } = require('mongodb');
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return res.status(500).json({ ok: false, error: 'MONGODB_URI not configured' });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    
    return res.json({ ok: true, db: 'connected', message: 'MongoDB Atlas connection successful' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenue sur l\'API Maplenou !',
    status: 'running',
    mongodb_configured: !!process.env.MONGODB_URI
  });
});

// Routes temporaires pour test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API fonctionne',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? 'configured' : 'not configured'
    }
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI ? 'configured' : 'not configured'}`);
});

module.exports = app;
