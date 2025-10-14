function ok(res, data = null, message = 'OK') {
  return res.json({ success: true, message, data });
}

function created(res, data = null, message = 'Created') {
  return res.status(201).json({ success: true, message, data });
}

function badRequest(res, message = 'Bad Request') {
  return res.status(400).json({ success: false, message });
}

function unauthorized(res, message = 'Unauthorized') {
  return res.status(401).json({ success: false, message });
}

function forbidden(res, message = 'Forbidden') {
  return res.status(403).json({ success: false, message });
}

function notFound(res, message = 'Not Found') {
  return res.status(404).json({ success: false, message });
}

function serverError(res, error, message = 'Internal Server Error') {
  const detail = process.env.NODE_ENV === 'development' ? String(error?.stack || error) : undefined;
  return res.status(500).json({ success: false, message, detail });
}

module.exports = { ok, created, badRequest, unauthorized, forbidden, notFound, serverError };




