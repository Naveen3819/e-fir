const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'efir_super_secure_jwt_secret_key_2026';

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid format. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your session has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization token. Please log in again.',
      });
    }

    // Verify user in database
    const userQuery = await db.query(
      `SELECT u.id, u.name, u.email, u.mobile, u.role, u.status, u.city, u.state, u.pincode, u.address,
              o.id AS officer_id, o.employee_id, o.rank, o.police_station_id, o.department,
              ps.station_name, ps.station_code
       FROM users u
       LEFT JOIN officers o ON u.id = o.user_id
       LEFT JOIN police_stations ps ON o.police_station_id = ps.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (userQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deleted.',
      });
    }

    const user = userQuery.rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated or suspended. Please contact administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server authentication error.',
    });
  }
}

module.exports = {
  authenticate,
  JWT_SECRET,
};
