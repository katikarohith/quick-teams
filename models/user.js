// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  skills: { type: [String], default: [] },
  needs: { type: [String], default: [] }, // optional: what they seek
  availability: { type: String, default: '' },
  joinedEvents: { type: [String], default: [] },
  role: { type: String, default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);