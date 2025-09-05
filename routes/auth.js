// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const asyncWrap = require('../utils/asyncWrap');
const User = require('../models/user');

// GET register
router.get('/register', (req, res) => {
  res.render('register', { errors: [], form: {} });
});

// POST register
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars')
  ],
  asyncWrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).render('register', { errors: errors.array(), form: req.body });

    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(422).render('register', { errors: [{ msg: 'Email already used' }], form: req.body });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash: hash });
    await user.save();

    req.session.user = { id: user._id.toString(), email: user.email, name: user.name };
    // go to profile to fill details
    res.redirect('/dashboard/profile');
  })
);

// GET login
router.get('/login', (req, res) => {
  res.render('login', { errors: [], form: {} });
});

// POST login
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  asyncWrap(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).render('login', { errors: errors.array(), form: req.body });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }], form: req.body });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).render('login', { errors: [{ msg: 'Invalid credentials' }], form: req.body });

    // set session
    req.session.user = { id: user._id.toString(), email: user.email, name: user.name };
    const redirectTo = req.session.returnTo || '/dashboard';
    delete req.session.returnTo;
    res.redirect(redirectTo);
  })
);

// POST logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    return res.redirect('/');
  });
});

module.exports = router;