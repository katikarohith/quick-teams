// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const methodOverride = require('method-override');

const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const dashboardRoutes = require('./routes/dashboard');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/quickteams';

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Sessions (store in mongo)
app.use(session({
  secret: process.env.SESSION_SECRET || 'devsecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGO_URI }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Make session user available in templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

// Start
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('DB connection error', err);
    process.exit(1);
  });