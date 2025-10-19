function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query
      });
      req.validated = parsed;
      next();
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors || String(err) });
    }
  };
}

module.exports = { validate };








