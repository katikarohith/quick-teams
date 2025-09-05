const express = require('express');
const router = express.Router();
const asyncWrap = require('../utils/asyncWrap');
const { ensureLoggedIn } = require('../middleware/authMiddleware');
const User = require('../models/user');

// =====================
// Dashboard Home
// =====================
router.get('/', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id)
    .populate('teamMembers', 'name email')
    .populate('notifications.from', 'name email')
    .lean();

  res.render('dashboard', { user });
}));

// =====================
// Profile - GET
// =====================
router.get('/profile', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();
  res.render('profile', { user, errors: [] });
}));

// =====================
// Profile - POST (update)
// =====================
router.post('/profile', ensureLoggedIn, asyncWrap(async (req, res) => {
  const { name, skills, needs, availability } = req.body;
  const skillsArr = (skills || '').split(',').map(s => s.trim()).filter(Boolean);
  const needsArr = (needs || '').split(',').map(s => s.trim()).filter(Boolean);

  await User.findByIdAndUpdate(req.session.user.id, {
    name,
    skills: skillsArr,
    needs: needsArr,
    availability
  });

  req.session.user.name = name;
  res.redirect('/dashboard');
}));

// =====================
// Matchmaking search
// =====================
router.get('/search', ensureLoggedIn, asyncWrap(async (req, res) => {
  const { skills } = req.query;
  const current = await User.findById(req.session.user.id).lean();

  if (!skills || !skills.trim()) {
    return res.render('matchmaking', { current, results: [], message: "Enter skills to search" });
  }

  const skillList = skills.split(',').map(s => s.trim().toLowerCase());
  const others = await User.find({ _id: { $ne: current._id } }).lean();

  const scored = others.map(o => {
    let matchCount = 0;
    if (o.skills && o.skills.length) {
      skillList.forEach(s => {
        if (o.skills.map(x => x.toLowerCase()).includes(s)) {
          matchCount++;
        }
      });
    }
    return { user: o, score: matchCount };
  }).filter(r => r.score > 0);

  scored.sort((a, b) => b.score - a.score);

  res.render('matchmaking', { current, results: scored, message: scored.length ? null : "No users found" });
}));

// =====================
// Send Team Request
// =====================
router.post('/request/:id', ensureLoggedIn, asyncWrap(async (req, res) => {
  const targetId = req.params.id;
  const currentId = req.session.user.id;

  if (targetId === currentId) return res.redirect('/dashboard/match');

  const targetUser = await User.findById(targetId);
  if (!targetUser) return res.redirect('/dashboard/match');

  const already = targetUser.notifications.find(
    n => n.from.toString() === currentId && n.status === "pending"
  );
  if (!already) {
    targetUser.notifications.push({ from: currentId });
    await targetUser.save();
  }

  res.redirect('/dashboard/match');
}));

// =====================
// Accept Team Request
// =====================
router.post('/accept/:fromId', ensureLoggedIn, asyncWrap(async (req, res) => {
  const currentId = req.session.user.id;
  const fromId = req.params.fromId;

  const user = await User.findById(currentId);
  const fromUser = await User.findById(fromId);

  if (!user || !fromUser) return res.redirect('/dashboard');

  const notif = user.notifications.find(n => n.from.toString() === fromId && n.status === "pending");
  if (notif) notif.status = "accepted";

  if (!user.teamMembers.includes(fromId)) user.teamMembers.push(fromId);
  if (!fromUser.teamMembers.includes(currentId)) fromUser.teamMembers.push(currentId);

  await user.save();
  await fromUser.save();

  res.redirect('/dashboard');
}));

// =====================
// Default Match Page
// =====================
router.get('/match', ensureLoggedIn, asyncWrap(async (req, res) => {
  const current = await User.findById(req.session.user.id).lean();
  res.render('matchmaking', { current, results: [], message: null });
}));

// =====================
// Community Page
// =====================
router.get('/community', ensureLoggedIn, asyncWrap(async (req, res) => {
  const user = await User.findById(req.session.user.id).lean();

  // Demo events
  const events = [
    { name: "Hackathon 2025", description: "Team up for an exciting hackathon", date: "Sept 10, 2025" },
    { name: "Study Group - AI/ML", description: "Learn ML basics with peers", date: "Sept 15, 2025" },
    { name: "E-Sports Tournament", description: "Join 5v5 gaming tournament", date: "Sept 20, 2025" }
  ];

  res.render('community', { user, events });
}));

// =====================
// Join Event
// =====================
router.post('/join/:eventName', ensureLoggedIn, asyncWrap(async (req, res) => {
  const eventName = req.params.eventName;
  const user = await User.findById(req.session.user.id);

  if (!user.joinedEvents.includes(eventName)) {
    user.joinedEvents.push(eventName);
    await user.save();
  }

  res.redirect('/dashboard/community');
}));

module.exports = router;