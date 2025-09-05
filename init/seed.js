// init/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quickteams";

async function seed() {
  await mongoose.connect(MONGO_URI);

  console.log("Connected to DB... clearing old data...");
  await User.deleteMany({}); // clear users

  const hash = await bcrypt.hash("password123", 10);

  const users = [
    {
      name: "Arshad",
      email: "arshad@example.com",
      passwordHash: hash,
      skills: ["React", "Node.js"],
      needs: ["MongoDB", "UI Design"],
      availability: "Evenings",
    },
    {
      name: "Siddharth",
      email: "sid@example.com",
      passwordHash: hash,
      skills: ["MongoDB", "Express"],
      needs: ["React"],
      availability: "Weekends",
    },
    {
      name: "Ganesh",
      email: "ganesh@example.com",
      passwordHash: hash,
      skills: ["Python", "Machine Learning"],
      needs: ["Frontend"],
      availability: "Mornings",
    },
    {
      name: "Rohith",
      email: "rohith@example.com",
      passwordHash: hash,
      skills: ["UI/UX", "Bootstrap"],
      needs: ["Backend"],
      availability: "Anytime",
    },
  ];

  await User.insertMany(users);
  console.log("✅ Users seeded!");

  mongoose.disconnect();
}

seed();