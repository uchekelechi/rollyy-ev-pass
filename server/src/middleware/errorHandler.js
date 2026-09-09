// Centralised error responder so route handlers can just call next(error).
export function errorHandler(error, req, res, _next) {
  console.error(error);
  const status = error.status || 502;
  res.status(status).json({ error: error.message || 'Unexpected server error.' });
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
}
