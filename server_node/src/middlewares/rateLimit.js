const rateLimit = require('express-rate-limit');

const orderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { orderLimiter };








