// routes/dashboard.js
const express = require('express');
const router = express.Router();
const asyncWrap = require('../utils/asyncWrap');
const { ensureLoggedIn } = require('../middleware/authMiddleware');
const User = require('../models/user');

// Dashboard show
router.get('/', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  if (!user) {
    req.session.destroy(() => {});
    return res.redirect('/auth/login');
  }
  res.render('dashboard', { user });
}));

// Profile edit (GET)
router.get('/profile', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.render('profile', { user, errors: [] });
}));

// Profile edit (POST)
router.post('/profile', ensureLoggedIn, asyncWrap(async (req, res) => {
  const { name, skills, needs, availability } = req.body;
  const skillsArr = (skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const needsArr = (needs || '').split(',').map(s => s.trim()).filter(Boolean);

  await User.findByIdAndUpdate(req.session.user.id, {
    name: name || undefined,
    skills: skillsArr,
    needs: needsArr,
    availability: availability || ''
  });

  // update session display name
  req.session.user.name = name;
  res.redirect('/dashboard');
}));

// Matchmaking page
router.get('/match', ensureLoggedIn, asyncWrap(async (req, res) => {
  const current = await User.findById(req.session.user.id).lean();
  // simple scoring: users who have skills that match current.needs and whose needs match current.skills and availability match
  const others = await User.find({ _id: { $ne: current._id } }).lean();

  const scored = others.map(o => {
    let score = 0;
    // if their skills satisfy your needs
    if (current.needs && current.needs.length) {
      current.needs.forEach(n => {
        if (o.skills && o.skills.includes(n)) score += 3;
      });
    }
    // complementary: if your skills satisfy their needs
    if (o.needs && o.needs.length) {
      o.needs.forEach(n => {
        if (current.skills && current.skills.includes(n)) score += 2;
      });
    }
    // availability
    if (current.availability && o.availability && current.availability === o.availability) score += 1;
    return { user: o, score };
  });

  scored.sort((a,b) => b.score - a.score);
  res.render('matchmaking', { current, results: scored.slice(0,10) });
}));

// Community events (static list + join)
const EVENTS = [
  { id: 'hack1', title: '24h Hackathon', date: '2025-09-10', desc: 'Campus hackathon' },
  { id: 'study1', title: 'DSA Study Group', date: '2025-09-16', desc: 'Daily practice group' },
  { id: 'ml1', title: 'ML Club Meetup', date: '2025-09-20', desc: 'Intro to ML' }
];

router.get('/community', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.render('community', { events: EVENTS, user });
}));

router.post('/community/join', ensureLoggedIn, asyncWrap(async (req, res) => {
  const { eventId } = req.body;
  const user = await User.findById(req.session.user.id);
  if (!user.joinedEvents.includes(eventId)) {
    user.joinedEvents.push(eventId);
    await user.save();
  }
  res.redirect('/dashboard/community');
}));

module.exports = router;