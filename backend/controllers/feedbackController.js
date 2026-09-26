const db = require('../config/db');
const { logAudit } = require('../services/auditService');

// Citizen submits feedback on resolved or closed complaint
async function submitFeedback(req, res, next) {
  try {
    const { complaintId, rating, comments } = req.body;

    if (!complaintId || !rating) {
      return res.status(400).json({ success: false, message: 'Complaint ID and rating (1-5) are required.' });
    }

    const numRating = parseInt(rating, 10);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    // Verify complaint belongs to citizen
    const compRes = await db.query(
      `SELECT citizen_id, status, complaint_number FROM complaints WHERE id = $1`,
      [complaintId]
    );

    if (compRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const complaint = compRes.rows[0];

    if (complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized: You can only submit feedback for your own complaint.' });
    }

    // Insert or update feedback
    const fbRes = await db.query(
      `INSERT INTO feedback (complaint_id, citizen_id, rating, comments, created_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (complaint_id)
       DO UPDATE SET rating = EXCLUDED.rating, comments = EXCLUDED.comments, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [complaintId, req.user.id, numRating, comments ? comments.trim() : null]
    );

    await logAudit({
      userId: req.user.id,
      action: 'SUBMIT_FEEDBACK',
      entityType: 'feedback',
      entityId: fbRes.rows[0].id,
      newValue: { rating: numRating, complaintNumber: complaint.complaint_number },
      req,
    });

    res.json({
      success: true,
      message: 'Thank you for your valuable feedback. Your response has been submitted to the police department.',
      feedback: fbRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitFeedback,
};
