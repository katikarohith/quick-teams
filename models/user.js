// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  skills: { 
    type: [String], 
    default: [] 
  },
  needs: { 
    type: [String], 
    default: [] 
  },
  availability: { 
    type: String, 
    default: '' 
  },
  joinedEvents: { 
    type: [String], 
    default: [] 
  },

  // ✅ New fields for team system
  teamMembers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],

  notifications: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      type: { type: String, default: "team-request" }, // team-request
      status: { type: String, default: "pending" }     // pending | accepted | rejected
    }
  ],

  role: { 
    type: String, 
    default: 'user' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// ✅ Fix for "OverwriteModelError"
// Reuse the model if it already exists (important with nodemon reloads)
module.exports = mongoose.models.User || mongoose.model('User', userSchema);