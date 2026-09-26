const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Generate unique FIR number: FIR/<STATE_CODE>/YYYY/XXXXXX
async function generateFIRNumber(policeStationId) {
  const year = new Date().getFullYear();

  // Get state code from police station
  const stnRes = await db.query(`SELECT state FROM police_stations WHERE id = $1`, [policeStationId]);
  let stateCode = 'DL';
  if (stnRes.rows.length > 0 && stnRes.rows[0].state) {
    const s = stnRes.rows[0].state.toUpperCase();
    if (s.includes('DELHI')) stateCode = 'DL';
    else if (s.includes('UTTAR')) stateCode = 'UP';
    else if (s.includes('KARNATAKA')) stateCode = 'KA';
    else if (s.includes('MAHARASHTRA')) stateCode = 'MH';
    else stateCode = s.substring(0, 2);
  }

  const countRes = await db.query(
    `SELECT COUNT(*) AS total FROM firs WHERE fir_number LIKE $1`,
    [`FIR/${stateCode}/${year}/%`]
  );
  const nextSeq = parseInt(countRes.rows[0].total, 10) + 1;
  const padded = String(nextSeq).padStart(6, '0');
  return `FIR/${stateCode}/${year}/${padded}`;
}

// Register Official FIR (Police / Admin only)
async function registerFIR(req, res, next) {
  try {
    const { complaintId, sections, description, investigationOfficerId, accusedDetails } = req.body;

    if (!complaintId || !sections || !description) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID, legal sections/acts, and formal FIR description are required.',
      });
    }

    // Check if complaint exists
    const compRes = await db.query(
      `SELECT c.*, ps.id AS stn_id, ps.station_name, ps.state AS stn_state
       FROM complaints c
       JOIN police_stations ps ON c.police_station_id = ps.id
       WHERE c.id = $1`,
      [complaintId]
    );

    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    // Check if FIR is already registered for this complaint
    const existingFIR = await db.query(`SELECT id, fir_number FROM firs WHERE complaint_id = $1`, [complaintId]);
    if (existingFIR.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `An official FIR (${existingFIR.rows[0].fir_number}) is already registered for this complaint.`,
      });
    }

    const firNumber = await generateFIRNumber(complaint.police_station_id);

    // Determine registering officer ID
    let registeringOfficerId = req.user.officerId;
    if (!registeringOfficerId) {
      // If admin, find first officer or default officer
      const offRes = await db.query(`SELECT id FROM officers LIMIT 1`);
      registeringOfficerId = offRes.rows[0]?.id;
    }

    const ioId = investigationOfficerId ? parseInt(investigationOfficerId, 10) : registeringOfficerId;

    const firInsert = await db.query(
      `INSERT INTO firs (
        fir_number, complaint_id, police_station_id, registered_by,
        registration_date, sections, description, investigation_officer_id,
        accused_details, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, 'Registered', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        firNumber,
        complaint.id,
        complaint.police_station_id,
        registeringOfficerId,
        sections.trim(),
        description.trim(),
        ioId,
        accusedDetails ? accusedDetails.trim() : null,
      ]
    );

    const fir = firInsert.rows[0];

    // Update complaint status to 'FIR Registered'
    await db.query(
      `UPDATE complaints
       SET status = 'FIR Registered',
           assigned_officer_id = COALESCE($1, assigned_officer_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [ioId, complaint.id]
    );

    // Initial investigation timeline record
    await db.query(
      `INSERT INTO investigation_updates (fir_id, officer_id, update_type, description, created_at)
       VALUES ($1, $2, 'FIR Registered', $3, CURRENT_TIMESTAMP)`,
      [fir.id, registeringOfficerId, `Official First Information Report ${fir.fir_number} formally recorded under sections ${sections}.`]
    );

    // Notify Citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `Official FIR Recorded: Your complaint ${complaint.complaint_number} has been registered as ${fir.fir_number} under sections: ${sections}.`,
      type: 'success',
      link: `/complaints/${complaint.id}`,
    });

    // Notify assigned IO
    if (ioId) {
      const ioUser = await db.query(`SELECT user_id FROM officers WHERE id = $1`, [ioId]);
      if (ioUser.rows.length > 0) {
        await createNotification({
          userId: ioUser.rows[0].user_id,
          message: `You have been designated as the Investigating Officer for newly registered FIR ${fir.fir_number}.`,
          type: 'info',
          link: `/police/firs/${fir.id}`,
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'REGISTER_FIR',
      entityType: 'firs',
      entityId: fir.id,
      newValue: { fir_number: fir.fir_number, sections, complaint_id: complaint.id },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Official FIR recorded successfully.',
      fir,
    });
  } catch (error) {
    next(error);
  }
}

