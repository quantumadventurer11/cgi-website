const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dataDir = path.join(__dirname, "..", "data");
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

const insertApplication = db.prepare(`
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

const listApplications = db.prepare(`
  SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
  FROM applications
  ORDER BY datetime(created_at) DESC, id DESC
`);

const getApplication = db.prepare(`
  SELECT id, full_name, email, affiliation, area_of_interest, message, created_at, status
  FROM applications
  WHERE id = ?
`);

const updateApplicationStatus = db.prepare(`
  UPDATE applications
  SET status = @status
  WHERE id = @id
`);

module.exports = {
  db,
  insertApplication,
  listApplications,
  getApplication,
  updateApplicationStatus
};
