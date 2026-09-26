const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { evidenceDir, documentsDir } = require('../config/multer');

// Secure Evidence Download / View
async function getEvidenceFile(req, res, next) {
  try {
    const { id } = req.params; // evidence id

    const evRes = await db.query(
      `SELECT e.*, c.citizen_id, c.police_station_id, c.assigned_officer_id
       FROM evidence e
       JOIN complaints c ON e.complaint_id = c.id
       WHERE e.id = $1`,
      [id]
    );

    if (evRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evidence file record not found.' });
    }

    const ev = evRes.rows[0];

    // Authorization check:
    // Citizen: must be the complaint owner
    // Police: must belong to the complaint's station or be the assigned officer
    // Admin: allowed
    if (req.user.role === 'citizen') {
      if (ev.citizen_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this evidence.' });
      }
    } else if (req.user.role === 'police') {
      if (req.user.policeStationId && req.user.policeStationId !== ev.police_station_id && req.user.officerId !== ev.assigned_officer_id) {
        return res.status(403).json({ success: false, message: 'Access denied: Evidence belongs to another police station jurisdiction.' });
      }
    }

    const filePath = path.join(evidenceDir, ev.stored_filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File content not found on server storage.',
      });
    }

    const inline = req.query.inline === 'true';
    res.setHeader('Content-Type', ev.file_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(ev.filename)}"`
    );

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

// Secure Document Download (e.g. Investigation case diary / official police report)
async function getDocumentFile(req, res, next) {
  try {
    const { updateId } = req.params;

    const docRes = await db.query(
      `SELECT iu.*, f.complaint_id, c.citizen_id, c.police_station_id, c.assigned_officer_id
       FROM investigation_updates iu
       JOIN firs f ON iu.fir_id = f.id
       JOIN complaints c ON f.complaint_id = c.id
       WHERE iu.id = $1`,
      [updateId]
    );

    if (docRes.rows.length === 0 || !docRes.rows[0].document_stored_filename) {
      return res.status(404).json({ success: false, message: 'Official document not found.' });
    }

    const doc = docRes.rows[0];

    // Authorization check
    if (req.user.role === 'citizen' && doc.citizen_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const filePath = path.join(documentsDir, doc.document_stored_filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on disk.' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.document_filename)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEvidenceFile,
  getDocumentFile,
};
