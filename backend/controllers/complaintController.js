const db = require('../config/db');
const { calculateFileHash } = require('../config/multer');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Generate unique complaint number: E-FIR-YYYY-XXXXXX
async function generateComplaintNumber() {
  const year = new Date().getFullYear();
  const countRes = await db.query(
    `SELECT COUNT(*) AS total FROM complaints WHERE complaint_number LIKE $1`,
    [`E-FIR-${year}-%`]
  );
  const nextSeq = parseInt(countRes.rows[0].total, 10) + 1;
  const padded = String(nextSeq).padStart(6, '0');
  return `E-FIR-${year}-${padded}`;
}

// Create Complaint (Citizen)
async function createComplaint(req, res, next) {
  try {
    const {
      categoryId,
      policeStationId,
      title,
      description,
      incidentDate,
      incidentTime,
      incidentLocation,
      district,
      state,
      pincode,
    } = req.body;

    if (!categoryId || !policeStationId || !title || !description || !incidentDate || !incidentLocation || !district || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All mandatory incident details and police station selection are required.',
      });
    }

    const complaintNumber = await generateComplaintNumber();

    const insertComplaint = await db.query(
      `INSERT INTO complaints (
        complaint_number, citizen_id, category_id, police_station_id,
        title, description, incident_date, incident_time, incident_location,
        district, state, pincode, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        complaintNumber,
        req.user.id,
        parseInt(categoryId, 10),
        parseInt(policeStationId, 10),
        title.trim(),
        description.trim(),
        incidentDate,
        incidentTime || null,
        incidentLocation.trim(),
        district.trim(),
        state.trim(),
        pincode.trim(),
      ]
    );

    const complaint = insertComplaint.rows[0];

    // Handle evidence files if uploaded in this request
    const evidenceList = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileHash = null;
        try {
          fileHash = await calculateFileHash(file.path);
        } catch (e) {
          console.warn('Could not compute file hash:', e.message);
        }

        const evRes = await db.query(
          `INSERT INTO evidence (complaint_id, uploaded_by, filename, stored_filename, file_type, file_size, file_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
           RETURNING *`,
          [complaint.id, req.user.id, file.originalname, file.filename, file.mimetype, file.size, fileHash]
        );
        evidenceList.push(evRes.rows[0]);
      }
    }

    // In-app & email notification to Citizen
    await createNotification({
      userId: req.user.id,
      message: `Your complaint (${complaint.complaint_number}) "${title.substring(0, 40)}..." has been successfully submitted and forwarded to the police station for verification.`,
      type: 'info',
      link: `/complaints/${complaint.id}`,
    });

    // Notify station officers
    const stationOfficers = await db.query(
      `SELECT u.id FROM users u
       JOIN officers o ON u.id = o.user_id
       WHERE o.police_station_id = $1 AND o.status = 'active'`,
      [complaint.police_station_id]
    );

    for (const officer of stationOfficers.rows) {
      await createNotification({
        userId: officer.id,
        message: `New complaint ${complaint.complaint_number} received at your station. Pending initial verification.`,
        type: 'info',
        link: `/police/complaints/${complaint.id}`,
        sendMail: false,
      });
    }

    // Audit log
    await logAudit({
      userId: req.user.id,
      action: 'SUBMIT_COMPLAINT',
      entityType: 'complaints',
      entityId: complaint.id,
      newValue: { complaint_number: complaint.complaint_number, title },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint: {
        ...complaint,
        evidence: evidenceList,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get Complaints List
async function getComplaints(req, res, next) {
  try {
    const { status, categoryId, stationId, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (req.user.role === 'citizen') {
      whereClauses.push(`c.citizen_id = $${paramIndex++}`);
      params.push(req.user.id);
    } else if (req.user.role === 'police') {
      // Station filter if officer has a police station assigned
      if (req.user.policeStationId) {
        whereClauses.push(`c.police_station_id = $${paramIndex++}`);
        params.push(req.user.policeStationId);
      }
    }

    if (status) {
      whereClauses.push(`c.status = $${paramIndex++}`);
      params.push(status);
    }

    if (categoryId) {
      whereClauses.push(`c.category_id = $${paramIndex++}`);
      params.push(parseInt(categoryId, 10));
    }

    if (stationId && req.user.role === 'admin') {
      whereClauses.push(`c.police_station_id = $${paramIndex++}`);
      params.push(parseInt(stationId, 10));
    }

    if (search) {
      whereClauses.push(
        `(c.complaint_number ILIKE $${paramIndex} OR c.title ILIKE $${paramIndex} OR c.district ILIKE $${paramIndex})`
      );
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = await db.query(
      `SELECT COUNT(*) AS total FROM complaints c ${whereSql}`,
      params
    );
    const total = parseInt(countQuery.rows[0].total, 10);

    const listQuery = await db.query(
      `SELECT c.*,
              cat.name AS category_name,
              ps.station_name, ps.station_code,
              u.name AS citizen_name, u.email AS citizen_email, u.mobile AS citizen_mobile,
              ou.name AS assigned_officer_name, o.rank AS assigned_officer_rank,
              f.id AS fir_id, f.fir_number, f.status AS fir_status
       FROM complaints c
       JOIN complaint_categories cat ON c.category_id = cat.id
       JOIN police_stations ps ON c.police_station_id = ps.id
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       LEFT JOIN users ou ON o.user_id = ou.id
       LEFT JOIN firs f ON c.id = f.complaint_id
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, parseInt(limit, 10), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      complaints: listQuery.rows,
    });
  } catch (error) {
    next(error);
  }
}

