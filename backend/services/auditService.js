const db = require('../config/db');

async function logAudit({ userId, action, entityType, entityId, oldValue, newValue, req }) {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress =
        req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1';
    }

    const oldStr = oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : null;
    const newStr = newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null;

    await db.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
      [userId || null, action, entityType, String(entityId || ''), oldStr, newStr, ipAddress]
    );
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
}

module.exports = {
  logAudit,
};
