const express = require('express');
const router = express.Router();

// Demo login/logout (stub)
router.get('/login', (req, res) => {
  res.render('auth/login');
});
router.post('/login', (req, res) => {
  // Actual logic not implemented (see app.js mock user)
  req.flash('success', 'Logged in (demo)');
  res.redirect('/dashboard');
});
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;