const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'mailmicro.sqlite')
});

// User
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true }
});

// SMTP Config
const SmtpConfig = sequelize.define('SmtpConfig', {
  host: DataTypes.STRING,
  port: DataTypes.INTEGER,
  username: DataTypes.STRING,
  password: DataTypes.STRING, // encrypted!
  secure: DataTypes.BOOLEAN,
  from_email: DataTypes.STRING,
  active: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Template
const Template = sequelize.define('Template', {
  name: DataTypes.STRING,
  logo: DataTypes.STRING, // file path
  header_text: DataTypes.STRING,
  footer_text: DataTypes.STRING,
  colors: DataTypes.JSON, // {header,footer,body}
  body_html: DataTypes.TEXT
});

// Campaign
const Campaign = sequelize.define('Campaign', {
  name: DataTypes.STRING,
  status: { type: DataTypes.STRING, defaultValue: 'draft' }, // draft|running|completed|failed
  csv_file: DataTypes.STRING // file path
});

// Recipient
const Recipient = sequelize.define('Recipient', {
  email: DataTypes.STRING,
  variables: DataTypes.JSON, // CSV row
  status: { type: DataTypes.STRING, defaultValue: 'pending' }, // pending|sent|failed
  error: DataTypes.TEXT
});

// Relationships
User.hasMany(SmtpConfig);
SmtpConfig.belongsTo(User);

User.hasMany(Template);
Template.belongsTo(User);

User.hasMany(Campaign);
Campaign.belongsTo(User);

Campaign.belongsTo(Template);
Campaign.belongsTo(SmtpConfig);

Campaign.hasMany(Recipient);
Recipient.belongsTo(Campaign);

module.exports = {
  sequelize,
  User,
  SmtpConfig,
  Template,
  Campaign,
  Recipient
};