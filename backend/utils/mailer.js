const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendReminderMail(to, subject, html) {
  return transporter.sendMail({
    from: `"UpLift" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = sendReminderMail;
