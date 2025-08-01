const express = require('express');
const router = express.Router();
const db = require('../models');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

function encrypt(text) { return text; } // TODO: Implement encryption
function decrypt(text) { return text; } // TODO: Implement decryption

// List SMTP configs
router.get('/', async (req, res) => {
  const configs = await db.SmtpConfig.findAll({ where: { UserId: req.session.user.id } });
  res.render('smtp/index', { configs });
});

// New SMTP form
router.get('/new', (req, res) => res.render('smtp/new'));

// Create SMTP
router.post('/',
  body('host').notEmpty(),
  body('port').isInt(),
  body('username').notEmpty(),
  body('password').notEmpty(),
  body('from_email').isEmail(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', 'Please fill all fields correctly.');
      return res.redirect('/smtp/new');
    }
    await db.SmtpConfig.create({
      ...req.body,
      password: encrypt(req.body.password),
      UserId: req.session.user.id
    });
    req.flash('success', 'SMTP configuration added!');
    res.redirect('/smtp');
  }
);

// Edit SMTP
router.get('/:id/edit', async (req, res) => {
  const config = await db.SmtpConfig.findOne({ where: { id: req.params.id, UserId: req.session.user.id } });
  if (!config) return res.redirect('/smtp');
  res.render('smtp/edit', { config });
});

// Update SMTP
router.put('/:id', async (req, res) => {
  const config = await db.SmtpConfig.findOne({ where: { id: req.params.id, UserId: req.session.user.id } });
  if (!config) return res.redirect('/smtp');
  await config.update({
    ...req.body,
    password: encrypt(req.body.password)
  });
  req.flash('success', 'SMTP updated.');
  res.redirect('/smtp');
});

// Delete SMTP
router.delete('/:id', async (req, res) => {
  await db.SmtpConfig.destroy({ where: { id: req.params.id, UserId: req.session.user.id } });
  req.flash('success', 'SMTP deleted.');
  res.redirect('/smtp');
});

// Set active
router.post('/:id/set-active', async (req, res) => {
  await db.SmtpConfig.update({ active: false }, { where: { UserId: req.session.user.id } });
  await db.SmtpConfig.update({ active: true }, { where: { id: req.params.id, UserId: req.session.user.id } });
  req.flash('success', 'Set as active SMTP.');
  res.redirect('/smtp');
});

// Test SMTP
router.post('/:id/test', async (req, res) => {
  const config = await db.SmtpConfig.findOne({ where: { id: req.params.id, UserId: req.session.user.id } });
  if (!config) return res.redirect('/smtp');
  try {
    let transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: decrypt(config.password)
      }
    });
    await transporter.sendMail({
      from: config.from_email,
      to: req.session.user.email,
      subject: 'Test Email from MailMicro',
      text: 'SMTP connection successful!'
    });
    req.flash('success', 'Test email sent.');
  } catch (err) {
    req.flash('error', `SMTP test failed: ${err.message}`);
  }
  res.redirect('/smtp');
});

module.exports = router;