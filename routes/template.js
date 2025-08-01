const express = require('express');
const router = express.Router();
const db = require('../models');
const multer = require('multer');
const path = require('path');

// Multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/logos/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// List templates
router.get('/', async (req, res) => {
  const templates = await db.Template.findAll({ where: { UserId: req.session.user.id } });
  res.render('templates/index', { templates });
});

// New template form
router.get('/new', (req, res) => res.render('templates/new'));

// Create template
router.post('/', upload.single('logo'), async (req, res) => {
  const { name, header_text, footer_text, header_bg, footer_bg, body_bg, body_html } = req.body;
  await db.Template.create({
    name,
    logo: req.file ? '/uploads/logos/' + req.file.filename : null,
    header_text,
    footer_text,
    colors: { header: header_bg, footer: footer_bg, body: body_bg },
    body_html,
    UserId: req.session.user.id
  });
  req.flash('success', 'Template created!');
  res.redirect('/templates');
});

// Edit template
router.get('/:id/edit', async (req, res) => {
  const template = await db.Template.findOne({ where: { id: req.params.id, UserId: req.session.user.id } });
  if (!template) return res.redirect('/templates');
  res.render('templates/edit', { template });
});

// Update template
router.post('/:id', upload.single('logo'), async (req, res) => {
  const template = await db.Template.findOne({ where: { id: req.params.id, UserId: req.session.user.id } });
  if (!template) return res.redirect('/templates');
  const { name, header_text, footer_text, header_bg, footer_bg, body_bg, body_html } = req.body;
  await template.update({
    name,
    logo: req.file ? '/uploads/logos/' + req.file.filename : template.logo,
    header_text,
    footer_text,
    colors: { header: header_bg, footer: footer_bg, body: body_bg },
    body_html
  });
  req.flash('success', 'Template updated.');
  res.redirect('/templates');
});

// Delete template
router.post('/:id/delete', async (req, res) => {
  await db.Template.destroy({ where: { id: req.params.id, UserId: req.session.user.id } });
  req.flash('success', 'Template deleted.');
  res.redirect('/templates');
});

module.exports = router;