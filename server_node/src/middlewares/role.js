function requireRole(...roles) {
  return function (req, res, next) {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ success: false, message: 'Non authentifié' });
    if (!roles.includes(role)) return res.status(403).json({ success: false, message: 'Accès refusé' });
    next();
  };
}

module.exports = { requireRole };






