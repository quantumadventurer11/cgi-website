const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { neon } = require("@neondatabase/serverless");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (connectionString) {
  const sql = neon(connectionString);
  let schemaReady;

  function ensureSchema() {
    if (!schemaReady) {
      schemaReady = sql`
        CREATE TABLE IF NOT EXISTS applications (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT NOT NULL,
          affiliation TEXT,
          area_of_interest TEXT,
          message TEXT,
          created_at TEXT NOT NULL,
          status TEXT DEFAULT 'new'
        )
      `;
    }
    return schemaReady;
  }

  async function insertApplication(row) {
    await ensureSchema();
    await sql`
      INSERT INTO applications (
        full_name,
        email,
        affiliation,
        area_of_interest,
        message,
        created_at,
        status
      ) VALUES (
        ${row.full_name},
        ${row.email},
        ${row.affiliation},
        ${row.area_of_interest},
        ${row.message},
        ${row.created_at},
        ${row.status}
      )
    `;
    return { changes: 1 };
  }

  async function listApplications() {
    await ensureSchema();
    return sql`
      SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
      FROM applications
      ORDER BY created_at DESC, id DESC
    `;
  }

  async function getApplication(id) {
    await ensureSchema();
    const rows = await sql`
      SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
      FROM applications
      WHERE id = ${id}
    `;
    return rows[0] || null;
  }

  async function updateApplicationStatus({ id, status }) {
    await ensureSchema();
    const rows = await sql`
      UPDATE applications
      SET status = ${status}
      WHERE id = ${id}
      RETURNING id
    `;
    return { changes: rows.length };
  }

  module.exports = {
    insertApplication,
    listApplications,
    getApplication,
    updateApplicationStatus
  };
} else {
  const dataDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "..", "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = process.env.SQLITE_PATH || path.join(dataDir, "cgi.sqlite");
  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      affiliation TEXT,
      area_of_interest TEXT,
      message TEXT,
      created_at TEXT NOT NULL,
      status TEXT DEFAULT 'new'
    );
  `);

  const insertStatement = db.prepare(`
    INSERT INTO applications (
      full_name,
      email,
      affiliation,
      area_of_interest,
      message,
      created_at,
      status
    ) VALUES (
      @full_name,
      @email,
      @affiliation,
      @area_of_interest,
      @message,
      @created_at,
      @status
    )
  `);

  const listStatement = db.prepare(`
    SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
    FROM applications
    ORDER BY datetime(created_at) DESC, id DESC
  `);

  const getStatement = db.prepare(`
    SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
    FROM applications
    WHERE id = ?
  `);

  const updateStatement = db.prepare(`
    UPDATE applications
    SET status = @status
    WHERE id = @id
  `);

  module.exports = {
    db,
    async insertApplication(row) {
      return insertStatement.run(row);
    },
    async listApplications() {
      return listStatement.all();
    },
    async getApplication(id) {
      return getStatement.get(id);
    },
    async updateApplicationStatus(row) {
      return updateStatement.run(row);
    }
  };
}
