// middleware/authMiddleware.js
exports.ensureLoggedIn = (req, res, next) => {
  if (req.session && req.session.user) return next();
  req.session.returnTo = req.originalUrl;
  return res.redirect('/auth/login');
};