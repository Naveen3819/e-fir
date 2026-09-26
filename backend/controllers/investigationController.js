const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Add Investigation Event / Diary Entry / Document
async function addInvestigationUpdate(req, res, next) {
  try {
    const { firId } = req.params;
    const { updateType, description, newFIRStatus } = req.body;

    if (!updateType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Update type and detailed progress description are required.',
      });
    }

    // Verify FIR
    const firRes = await db.query(
      `SELECT f.*, c.citizen_id, c.id AS complaint_id, c.complaint_number
       FROM firs f
       JOIN complaints c ON f.complaint_id = c.id
       WHERE f.id = $1`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'FIR record not found.' });
    }

    const fir = firRes.rows[0];

    // Document file handling if uploaded
    let docOriginalName = null;
    let docStoredName = null;
    if (req.file) {
      docOriginalName = req.file.originalname;
      docStoredName = req.file.filename;
    }

    let officerId = req.user.officerId;
    if (!officerId) {
      officerId = fir.investigation_officer_id || 1;
    }

    const insertUpdate = await db.query(
      `INSERT INTO investigation_updates (
        fir_id, officer_id, update_type, description,
        document_filename, document_stored_filename, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      RETURNING *`,
      [firId, officerId, updateType, description.trim(), docOriginalName, docStoredName]
    );

    const updateRecord = insertUpdate.rows[0];

    // If newFIRStatus is provided, update FIR status
    if (newFIRStatus && newFIRStatus !== fir.status) {
      await db.query(
        `UPDATE firs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newFIRStatus, firId]
      );

      // If status changed to Completed or Chargesheet Filed, sync complaint
      if (newFIRStatus === 'Completed' || newFIRStatus === 'Closed') {
        await db.query(
          `UPDATE complaints SET status = 'Resolved', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [fir.complaint_id]
        );
      } else if (fir.status === 'Registered' && newFIRStatus === 'Investigation Started') {
        await db.query(
          `UPDATE complaints SET status = 'Under Investigation', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [fir.complaint_id]
        );
      }
    }

    // Citizen notification for key updates
    await createNotification({
      userId: fir.citizen_id,
      message: `Investigation Update on ${fir.fir_number}: [${updateType}] ${description.substring(0, 90)}...`,
      type: 'info',
      link: `/complaints/${fir.complaint_id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADD_INVESTIGATION_UPDATE',
      entityType: 'investigation_updates',
      entityId: updateRecord.id,
      newValue: { firId, updateType, newFIRStatus },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Investigation progress update recorded.',
      update: updateRecord,
    });
  } catch (error) {
    next(error);
  }
}

// Get Investigation Details by FIR ID
async function getInvestigationByFIRId(req, res, next) {
  try {
    const { firId } = req.params;

    const firRes = await db.query(
      `SELECT f.*,
              c.complaint_number, c.title AS complaint_title, c.incident_date, c.incident_location, c.citizen_id,
              ps.station_name, ps.station_code,
              u.name AS complainant_name,
              io_u.name AS io_name, io.rank AS io_rank, io.employee_id AS io_badge, io.department AS io_department
       FROM firs f
       JOIN complaints c ON f.complaint_id = c.id
       JOIN police_stations ps ON f.police_station_id = ps.id
       JOIN users u ON c.citizen_id = u.id
       LEFT JOIN officers io ON f.investigation_officer_id = io.id
       LEFT JOIN users io_u ON io.user_id = io_u.id
       WHERE f.id = $1`,
      [firId]
    );

    if (firRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'FIR not found.' });
    }

    const fir = firRes.rows[0];

    // Citizen authorization check
    if (req.user.role === 'citizen' && fir.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Load timeline updates
    const updatesRes = await db.query(
      `SELECT iu.*, u.name AS officer_name, o.rank AS officer_rank, o.employee_id
       FROM investigation_updates iu
       JOIN officers o ON iu.officer_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE iu.fir_id = $1
       ORDER BY iu.created_at ASC`,
      [firId]
    );

    res.json({
      success: true,
      fir,
      updates: updatesRes.rows,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addInvestigationUpdate,
  getInvestigationByFIRId,
};
