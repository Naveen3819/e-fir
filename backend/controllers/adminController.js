const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { logAudit } = require('../services/auditService');

// Admin Analytics & Dashboard KPIs
async function getAdminDashboard(req, res, next) {
  try {
    // 1. High-level metric counts
    const counts = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'citizen') AS total_citizens,
        (SELECT COUNT(*) FROM officers WHERE status = 'active') AS total_officers,
        (SELECT COUNT(*) FROM police_stations WHERE status = 'active') AS total_stations,
        (SELECT COUNT(*) FROM complaints) AS total_complaints,
        (SELECT COUNT(*) FROM complaints WHERE status IN ('Submitted', 'Under Verification', 'Information Required')) AS pending_complaints,
        (SELECT COUNT(*) FROM firs) AS total_firs,
        (SELECT COUNT(*) FROM complaints WHERE status = 'Under Investigation') AS active_investigations,
        (SELECT COUNT(*) FROM complaints WHERE status IN ('Resolved', 'Closed')) AS closed_cases
    `);

    // 2. Complaints by Category
    const categoryStats = await db.query(`
      SELECT cat.name, COUNT(c.id) AS count
      FROM complaint_categories cat
      LEFT JOIN complaints c ON cat.id = c.category_id
      GROUP BY cat.id, cat.name
      ORDER BY count DESC
    `);

    // 3. Complaints by Status
    const statusStats = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM complaints
      GROUP BY status
      ORDER BY count DESC
    `);

    // 4. Monthly Complaints & FIRs (last 6 months)
    const monthlyStats = await db.query(`
      SELECT TO_CHAR(c.created_at, 'Mon YYYY') AS month,
             DATE_TRUNC('month', c.created_at) AS sort_month,
             COUNT(c.id) AS complaints_count,
             COUNT(f.id) AS firs_count
      FROM complaints c
      LEFT JOIN firs f ON c.id = f.complaint_id
      GROUP BY sort_month, TO_CHAR(c.created_at, 'Mon YYYY')
      ORDER BY sort_month ASC
      LIMIT 6
    `);

    // 5. Police Station Workload
    const stationWorkload = await db.query(`
      SELECT ps.id, ps.station_name, ps.station_code, ps.district,
             COUNT(c.id) AS total_complaints,
             COUNT(CASE WHEN c.status IN ('Submitted', 'Under Verification') THEN 1 END) AS pending,
             COUNT(CASE WHEN c.status = 'FIR Registered' OR c.status = 'Under Investigation' THEN 1 END) AS active_cases,
             COUNT(f.id) AS firs_registered
      FROM police_stations ps
      LEFT JOIN complaints c ON ps.id = c.police_station_id
      LEFT JOIN firs f ON c.id = f.complaint_id
      GROUP BY ps.id, ps.station_name, ps.station_code, ps.district
      ORDER BY total_complaints DESC
    `);

    res.json({
      success: true,
      stats: counts.rows[0],
      charts: {
        byCategory: categoryStats.rows,
        byStatus: statusStats.rows,
        byMonth: monthlyStats.rows,
        stationWorkload: stationWorkload.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

// User Management (Citizens & Staff)
async function getUsers(req, res, next) {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];
    let pIdx = 1;

    if (role) {
      whereClauses.push(`role = $${pIdx++}`);
      params.push(role);
    }
    if (status) {
      whereClauses.push(`status = $${pIdx++}`);
      params.push(status);
    }
    if (search) {
      whereClauses.push(`(name ILIKE $${pIdx} OR email ILIKE $${pIdx} OR mobile ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) AS total FROM users ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const usersRes = await db.query(
      `SELECT id, name, email, mobile, role, address, city, state, pincode, status, created_at
       FROM users ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${pIdx++} OFFSET $${pIdx}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      users: usersRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

// Toggle User Status (active / suspended)
async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updated = await db.query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, status`,
      [status, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_USER_STATUS',
      entityType: 'users',
      entityId: id,
      newValue: { status },
      req,
    });

    res.json({
      success: true,
      message: `User status changed to ${status}.`,
      user: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Officers Management
async function getOfficers(req, res, next) {
  try {
    const { policeStationId, rank, search } = req.query;

    let whereClauses = [];
    let params = [];
    let pIdx = 1;

    if (policeStationId) {
      whereClauses.push(`o.police_station_id = $${pIdx++}`);
      params.push(parseInt(policeStationId, 10));
    }
    if (rank) {
      whereClauses.push(`o.rank = $${pIdx++}`);
      params.push(rank);
    }
    if (search) {
      whereClauses.push(`(u.name ILIKE $${pIdx} OR o.employee_id ILIKE $${pIdx} OR u.email ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const officersRes = await db.query(
      `SELECT o.*, u.name, u.email, u.mobile, u.status AS user_status,
              ps.station_name, ps.station_code, ps.district
       FROM officers o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN police_stations ps ON o.police_station_id = ps.id
       ${whereSql}
       ORDER BY o.created_at DESC`,
      params
    );

    res.json({
      success: true,
      officers: officersRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

// Create New Officer Account
async function createOfficer(req, res, next) {
  try {
    const { name, email, mobile, password, rank, employeeId, policeStationId, department } = req.body;

    if (!name || !email || !mobile || !password || !rank || !employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile, password, rank, and badge/employee ID are required.',
      });
    }

    // Check existing email
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Check existing employee ID
    const existingEmp = await db.query('SELECT id FROM officers WHERE employee_id = $1', [employeeId.trim()]);
    if (existingEmp.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'An officer with this Badge/Employee ID already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user record
    const userRes = await db.query(
      `INSERT INTO users (name, email, mobile, password_hash, role, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'police', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, name, email, mobile`,
      [name.trim(), email.toLowerCase().trim(), mobile.trim(), passwordHash]
    );

    const newUser = userRes.rows[0];

    // Create officer record
    const offRes = await db.query(
      `INSERT INTO officers (user_id, employee_id, rank, police_station_id, department, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', CURRENT_TIMESTAMP)
       RETURNING *`,
      [
        newUser.id,
        employeeId.trim(),
        rank,
        policeStationId ? parseInt(policeStationId, 10) : null,
        department ? department.trim() : 'General Crime',
      ]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_OFFICER',
      entityType: 'officers',
      entityId: offRes.rows[0].id,
      newValue: { name, employeeId, rank, policeStationId },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Police officer account created successfully.',
      officer: {
        ...offRes.rows[0],
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Police Stations Management
async function getStations(req, res, next) {
  try {
    const stationsRes = await db.query(
      `SELECT ps.*,
              COUNT(o.id) AS officer_count,
              COUNT(c.id) AS complaint_count
       FROM police_stations ps
       LEFT JOIN officers o ON ps.id = o.police_station_id
       LEFT JOIN complaints c ON ps.id = c.police_station_id
       GROUP BY ps.id
       ORDER BY ps.station_name ASC`
    );

    res.json({
      success: true,
      stations: stationsRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function createStation(req, res, next) {
  try {
    const { stationName, stationCode, address, district, state, contactNumber, email, jurisdictionPincodes } = req.body;

    if (!stationName || !stationCode || !address || !district || !state || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Station name, station code, address, district, state, and contact number are required.',
      });
    }

    const insertRes = await db.query(
      `INSERT INTO police_stations (station_name, station_code, address, district, state, contact_number, email, jurisdiction_pincodes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
       RETURNING *`,
      [stationName.trim(), stationCode.trim().toUpperCase(), address.trim(), district.trim(), state.trim(), contactNumber.trim(), email ? email.trim() : null, jurisdictionPincodes || null]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_STATION',
      entityType: 'police_stations',
      entityId: insertRes.rows[0].id,
      newValue: { stationName, stationCode },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Police station registered successfully.',
      station: insertRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function updateStation(req, res, next) {
  try {
    const { id } = req.params;
    const { stationName, stationCode, address, district, state, contactNumber, email, jurisdictionPincodes, status } = req.body;

    const updateRes = await db.query(
      `UPDATE police_stations
       SET station_name = COALESCE($1, station_name),
           station_code = COALESCE($2, station_code),
           address = COALESCE($3, address),
           district = COALESCE($4, district),
           state = COALESCE($5, state),
           contact_number = COALESCE($6, contact_number),
           email = COALESCE($7, email),
           jurisdiction_pincodes = COALESCE($8, jurisdiction_pincodes),
           status = COALESCE($9, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [stationName, stationCode, address, district, state, contactNumber, email, jurisdictionPincodes, status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Police station not found.' });
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STATION',
      entityType: 'police_stations',
      entityId: id,
      newValue: { stationName, status },
      req,
    });

    res.json({
      success: true,
      message: 'Police station updated successfully.',
      station: updateRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Categories Management
async function getCategories(req, res, next) {
  try {
    const catRes = await db.query(
      `SELECT cat.*, COUNT(c.id) AS complaint_count
       FROM complaint_categories cat
       LEFT JOIN complaints c ON cat.id = c.category_id
       GROUP BY cat.id
       ORDER BY cat.name ASC`
    );

    res.json({
      success: true,
      categories: catRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const insertRes = await db.query(
      `INSERT INTO complaint_categories (name, description, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [name.trim(), description ? description.trim() : null]
    );

    res.status(201).json({
      success: true,
      message: 'Complaint category created successfully.',
      category: insertRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const updateRes = await db.query(
      `UPDATE complaint_categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [name, description, status, id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({
      success: true,
      message: 'Category updated successfully.',
      category: updateRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Audit Logs Viewer
async function getAuditLogs(req, res, next) {
  try {
    const { action, entityType, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let where = [];
    let params = [];
    let idx = 1;

    if (action) {
      where.push(`al.action ILIKE $${idx++}`);
      params.push(`%${action}%`);
    }
    if (entityType) {
      where.push(`al.entity_type = $${idx++}`);
      params.push(entityType);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countRes = await db.query(`SELECT COUNT(*) AS total FROM audit_logs al ${whereSql}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const logsRes = await db.query(
      `SELECT al.*, u.name AS user_name, u.email AS user_email, u.role AS user_role
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereSql}
       ORDER BY al.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      logs: logsRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminDashboard,
  getUsers,
  toggleUserStatus,
  getOfficers,
  createOfficer,
  getStations,
  createStation,
  updateStation,
  getCategories,
  createCategory,
  updateCategory,
  getAuditLogs,
};
