const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get active complaint categories
router.get('/categories', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, name, description FROM complaint_categories WHERE status = 'active' ORDER BY name ASC`
    );
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    next(error);
  }
});

// Get active police stations
router.get('/stations', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT id, station_name, station_code, address, district, state, contact_number, email, jurisdiction_pincodes
       FROM police_stations
       WHERE status = 'active'
       ORDER BY station_name ASC`
    );
    res.json({ success: true, stations: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
