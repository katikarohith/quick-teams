// middleware/errorHandler.js
// middleware/errorHandler.js
function notFound(req, res, next) {
  res.status(404);
  if (req.accepts('html')) return res.render('error', { status: 404, message: 'Page not found' });
  return res.json({ error: 'Not found' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status);
  if (req.accepts('html')) {
    return res.render('error', { status, message: err.message || 'Internal Server Error' });
  }
  return res.json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };