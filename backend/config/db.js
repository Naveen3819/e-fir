const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let pgPool = null;
let isPgMem = false;
let isPgLite = false;
let pgliteInstance = null;
let pgMemDb = null;

// Check if external Postgres is configured
const hasExternalPg = Boolean(
  process.env.DATABASE_URL ||
  (process.env.PGUSER && process.env.PGDATABASE)
);

function resolveSqlFile(filename) {
  const candidates = [
    path.resolve(__dirname, '../../database', filename),
    path.resolve(__dirname, '../database', filename),
    path.resolve(process.cwd(), 'database', filename),
    path.resolve(process.cwd(), '../database', filename),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`SQL file '${filename}' could not be located.`);
}

function getDatabaseDataDir() {
  const candidates = [
    path.resolve(__dirname, '../../database/pgdata'),
    path.resolve(__dirname, '../database/pgdata'),
    path.resolve(process.cwd(), 'database/pgdata'),
  ];
  for (const candidate of candidates) {
    const parent = path.dirname(candidate);
    if (fs.existsSync(parent)) {
      return candidate;
    }
  }
  return path.resolve(process.cwd(), 'database/pgdata');
}

function registerPgMemFunctions(db) {
  const dateTruncImpl = (unit, date) => {
    if (!date) return null;
    const d = new Date(date);
    if (unit === 'month') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    if (unit === 'year') return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    if (unit === 'day') return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    return d;
  };

  const toCharImpl = (date, format) => {
    if (!date) return '';
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (format === 'Mon YYYY') return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    if (format === 'YYYY-MM-DD') return d.toISOString().split('T')[0];
    return d.toISOString();
  };

  try {
    db.public.registerFunction({
      name: 'date_trunc',
      args: [db.public.getType('text'), db.public.getType('timestamp with time zone')],
      returns: db.public.getType('timestamp with time zone'),
      implementation: dateTruncImpl,
    });
  } catch (e) {}

  try {
    db.public.registerFunction({
      name: 'date_trunc',
      args: [db.public.getType('text'), db.public.getType('timestamp')],
      returns: db.public.getType('timestamp'),
      implementation: dateTruncImpl,
    });
  } catch (e) {}

  try {
    db.public.registerFunction({
      name: 'to_char',
      args: [db.public.getType('timestamp with time zone'), db.public.getType('text')],
      returns: db.public.getType('text'),
      implementation: toCharImpl,
    });
  } catch (e) {}

  try {
    db.public.registerFunction({
      name: 'to_char',
      args: [db.public.getType('timestamp'), db.public.getType('text')],
      returns: db.public.getType('text'),
      implementation: toCharImpl,
    });
  } catch (e) {}
}

