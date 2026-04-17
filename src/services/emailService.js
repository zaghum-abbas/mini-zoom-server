const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter;

const getTransporter = () => {
  if (!env.smtp.host || !env.smtp.user) {
    return null;
  }
  if (!transporter) {
    const port = env.smtp.port;
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port,
      secure: port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

const sendMail = async ({ to, subject, text, html }) => {
  const tx = getTransporter();
  if (!tx) {
    return { stub: true };
  }
  return tx.sendMail({
    from: { name: env.smtp.fromName || 'Mini Meeting', address: env.smtp.from },
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendMail };
