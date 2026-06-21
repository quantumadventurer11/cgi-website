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
      `.then(() => sql`
        CREATE TABLE IF NOT EXISTS admin_users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          password_iterations INTEGER NOT NULL,
          password_key_length INTEGER NOT NULL,
          password_digest TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `).then(() => sql`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id SERIAL PRIMARY KEY,
          admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL,
          expires_at TEXT NOT NULL
        )
      `);
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

  async function findAdminUserByUsername(username) {
    await ensureSchema();
    const rows = await sql`
      SELECT id, username, password_hash, password_salt, password_iterations, password_key_length, password_digest, created_at
      FROM admin_users
      WHERE lower(username) = lower(${username})
    `;
    return rows[0] || null;
  }

  async function createAdminUser(row) {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO admin_users (
        username,
        password_hash,
        password_salt,
        password_iterations,
        password_key_length,
        password_digest,
        created_at
      ) VALUES (
        ${row.username},
        ${row.password_hash},
        ${row.password_salt},
        ${row.password_iterations},
        ${row.password_key_length},
        ${row.password_digest},
        ${row.created_at}
      )
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        password_salt = EXCLUDED.password_salt,
        password_iterations = EXCLUDED.password_iterations,
        password_key_length = EXCLUDED.password_key_length,
        password_digest = EXCLUDED.password_digest
      RETURNING id, username
    `;
    return rows[0];
  }

  async function createAdminSession(row) {
    await ensureSchema();
    await sql`
      INSERT INTO admin_sessions (
        admin_user_id,
        token_hash,
        created_at,
        expires_at
      ) VALUES (
        ${row.admin_user_id},
        ${row.token_hash},
        ${row.created_at},
        ${row.expires_at}
      )
    `;
    return { changes: 1 };
  }

  async function findAdminSession(tokenHash) {
    await ensureSchema();
    const rows = await sql`
      SELECT admin_sessions.id, admin_sessions.expires_at, admin_users.id AS admin_user_id, admin_users.username
      FROM admin_sessions
      JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id
      WHERE admin_sessions.token_hash = ${tokenHash}
        AND admin_sessions.expires_at > ${new Date().toISOString()}
    `;
    return rows[0] || null;
  }

  async function deleteExpiredAdminSessions() {
    await ensureSchema();
    await sql`
      DELETE FROM admin_sessions
      WHERE expires_at <= ${new Date().toISOString()}
    `;
    return { changes: 0 };
  }

  module.exports = {
    insertApplication,
    listApplications,
    getApplication,
    updateApplicationStatus,
    createAdminSession,
    createAdminUser,
    deleteExpiredAdminSessions,
    findAdminSession,
    findAdminUserByUsername
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

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_iterations INTEGER NOT NULL,
      password_key_length INTEGER NOT NULL,
      password_digest TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
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

  const findAdminUserByUsernameStatement = db.prepare(`
    SELECT id, username, password_hash, password_salt, password_iterations, password_key_length, password_digest, created_at
    FROM admin_users
    WHERE lower(username) = lower(?)
  `);

  const createAdminUserStatement = db.prepare(`
    INSERT INTO admin_users (
      username,
      password_hash,
      password_salt,
      password_iterations,
      password_key_length,
      password_digest,
      created_at
    ) VALUES (
      @username,
      @password_hash,
      @password_salt,
      @password_iterations,
      @password_key_length,
      @password_digest,
      @created_at
    )
    ON CONFLICT(username) DO UPDATE SET
      password_hash = excluded.password_hash,
      password_salt = excluded.password_salt,
      password_iterations = excluded.password_iterations,
      password_key_length = excluded.password_key_length,
      password_digest = excluded.password_digest
  `);

  const createAdminSessionStatement = db.prepare(`
    INSERT INTO admin_sessions (
      admin_user_id,
      token_hash,
      created_at,
      expires_at
    ) VALUES (
      @admin_user_id,
      @token_hash,
      @created_at,
      @expires_at
    )
  `);

  const findAdminSessionStatement = db.prepare(`
    SELECT admin_sessions.id, admin_sessions.expires_at, admin_users.id AS admin_user_id, admin_users.username
    FROM admin_sessions
    JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id
    WHERE admin_sessions.token_hash = ?
      AND admin_sessions.expires_at > ?
  `);

  const deleteExpiredAdminSessionsStatement = db.prepare(`
    DELETE FROM admin_sessions
    WHERE expires_at <= ?
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
    },
    async findAdminUserByUsername(username) {
      return findAdminUserByUsernameStatement.get(username);
    },
    async createAdminUser(row) {
      createAdminUserStatement.run(row);
      return findAdminUserByUsernameStatement.get(row.username);
    },
    async createAdminSession(row) {
      return createAdminSessionStatement.run(row);
    },
    async findAdminSession(tokenHash) {
      return findAdminSessionStatement.get(tokenHash, new Date().toISOString());
    },
    async deleteExpiredAdminSessions() {
      return deleteExpiredAdminSessionsStatement.run(new Date().toISOString());
    }
  };
}
