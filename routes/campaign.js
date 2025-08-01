const express = require('express');
const router = express.Router();
const db = require('../models');
const multer = require('multer');
const csvParse = require('csv-parse/lib/sync');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

// Multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/csvs/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// List campaigns
router.get('/', async (req, res) => {
  const campaigns = await db.Campaign.findAll({ where: { UserId: req.session.user.id }, include: [db.Template, db.SmtpConfig], order: [['createdAt', 'DESC']] });
  res.render('campaigns/index', { campaigns });
});

// New campaign form
router.get('/new', async (req, res) => {
  const templates = await db.Template.findAll({ where: { UserId: req.session.user.id } });
  const smtps = await db.SmtpConfig.findAll({ where: { UserId: req.session.user.id, active: true } });
  res.render('campaigns/new', { templates, smtps });
});

// Handle CSV upload and preview
router.post('/upload-csv', upload.single('recipients_csv'), async (req, res) => {
  if (!req.file) {
    req.flash('error', 'No file uploaded.');
    return res.redirect('/campaigns/new');
  }
  const input = fs.readFileSync(req.file.path);
  const records = csvParse(input, { columns: true });
  req.session.csv_preview = records;
  req.session.csv_file = req.file.filename;
  res.render('campaigns/csv_preview', { records });
});

// Create campaign
router.post('/', async (req, res) => {
  const { name, template_id, smtp_id } = req.body;
  if (!req.session.csv_preview || !req.session.csv_file) {
    req.flash('error', 'Please upload the recipients CSV.');
    return res.redirect('/campaigns/new');
  }
  // Create campaign
  const campaign = await db.Campaign.create({
    name,
    status: 'draft',
    csv_file: '/uploads/csvs/' + req.session.csv_file,
    UserId: req.session.user.id,
    TemplateId: template_id,
    SmtpConfigId: smtp_id
  });
  // Create recipients
  for (const record of req.session.csv_preview) {
    await db.Recipient.create({
      email: record.email,
      variables: record,
      CampaignId: campaign.id
    });
  }
  // Clear csv preview from session
  req.session.csv_preview = null;
  req.session.csv_file = null;
  req.flash('success', 'Campaign created! You can now start sending.');
  res.redirect('/campaigns');
});

// Send campaign (start bulk send)
router.post('/:id/send', async (req, res) => {
  const campaign = await db.Campaign.findOne({
    where: { id: req.params.id, UserId: req.session.user.id },
    include: [db.Template, db.SmtpConfig, db.Recipient]
  });
  if (!campaign) return res.redirect('/campaigns');
  campaign.status = 'running';
  await campaign.save();

  // Prepare transporter
  let transporter = nodemailer.createTransport({
    host: campaign.SmtpConfig.host,
    port: campaign.SmtpConfig.port,
    secure: campaign.SmtpConfig.secure,
    auth: { user: campaign.SmtpConfig.username, pass: campaign.SmtpConfig.password }
  });

  const templateHtml = campaign.Template.body_html;

  // Send emails with concurrency of 5
  const sendOne = async (recipient) => {
    try {
      // Merge variables into template
      let html = templateHtml;
      for (const key in recipient.variables) {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), recipient.variables[key]);
      }
      await transporter.sendMail({
        from: campaign.SmtpConfig.from_email,
        to: recipient.email,
        subject: campaign.name,
        html
      });
      recipient.status = 'sent';
      recipient.error = null;
    } catch (err) {
      recipient.status = 'failed';
      recipient.error = err.message;
    }
    await recipient.save();
  };
  // Simple concurrency
  const recipients = campaign.Recipients;
  let index = 0;
  const concurrency = 5;
  async function runQueue() {
    if (index >= recipients.length) return;
    const batch = recipients.slice(index, index + concurrency);
    await Promise.all(batch.map(sendOne));
    index += concurrency;
    setTimeout(runQueue, 500); // simple throttle
  }
  runQueue();

  campaign.status = 'completed';
  await campaign.save();

  req.flash('success', 'Sending started (async demo). Refresh to see progress.');
  res.redirect('/campaigns');
});

// Campaign detail/report
router.get('/:id', async (req, res) => {
  const campaign = await db.Campaign.findOne({
    where: { id: req.params.id, UserId: req.session.user.id },
    include: [db.Template, db.SmtpConfig, db.Recipient]
  });
  if (!campaign) return res.redirect('/campaigns');
  res.render('campaigns/detail', { campaign });
});

module.exports = router;