// Get FIR list
async function getFIRs(req, res, next) {
  try {
    const { status, policeStationId, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    // Role-based visibility
    if (req.user.role === 'citizen') {
      whereClauses.push(`c.citizen_id = $${paramIndex++}`);
      params.push(req.user.id);
    } else if (req.user.role === 'police' && req.user.policeStationId) {
      whereClauses.push(`f.police_station_id = $${paramIndex++}`);
      params.push(req.user.policeStationId);
    }

    if (status) {
      whereClauses.push(`f.status = $${paramIndex++}`);
      params.push(status);
    }

    if (policeStationId && req.user.role === 'admin') {
      whereClauses.push(`f.police_station_id = $${paramIndex++}`);
      params.push(parseInt(policeStationId, 10));
    }

    if (search) {
      whereClauses.push(
        `(f.fir_number ILIKE $${paramIndex} OR f.sections ILIKE $${paramIndex} OR c.complaint_number ILIKE $${paramIndex})`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = await db.query(
      `SELECT COUNT(*) AS total
       FROM firs f
       JOIN complaints c ON f.complaint_id = c.id
       ${whereSql}`,
      params
    );
    const total = parseInt(countQuery.rows[0].total, 10);

    const listQuery = await db.query(
      `SELECT f.*,
              c.complaint_number, c.title AS complaint_title, c.incident_date, c.incident_location,
              ps.station_name, ps.station_code,
              u.name AS citizen_name, u.email AS citizen_email, u.mobile AS citizen_mobile,
              io_u.name AS io_name, io.rank AS io_rank, io.employee_id AS io_badge,
              reg_u.name AS registered_by_name, reg_o.rank AS registered_by_rank
       FROM firs f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN police_stations ps ON f.police_station_id = ps.id
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers io ON f.investigation_officer_id = io.id
       LEFT JOIN users io_u ON io.user_id = io_u.id
       LEFT JOIN officers reg_o ON f.registered_by = reg_o.id
       LEFT JOIN users reg_u ON reg_o.user_id = reg_u.id
       ${whereSql}
       ORDER BY f.registration_date DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      firs: listQuery.rows,
    });
  } catch (error) {
    next(error);
  }
}

// Get FIR by ID
async function getFIRById(req, res, next) {
  try {
    const { id } = req.params;

    const firRes = await db.query(
      `SELECT f.*,
              c.complaint_number, c.title AS complaint_title, c.description AS complaint_description,
              c.incident_date, c.incident_time, c.incident_location, c.district, c.state, c.pincode,
              c.citizen_id,
              cat.name AS category_name,
              ps.station_name, ps.station_code, ps.address AS station_address, ps.contact_number AS station_contact, ps.email AS station_email,
              u.name AS complainant_name, u.email AS complainant_email, u.mobile AS complainant_mobile, u.address AS complainant_address,
              io_u.name AS io_name, io.rank AS io_rank, io.employee_id AS io_badge, io.department AS io_department,
              reg_u.name AS registered_by_name, reg_o.rank AS registered_by_rank
       FROM firs f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN complaint_categories cat ON c.category_id = cat.id
       JOIN police_stations ps ON f.police_station_id = ps.id
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers io ON f.investigation_officer_id = io.id
       LEFT JOIN users io_u ON io.user_id = io_u.id
       LEFT JOIN officers reg_o ON f.registered_by = reg_o.id
       LEFT JOIN users reg_u ON reg_o.user_id = reg_u.id
       WHERE f.id = $1`,
      [id]
    );

    if (firRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'FIR record not found.' });
    }

    const fir = firRes.rows[0];

    // Citizen authorization check: only see own FIR
    if (req.user.role === 'citizen' && fir.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to FIR record.' });
    }

    // Get investigation updates
    const updatesRes = await db.query(
      `SELECT iu.*, u.name AS officer_name, o.rank AS officer_rank, o.employee_id
       FROM investigation_updates iu
       JOIN officers o ON iu.officer_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE iu.fir_id = $1
       ORDER BY iu.created_at DESC`,
      [id]
    );

    // Get evidence
    const evidenceRes = await db.query(
      `SELECT * FROM evidence WHERE complaint_id = $1 ORDER BY created_at ASC`,
      [fir.complaint_id]
    );

    res.json({
      success: true,
      fir: {
        ...fir,
        updates: updatesRes.rows,
        evidence: evidenceRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update FIR Details / Status
async function updateFIR(req, res, next) {
  try {
    const { id } = req.params;
    const { status, sections, description, accusedDetails, investigationOfficerId } = req.body;

    const firRes = await db.query(`SELECT * FROM firs WHERE id = $1`, [id]);
    if (firRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'FIR not found.' });
    }

    const fir = firRes.rows[0];

    const updated = await db.query(
      `UPDATE firs
       SET status = COALESCE($1, status),
           sections = COALESCE($2, sections),
           description = COALESCE($3, description),
           accused_details = COALESCE($4, accused_details),
           investigation_officer_id = COALESCE($5, investigation_officer_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [status, sections, description, accusedDetails, investigationOfficerId ? parseInt(investigationOfficerId, 10) : null, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_FIR',
      entityType: 'firs',
      entityId: id,
      oldValue: { status: fir.status, sections: fir.sections },
      newValue: { status, sections },
      req,
    });

    res.json({
      success: true,
      message: 'FIR record updated successfully.',
      fir: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerFIR,
  getFIRs,
  getFIRById,
  updateFIR,
};
