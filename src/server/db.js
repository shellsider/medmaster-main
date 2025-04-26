// src/server/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Compute __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Place the database in src/server/
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Create the users table if it doesn't exist (with the original schema)
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user'
  )
`).run();

// Function to add a column if it doesn't exist
function addColumnIfNotExists(table, column, definition) {
    try {
        // Try a query that references the column
        db.prepare(`SELECT ${column} FROM ${table} LIMIT 1`).get();
    } catch (err) {
        console.log(`Adding column ${column} to ${table}`);
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    }
}

// Run migrations to add new columns to the users table if they do not exist
addColumnIfNotExists('users', 'mbti', 'TEXT DEFAULT NULL');
addColumnIfNotExists('users', 'ei_I', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'ei_E', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'sn_N', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'sn_S', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'tf_F', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'tf_T', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'jp_P', 'INTEGER DEFAULT 0');
addColumnIfNotExists('users', 'jp_J', 'INTEGER DEFAULT 0');

// Create the messages table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    message TEXT,
    file_path TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Create the reports table if it doesn't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    test_type TEXT NOT NULL,  -- e.g., 'CBC'
    report_date TEXT NOT NULL,  -- e.g., timestamp or date string
    inference TEXT NOT NULL,  -- generated inference (can be JSON or plain text)
    report_data TEXT,         -- raw report data as JSON (optional)
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`).run();

console.log('Using SQLite database file at:', dbPath);

export default db;
