const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
const { logAudit } = require('../services/auditService');

// Register Citizen
async function register(req, res, next) {
  try {
    const { name, email, mobile, password, address, city, state, pincode } = req.body;

    // Validation
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile number, and password are required fields.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Check existing email
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const insertRes = await db.query(
      `INSERT INTO users (name, email, mobile, password_hash, role, address, city, state, pincode, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'citizen', $5, $6, $7, $8, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, mobile, role, address, city, state, pincode, created_at`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        mobile.trim(),
        passwordHash,
        address || '',
        city || '',
        state || '',
        pincode || '',
      ]
    );

    const user = insertRes.rows[0];

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'CITIZEN_REGISTRATION',
      entityType: 'users',
      entityId: user.id,
      newValue: { name: user.name, email: user.email },
      req,
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Citizen registration completed successfully.',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Login (Email or Mobile)
async function login(req, res, next) {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginIdentifier = (identifier || email || mobile || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Mobile and password are required to login.',
      });
    }

    // Find by email or mobile
    const userRes = await db.query(
      `SELECT u.*, o.id AS officer_id, o.employee_id, o.rank, o.police_station_id, o.department,
              ps.station_name, ps.station_code
       FROM users u
       LEFT JOIN officers o ON u.id = o.user_id
       LEFT JOIN police_stations ps ON o.police_station_id = ps.id
       WHERE LOWER(u.email) = LOWER($1) OR u.mobile = $1`,
      [loginIdentifier]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email/mobile and password.',
      });
    }

    const user = userRes.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is currently suspended or inactive. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email/mobile and password.',
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      newValue: { role: user.role },
      req,
    });

    const sanitizedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      officerId: user.officer_id,
      employeeId: user.employee_id,
      rank: user.rank,
      policeStationId: user.police_station_id,
      policeStationName: user.station_name,
      policeStationCode: user.station_code,
      department: user.department,
    };

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
}

// Get Profile
async function getProfile(req, res, next) {
  try {
    const userRes = await db.query(
      `SELECT u.id, u.name, u.email, u.mobile, u.role, u.address, u.city, u.state, u.pincode, u.status, u.created_at,
              o.id AS officer_id, o.employee_id, o.rank, o.police_station_id, o.department,
              ps.station_name, ps.station_code
       FROM users u
       LEFT JOIN officers o ON u.id = o.user_id
       LEFT JOIN police_stations ps ON o.police_station_id = ps.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const u = userRes.rows[0];
    res.json({
      success: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        role: u.role,
        address: u.address,
        city: u.city,
        state: u.state,
        pincode: u.pincode,
        officerId: u.officer_id,
        employeeId: u.employee_id,
        rank: u.rank,
        policeStationId: u.police_station_id,
        policeStationName: u.station_name,
        policeStationCode: u.station_code,
        department: u.department,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update Profile
async function updateProfile(req, res, next) {
  try {
    const { name, mobile, address, city, state, pincode } = req.body;

    const updateRes = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           mobile = COALESCE($2, mobile),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           pincode = COALESCE($6, pincode),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, email, mobile, role, address, city, state, pincode`,
      [name, mobile, address, city, state, pincode, req.user.id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      entityType: 'users',
      entityId: req.user.id,
      newValue: { name, mobile, city },
      req,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updateRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Change Password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const u = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, u.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newHash, req.user.id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'users',
      entityId: req.user.id,
      req,
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Forgot Password
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const userRes = await db.query('SELECT id, name, email FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userRes.rows.length === 0) {
      // Return 200 for security, to avoid account enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset instruction has been sent.',
      });
    }

    // In a production system, a cryptographic reset token with expiry is stored
    res.json({
      success: true,
      message: 'Password reset link / instructions sent to your registered email address.',
      demoNote: 'For demonstration testing, you can use the default demo password: Password@123',
    });
  } catch (error) {
    next(error);
  }
}

// Reset Password
async function resetPassword(req, res, next) {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = LOWER($2) RETURNING id`,
      [hash, email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User with this email not found.' });
    }

    res.json({
      success: true,
      message: 'Password has been successfully reset. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

// Logout
async function logout(req, res) {
  if (req.user) {
    await logAudit({
      userId: req.user.id,
      action: 'USER_LOGOUT',
      entityType: 'users',
      entityId: req.user.id,
      req,
    });
  }
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
