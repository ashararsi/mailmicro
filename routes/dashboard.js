const express = require('express');
const router = express.Router();
const db = require('../models');

router.get('/', async (req, res) => {
  const userId = req.session.user.id;
  const [smtpCount, templateCount, campaignCount, campaigns, recipients] = await Promise.all([
    db.SmtpConfig.count({ where: { UserId: userId } }),
    db.Template.count({ where: { UserId: userId } }),
    db.Campaign.count({ where: { UserId: userId } }),
    db.Campaign.findAll({ where: { UserId: userId }, order: [['createdAt', 'DESC']], limit: 5 }),
    db.Recipient.findAll({ 
      include: [{ model: db.Campaign, where: { UserId: userId } }]
    })
  ]);

  // Chart data: sent vs failed
  const sent = recipients.filter(r => r.status === 'sent').length;
  const failed = recipients.filter(r => r.status === 'failed').length;

  res.render('dashboard/index', {
    smtpCount,
    templateCount,
    campaignCount,
    campaigns,
    chartData: { sent, failed }
  });
});

module.exports = router;