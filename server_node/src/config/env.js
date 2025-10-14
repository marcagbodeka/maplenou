const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  // Allow comma-separated list of origins (e.g., "http://localhost:5173,http://192.168.0.113:5175")
  corsOrigin:
    (process.env.CORS_ORIGIN || 'http://localhost:5173,http://192.168.0.113:5173,http://192.168.0.113:5175')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-prod',
  stockDailyCap: Number(process.env.STOCK_DAILY_CAP || 0),
  reservationCutoffMinutes: Number(process.env.RESERVATION_CUTOFF_MINUTES || 0),
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'maplenou'
  }
};