async function initDatabase() {
  // Connect to MongoDB Atlas if MONGODB_URI or credentials are provided
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
    mongoUri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${encodeURIComponent(process.env.MONGODB_PASSWORD)}@cluster0.y649bmt.mongodb.net/efir_db?retryWrites=true&w=majority&appName=Cluster0`;
  }

  if (mongoUri) {
    try {
      const mongoose = require('mongoose');
      await mongoose.connect(mongoUri, {
        dbName: process.env.MONGODB_DB_NAME || 'efir_db',
        serverSelectionTimeoutMS: 5000,
      });
      console.log(' Connected to MongoDB Atlas cluster successfully.');
    } catch (mongoErr) {
      console.warn(' MongoDB Atlas connection warning:', mongoErr.message);
    }
  }

  // 1. Try External PostgreSQL if DATABASE_URL or PG* credentials provided
  if (hasExternalPg) {
    try {
      const config = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
          }
        : {
            user: process.env.PGUSER || 'postgres',
            host: process.env.PGHOST || 'localhost',
            database: process.env.PGDATABASE || 'efir_db',
            password: process.env.PGPASSWORD || 'postgres',
            port: parseInt(process.env.PGPORT || '5432', 10),
          };

      const testPool = new Pool(config);
      const client = await Promise.race([
        testPool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('PostgreSQL connection timeout (3s)')), 3000)
        ),
      ]);
      console.log(' Connected to external PostgreSQL database.');
      client.release();
      pgPool = testPool;
    } catch (err) {
      console.warn(' External PostgreSQL not reachable:', err.message);
      console.log(' Falling back to embedded PostgreSQL engine...');
      pgPool = null;
    }
  }

  // 2. If no external PG, choose appropriate embedded engine
  if (!pgPool) {
    // In cloud environments like Render (strict 512MiB RAM limit), PGlite's WASM binary
    // consumes 400MB+ of memory immediately, causing an instant Out-Of-Memory (OOM) crash.
    // Pure JS pg-mem consumes only ~70MB and boots in milliseconds.
    const isCloud = Boolean(
      process.env.RENDER ||
      process.env.VERCEL ||
      process.env.NODE_ENV === 'production' ||
      process.env.USE_PGMEM === 'true'
    );

    if (isCloud) {
      try {
        console.log(' Initializing ultra-lightweight PostgreSQL engine (pg-mem) for cloud environment...');
        const { newDb } = require('pg-mem');
        pgMemDb = newDb();
        registerPgMemFunctions(pgMemDb);
        const pgAdapter = pgMemDb.adapters.createPg();
        pgPool = new pgAdapter.Pool();
        isPgMem = true;
        console.log(' Pure JS PostgreSQL engine (pg-mem) initialized successfully (~70MB memory footprint).');
      } catch (memErr) {
        console.error(' pg-mem cloud initialization error:', memErr.message);
      }
    } else {
      // Local development: Try PGlite for persistent file-based storage
      try {
        const { PGlite } = require('@electric-sql/pglite');
        const dataDir = getDatabaseDataDir();
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        pgliteInstance = new PGlite(dataDir);
        if (pgliteInstance.waitReady) await pgliteInstance.waitReady;
        isPgLite = true;
        console.log(` Persistent PostgreSQL (PGlite) engine initialized at: ${dataDir}`);
      } catch (fsErr) {
        console.warn(' PGlite initialization error, falling back to pg-mem:', fsErr.message);
        const { newDb } = require('pg-mem');
        pgMemDb = newDb();
        registerPgMemFunctions(pgMemDb);
        const pgAdapter = pgMemDb.adapters.createPg();
        pgPool = new pgAdapter.Pool();
        isPgMem = true;
        console.log(' Pure JS PostgreSQL engine (pg-mem) initialized successfully.');
      }
    }
  }

  // Ensure tables and seed exist
  await runMigrationsAndSeed();
}

async function query(text, params = []) {
  if (isPgLite && pgliteInstance) {
    try {
      const result = await pgliteInstance.query(text, params);
      return {
        rows: result.rows || [],
        rowCount: result.rows ? result.rows.length : result.affectedRows || 0,
        fields: result.fields,
      };
    } catch (err) {
      console.error(' PGlite query error:', err.message);
      throw err;
    }
  } else if (pgPool) {
    try {
      const result = await pgPool.query(text, params);
      return result;
    } catch (err) {
      console.error(' Database query error:', err.message);
      throw err;
    }
  } else {
    throw new Error('Database is not initialized yet. Call initDatabase() first.');
  }
}

async function runMigrationsAndSeed() {
  try {
    // Check if 'users' table already exists (portable across Postgres, pg-mem, and PGlite)
    const checkTable = await query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users';
    `);

    const exists = checkTable.rows && checkTable.rows.length > 0;
    if (!exists) {
      console.log(' Running database migrations (schema.sql)...');
      const schemaPath = resolveSqlFile('schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      if (isPgLite && pgliteInstance) {
        await pgliteInstance.exec(schemaSql);
      } else if (pgPool) {
        await pgPool.query(schemaSql);
      }
      console.log(' Schema created successfully.');

      console.log(' Seeding default demo data (seed.sql)...');
      const seedPath = resolveSqlFile('seed.sql');
      const seedSql = fs.readFileSync(seedPath, 'utf8');

      if (isPgLite && pgliteInstance) {
        await pgliteInstance.exec(seedSql);
      } else if (isPgMem) {
        // Strip out SELECT setval for pg-mem (handled by syncSequences)
        const pgMemSeed = seedSql.split(/SELECT\s+setval/i)[0];
        await pgPool.query(pgMemSeed);
      } else if (pgPool) {
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
  const tables = [
    'users',
    'police_stations',
    'officers',
    'complaint_categories',
    'complaints',
    'evidence',
    'firs',
    'investigation_updates',
    'notifications',
    'audit_logs',
    'feedback',
  ];

  if (isPgMem && pgMemDb) {
    // Synchronize auto-increment serial values directly in pg-mem
    for (const tName of tables) {
      try {
        const tbl = pgMemDb.public.getTable(tName);
        if (tbl && tbl.serialsId) {
          const rows = await query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${tName}`);
          const maxId = parseInt(rows.rows[0].max_id, 10);
          let sMap = tbl.db.data.getMap(tbl.serialsId);
          sMap = sMap.set('id', maxId);
          tbl.db.data.set(tbl.serialsId, sMap);
        }
      } catch (e) {
        // Table might not exist or have no serial id
      }
    }
    return;
  }

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
    if (isPgLite && pgliteInstance) {
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
