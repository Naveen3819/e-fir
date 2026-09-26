const db = require('../config/db');
const { sendEmail } = require('../config/email');

async function createNotification({ userId, message, type = 'info', link = null, sendMail = true }) {
  try {
    const result = await db.query(
      `INSERT INTO notifications (user_id, message, type, link, is_read, created_at)
       VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, message, type, link]
    );

    // If user has an email and sendMail is true, dispatch email notification
    if (sendMail && userId) {
      try {
        const userRes = await db.query(`SELECT email, name FROM users WHERE id = $1`, [userId]);
        if (userRes.rows.length > 0) {
          const user = userRes.rows[0];
          await sendEmail({
            to: user.email,
            subject: `[E-FIR Portal] Update regarding your request`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="background-color: #0b2545; color: #ffffff; padding: 15px; border-radius: 6px 6px 0 0; text-align: center;">
                  <h2>E-FIR Management System</h2>
                  <p style="margin: 0; font-size: 14px;">National Police Citizen Portal</p>
                </div>
                <div style="padding: 20px; color: #334155;">
                  <p>Dear <strong>${user.name}</strong>,</p>
                  <p>${message}</p>
                  ${
                    link
                      ? `<p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}" style="background-color: #1e3a8a; color: white; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Portal</a></p>`
                      : ''
                  }
                  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #64748b;">This is an automated notification from the E-FIR Management System. Please do not reply directly to this email.</p>
                </div>
              </div>
            `,
          });
        }
      } catch (e) {
        console.warn('Notification email dispatch failed:', e.message);
      }
    }

    return result.rows[0];
  } catch (error) {
    console.error('Create notification error:', error.message);
    return null;
  }
}

module.exports = {
  createNotification,
};
