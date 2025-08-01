require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

// Sequelize DB setup
const db = require('./models');

// Import routers
const authRoutes = require('./routes/auth');
const smtpRoutes = require('./routes/smtp');
const templateRoutes = require('./routes/template');
const campaignRoutes = require('./routes/campaign');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'mailmicrosecret',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// Flash messages and user for all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user;
    next();
});

// Demo: mock authentication (replace with real auth in production)
app.use(async (req, res, next) => {
    if (!req.session.user) {
        // Create/find a demo user
        const user = await db.User.findOrCreate({ where: { email: 'admin@demo.com' } });
        req.session.user = { id: user[0].id, email: user[0].email };
    }
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/smtp', smtpRoutes);
app.use('/templates', templateRoutes);
app.use('/campaigns', campaignRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// Sync DB and start server
const PORT = process.env.PORT || 3000;
db.sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`MailMicro Admin Dashboard running on http://localhost:${PORT}`);
    });
});