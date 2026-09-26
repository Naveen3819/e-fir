const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// Verify Complaint -> moves to 'Accepted'
async function verifyComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const compRes = await db.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    const updated = await db.query(
      `UPDATE complaints
       SET status = 'Accepted',
           remarks = COALESCE($1, remarks),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [remarks || 'Verified and accepted for further legal processing.', id]
    );

    // Notify citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `Your complaint ${complaint.complaint_number} has been verified and ACCEPTED by the police. An official FIR may now be registered.`,
      type: 'success',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'VERIFY_COMPLAINT_ACCEPTED',
      entityType: 'complaints',
      entityId: id,
      oldValue: complaint.status,
      newValue: 'Accepted',
      req,
    });

    res.json({
      success: true,
      message: 'Complaint verified and accepted successfully.',
      complaint: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Request Information from Citizen
async function requestInformation(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A clear explanation of what information or documents are required must be provided.',
      });
    }

    const compRes = await db.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    const updated = await db.query(
      `UPDATE complaints
       SET status = 'Information Required',
           info_request_message = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [message.trim(), id]
    );

    // Notify citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `Action Required: The investigating police officer has requested additional details/documents for complaint ${complaint.complaint_number}: "${message.substring(0, 80)}..."`,
      type: 'warning',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'REQUEST_COMPLAINT_INFO',
      entityType: 'complaints',
      entityId: id,
      oldValue: complaint.status,
      newValue: { status: 'Information Required', requestMessage: message },
      req,
    });

    res.json({
      success: true,
      message: 'Information request communicated to citizen.',
      complaint: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Reject Complaint with Mandatory Reason
async function rejectComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A formal rejection reason is mandatory under police grievance procedure. Silent rejection is not allowed.',
      });
    }

    const compRes = await db.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    const updated = await db.query(
      `UPDATE complaints
       SET status = 'Rejected',
           rejection_reason = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [reason.trim(), id]
    );

    // Notify citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `Your complaint ${complaint.complaint_number} has been rejected. Reason: "${reason.substring(0, 100)}..."`,
      type: 'alert',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'REJECT_COMPLAINT',
      entityType: 'complaints',
      entityId: id,
      oldValue: complaint.status,
      newValue: { status: 'Rejected', rejection_reason: reason },
      req,
    });

    res.json({
      success: true,
      message: 'Complaint has been recorded as Rejected with stated reason.',
      complaint: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Assign Investigating Officer
async function assignOfficer(req, res, next) {
  try {
    const { id } = req.params;
    const { officerId } = req.body;

    if (!officerId) {
      return res.status(400).json({ success: false, message: 'Officer selection is required.' });
    }

    const compRes = await db.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    const officerRes = await db.query(
      `SELECT o.*, u.name, u.email FROM officers o JOIN users u ON o.user_id = u.id WHERE o.id = $1`,
      [officerId]
    );

    if (officerRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected officer not found.' });
    }

    const officer = officerRes.rows[0];

    const nextStatus = complaint.status === 'Submitted' || complaint.status === 'Accepted' ? 'Assigned' : complaint.status;

    const updated = await db.query(
      `UPDATE complaints
       SET assigned_officer_id = $1,
           status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [officerId, nextStatus, id]
    );

    // Notify officer
    await createNotification({
      userId: officer.user_id,
      message: `You have been assigned to handle complaint ${complaint.complaint_number} (${complaint.title.substring(0, 30)}).`,
      type: 'info',
      link: `/police/complaints/${id}`,
    });

    // Notify citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `Investigating officer ${officer.rank} ${officer.name} (Badge: ${officer.employee_id}) has been assigned to your complaint.`,
      type: 'info',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'ASSIGN_OFFICER',
      entityType: 'complaints',
      entityId: id,
      newValue: { officerId, officerName: officer.name },
      req,
    });

    res.json({
      success: true,
      message: `Officer ${officer.name} assigned successfully.`,
      complaint: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Update Complaint Status (e.g. Under Investigation, Resolved, Closed)
async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = [
      'Submitted',
      'Under Verification',
      'Information Required',
      'Accepted',
      'FIR Registered',
      'Assigned',
      'Under Investigation',
      'Resolved',
      'Closed',
      'Rejected',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const compRes = await db.query(`SELECT * FROM complaints WHERE id = $1`, [id]);
    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    const updated = await db.query(
      `UPDATE complaints
       SET status = $1,
           remarks = COALESCE($2, remarks),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, remarks, id]
    );

    // Notify citizen
    await createNotification({
      userId: complaint.citizen_id,
      message: `The status of your complaint ${complaint.complaint_number} has been updated to "${status}".`,
      type: status === 'Resolved' || status === 'Closed' ? 'success' : 'info',
      link: `/complaints/${id}`,
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_COMPLAINT_STATUS',
      entityType: 'complaints',
      entityId: id,
      oldValue: complaint.status,
      newValue: status,
      req,
    });

    res.json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      complaint: updated.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Police Dashboard Analytics & Metrics
async function getPoliceDashboard(req, res, next) {
  try {
    const stationId = req.user.policeStationId;
    const officerId = req.user.officerId;

    let stationFilter = '';
    let params = [];
    if (stationId) {
      stationFilter = `WHERE c.police_station_id = $1`;
      params.push(stationId);
    }

    // Key counts
    const statusCounts = await db.query(
      `SELECT c.status, COUNT(*) AS count
       FROM complaints c
       ${stationFilter}
       GROUP BY c.status`,
      params
    );

    // Category breakdown
    const categoryCounts = await db.query(
      `SELECT cat.name, COUNT(c.id) AS count
       FROM complaint_categories cat
       LEFT JOIN complaints c ON cat.id = c.category_id ${stationId ? 'AND c.police_station_id = $1' : ''}
       GROUP BY cat.id, cat.name
       ORDER BY count DESC`,
      params
    );

    // Assigned specifically to this officer
    let myAssignedCount = 0;
    if (officerId) {
      const myCountRes = await db.query(
        `SELECT COUNT(*) AS count FROM complaints WHERE assigned_officer_id = $1`,
        [officerId]
      );
      myAssignedCount = parseInt(myCountRes.rows[0].count, 10);
    }

    // Total FIRs count
    const firCount = await db.query(
      `SELECT COUNT(*) AS count FROM firs f ${stationId ? 'WHERE f.police_station_id = $1' : ''}`,
      params
    );

    // Monthly complaint statistics (last 6 months)
    const monthlyStats = await db.query(
      `SELECT TO_CHAR(c.created_at, 'Mon YYYY') AS month,
              DATE_TRUNC('month', c.created_at) AS sort_month,
              COUNT(*) AS total_complaints,
              COUNT(CASE WHEN c.status = 'FIR Registered' OR c.status = 'Under Investigation' THEN 1 END) AS fir_cases,
              COUNT(CASE WHEN c.status = 'Resolved' OR c.status = 'Closed' THEN 1 END) AS resolved_cases
       FROM complaints c
       ${stationFilter}
       GROUP BY sort_month, TO_CHAR(c.created_at, 'Mon YYYY')
       ORDER BY sort_month ASC
       LIMIT 6`,
      params
    );

    res.json({
      success: true,
      stats: {
        byStatus: statusCounts.rows,
        byCategory: categoryCounts.rows,
        myAssignedCount,
        totalFIRs: parseInt(firCount.rows[0].count, 10),
        monthlyStats: monthlyStats.rows,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  verifyComplaint,
  requestInformation,
  rejectComplaint,
  assignOfficer,
  updateComplaintStatus,
  getPoliceDashboard,
};
