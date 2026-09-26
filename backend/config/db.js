const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const mongoose = require('mongoose');

let pgliteInstance = null;
let pgPool = null;
let isPgLite = false;

// Check if external Postgres is configured
const hasExternalPg = Boolean(
  process.env.DATABASE_URL ||
  (process.env.PGUSER && process.env.PGDATABASE)
);

async function initDatabase() {
  // Connect to MongoDB Atlas if MONGODB_URI is specified
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' Connected to MongoDB Atlas cluster successfully.');
    } catch (mongoErr) {
      console.warn(' MongoDB Atlas connection warning:', mongoErr.message);
    }
  }

  if (hasExternalPg) {
    try {
      const config = process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            user: process.env.PGUSER || 'postgres',
            host: process.env.PGHOST || 'localhost',
            database: process.env.PGDATABASE || 'efir_db',
            password: process.env.PGPASSWORD || 'postgres',
            port: parseInt(process.env.PGPORT || '5432', 10),
          };

      pgPool = new Pool(config);
      // Test connection with a 2-second timeout
      const client = await Promise.race([
        pgPool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL connection timeout')), 2000)
        ),
      ]);
      console.log(' Connected to external PostgreSQL database.');
      client.release();
    } catch (err) {
      console.warn(' External PostgreSQL not reachable:', err.message);
      console.log(' Falling back to embedded persistent PostgreSQL engine (PGlite)...');
      pgPool = null;
    }
  }

  if (!pgPool) {
    // Fallback to PGlite (Real PostgreSQL engine in Node)
    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = path.resolve(__dirname, '../../database/pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    pgliteInstance = new PGlite(dataDir);
    isPgLite = true;
    console.log(` Persistent PostgreSQL (PGlite) engine initialized at: ${dataDir}`);
  }

  // Ensure tables and seed exist
  await runMigrationsAndSeed();
}

async function query(text, params = []) {
  if (isPgLite && pgliteInstance) {
    const result = await pgliteInstance.query(text, params);
    return {
      rows: result.rows || [],
      rowCount: result.rows ? result.rows.length : result.affectedRows || 0,
      fields: result.fields,
    };
  } else if (pgPool) {
    const result = await pgPool.query(text, params);
    return result;
  } else {
    throw new Error('Database is not initialized yet. Call initDatabase() first.');
  }
}

async function runMigrationsAndSeed() {
  try {
    // Check if 'users' table already exists
    const checkTable = await query(`
      SELECT to_regclass('public.users') AS exists;
    `);

    const exists = checkTable.rows[0]?.exists;
    if (!exists) {
      console.log(' Running database migrations (schema.sql)...');
      const schemaSql = fs.readFileSync(
        path.resolve(__dirname, '../../database/schema.sql'),
        'utf8'
      );
      if (isPgLite) {
        await pgliteInstance.exec(schemaSql);
      } else {
        await pgPool.query(schemaSql);
      }
      console.log(' Schema created successfully.');

      console.log(' Seeding default demo data (seed.sql)...');
      const seedSql = fs.readFileSync(
        path.resolve(__dirname, '../../database/seed.sql'),
        'utf8'
      );
      if (isPgLite) {
        await pgliteInstance.exec(seedSql);
      } else {
        await pgPool.query(seedSql);
      }
      console.log(' Demo data seeded successfully.');
    } else {
      console.log(' Database tables already present.');
    }

    // Always ensure sequences are in sync with maximum table IDs
    await syncSequences();
  } catch (error) {
    console.error(' Error initializing schema/seed:', error);
  }
}

async function syncSequences() {
  try {
    const syncSql = `
      SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
      SELECT setval('police_stations_id_seq', (SELECT COALESCE(MAX(id), 1) FROM police_stations));
      SELECT setval('officers_id_seq', (SELECT COALESCE(MAX(id), 1) FROM officers));
      SELECT setval('complaint_categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM complaint_categories));
      SELECT setval('complaints_id_seq', (SELECT COALESCE(MAX(id), 1) FROM complaints));
      SELECT setval('evidence_id_seq', (SELECT COALESCE(MAX(id), 1) FROM evidence));
      SELECT setval('firs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM firs));
      SELECT setval('investigation_updates_id_seq', (SELECT COALESCE(MAX(id), 1) FROM investigation_updates));
      SELECT setval('notifications_id_seq', (SELECT COALESCE(MAX(id), 1) FROM notifications));
      SELECT setval('audit_logs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM audit_logs));
      SELECT setval('feedback_id_seq', (SELECT COALESCE(MAX(id), 1) FROM feedback));
    `;
    if (isPgLite) {
      await pgliteInstance.exec(syncSql);
    } else if (pgPool) {
      await pgPool.query(syncSql);
    }
  } catch (e) {
    console.warn(' Sequence synchronization warning:', e.message);
  }
}

module.exports = {
  initDatabase,
  query,
  isPgLite: () => isPgLite,
};