// Get Complaint By ID
async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;

    const compRes = await db.query(
      `SELECT c.*,
              cat.name AS category_name, cat.description AS category_description,
              ps.station_name, ps.station_code, ps.address AS station_address, ps.contact_number AS station_contact, ps.email AS station_email,
              u.name AS citizen_name, u.email AS citizen_email, u.mobile AS citizen_mobile, u.address AS citizen_address, u.city AS citizen_city, u.state AS citizen_state, u.pincode AS citizen_pincode,
              ou.name AS assigned_officer_name, o.rank AS assigned_officer_rank, o.employee_id AS assigned_officer_badge,
              f.id AS fir_id, f.fir_number, f.registration_date AS fir_date, f.sections AS fir_sections, f.description AS fir_description, f.status AS fir_status,
              fio_u.name AS fir_io_name, fio.rank AS fir_io_rank
       FROM complaints c
       JOIN complaint_categories cat ON c.category_id = cat.id
       JOIN police_stations ps ON c.police_station_id = ps.id
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       LEFT JOIN users ou ON o.user_id = ou.id
       LEFT JOIN firs f ON c.id = f.complaint_id
       LEFT JOIN officers fio ON f.investigation_officer_id = fio.id
       LEFT JOIN users fio_u ON fio.user_id = fio_u.id
       WHERE c.id = $1`,
      [id]
    );

    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    // Check authorization: citizen can only view their own
    if (req.user.role === 'citizen' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only view complaints filed under your account.',
      });
    }

    // Get evidence
    const evidenceRes = await db.query(
      `SELECT e.*, u.name AS uploader_name, u.role AS uploader_role
       FROM evidence e
       JOIN users u ON e.uploaded_by = u.id
       WHERE e.complaint_id = $1
       ORDER BY e.created_at ASC`,
      [id]
    );

    // Get investigation updates if FIR exists
    let investigationUpdates = [];
    if (complaint.fir_id) {
      const invRes = await db.query(
        `SELECT iu.*, u.name AS officer_name, o.rank AS officer_rank, o.employee_id
         FROM investigation_updates iu
         JOIN officers o ON iu.officer_id = o.id
         JOIN users u ON o.user_id = u.id
         WHERE iu.fir_id = $1
         ORDER BY iu.created_at DESC`,
        [complaint.fir_id]
      );
      investigationUpdates = invRes.rows;
    }

    // Get feedback if exists
    const feedbackRes = await db.query(
      `SELECT * FROM feedback WHERE complaint_id = $1`,
      [id]
    );

    res.json({
      success: true,
      complaint: {
        ...complaint,
        evidence: evidenceRes.rows,
        investigationUpdates,
        feedback: feedbackRes.rows[0] || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Upload additional evidence
async function uploadEvidence(req, res, next) {
  try {
    const { id } = req.params;

    const compRes = await db.query(`SELECT id, citizen_id, police_station_id, status FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    const complaint = compRes.rows[0];

    // Authorization check
    if (req.user.role === 'citizen' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files provided for upload.' });
    }

    const uploaded = [];
    for (const file of req.files) {
      let fileHash = null;
      try {
        fileHash = await calculateFileHash(file.path);
      } catch (e) {
        console.warn('Hash error:', e.message);
      }

      const evRes = await db.query(
        `INSERT INTO evidence (complaint_id, uploaded_by, filename, stored_filename, file_type, file_size, file_hash, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         RETURNING *`,
        [complaint.id, req.user.id, file.originalname, file.filename, file.mimetype, file.size, fileHash]
      );
      uploaded.push(evRes.rows[0]);
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPLOAD_EVIDENCE',
      entityType: 'complaints',
      entityId: complaint.id,
      newValue: { count: uploaded.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Evidence files uploaded successfully.',
      evidence: uploaded,
    });
  } catch (error) {
    next(error);
  }
}

// Citizen responds to information request
async function respondToInfoRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    if (!responseMessage || !responseMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Response message cannot be empty.',
      });
    }

    const compRes = await db.query(
      `SELECT c.*, ps.station_name FROM complaints c
       JOIN police_stations ps ON c.police_station_id = ps.id
       WHERE c.id = $1`,
      [id]
    );

    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    if (complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Update complaint status back to Under Verification
    await db.query(
      `UPDATE complaints
       SET status = 'Under Verification',
           info_response_message = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [responseMessage.trim(), id]
    );

    // Also handle any evidence files attached in this response
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        let fileHash = null;
        try {
          fileHash = await calculateFileHash(file.path);
        } catch (e) {}

        await db.query(
          `INSERT INTO evidence (complaint_id, uploaded_by, filename, stored_filename, file_type, file_size, file_hash, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [complaint.id, req.user.id, file.originalname, file.filename, file.mimetype, file.size, fileHash]
        );
      }
    }

    // Notify assigned officer or station officers
    if (complaint.assigned_officer_id) {
      const offRes = await db.query(
        `SELECT user_id FROM officers WHERE id = $1`,
        [complaint.assigned_officer_id]
      );
      if (offRes.rows.length > 0) {
        await createNotification({
          userId: offRes.rows[0].user_id,
          message: `Citizen Rahul has responded with additional information for complaint ${complaint.complaint_number}.`,
          type: 'info',
          link: `/police/complaints/${complaint.id}`,
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'RESPOND_INFO_REQUEST',
      entityType: 'complaints',
      entityId: id,
      newValue: { response: responseMessage.substring(0, 100) },
      req,
    });

    res.json({
      success: true,
      message: 'Your response and supporting information have been submitted to the police officer.',
    });
  } catch (error) {
    next(error);
  }
}

// Public / Citizen Status Tracking
async function getComplaintStatus(req, res, next) {
  try {
    const { reference } = req.params;

    const result = await db.query(
      `SELECT c.id, c.complaint_number, c.title, c.incident_date, c.incident_location, c.status,
              c.created_at, c.updated_at, c.rejection_reason, c.remarks,
              cat.name AS category_name,
              ps.station_name, ps.contact_number AS station_contact,
              f.fir_number, f.status AS fir_status, f.registration_date AS fir_date,
              ou.name AS assigned_officer_name, o.rank AS assigned_officer_rank
       FROM complaints c
       JOIN complaint_categories cat ON c.category_id = cat.id
       JOIN police_stations ps ON c.police_station_id = ps.id
       LEFT JOIN officers o ON c.assigned_officer_id = o.id
       LEFT JOIN users ou ON o.user_id = ou.id
       LEFT JOIN firs f ON c.id = f.complaint_id
       WHERE c.complaint_number = $1 OR c.id = $2`,
      [reference, isNaN(reference) ? 0 : parseInt(reference, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint reference not found.' });
    }

    res.json({
      success: true,
      statusData: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  uploadEvidence,
  respondToInfoRequest,
  getComplaintStatus,
};
