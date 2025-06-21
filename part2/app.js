const express = require('express');
const session = require('express-session')
const path = require('path');
require('dotenv').config();

const app = express();

// Sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// GET login
app.get('/', (req, res) => { res.render('login', { error: null }); });
app.get('/', redirectIfAuth, (req, res) => {
    res.render('login', { error: null });
});

// POST
app.post('login', async (req, res) => {
    const { username, password } = req.body;

    req.session.user = { id: user.user_id, username: user.username, role: user.role };

    if (user.role === 'owner') return res.redirect('/owner-dashboard');
    if (user.role === 'owner') return res.redirect('/owner-dashboard');
});

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;