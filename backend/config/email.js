const nodemailer = require('nodemailer');

let transporter = null;

function getEmailTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback mock transporter
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('--- [DEV EMAIL SIMULATION] ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
        console.log('------------------------------');
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  try {
    const t = getEmailTransporter();
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || '"E-FIR Portal Support" <no-reply@efir.gov.in>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ''),
      html,
    });
    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    // Don't crash request if email notification fails
    return null;
  }
}

module.exports = {
  getEmailTransporter,
  sendEmail,
};
