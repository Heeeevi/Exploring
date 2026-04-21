const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'transparent_erp.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS donors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    organization TEXT,
    country TEXT,
    total_donated REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    budget REAL DEFAULT 0,
    spent REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT NOT NULL,
    category TEXT,
    donor_id TEXT REFERENCES donors(id),
    program_id TEXT REFERENCES programs(id),
    created_by TEXT REFERENCES users(id),
    reference_number TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_id TEXT NOT NULL REFERENCES transactions(id),
    hash TEXT NOT NULL UNIQUE,
    prev_hash TEXT,
    data_snapshot TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chain_anchors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    merkle_root TEXT NOT NULL,
    block_start INTEGER NOT NULL,
    block_end INTEGER NOT NULL,
    entry_count INTEGER NOT NULL,
    anchored_to TEXT,
    anchor_tx_hash TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT,
    actor_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    payload_json TEXT NOT NULL,
    prev_hash TEXT NOT NULL,
    event_hash TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at);

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bank_name TEXT,
    account_number_masked TEXT,
    currency TEXT DEFAULT 'USD',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bank_statement_entries (
    id TEXT PRIMARY KEY,
    bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
    entry_date TEXT NOT NULL,
    amount REAL NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('credit', 'debit')),
    description TEXT,
    external_ref TEXT,
    running_balance REAL,
    imported_by TEXT REFERENCES users(id),
    source TEXT DEFAULT 'manual',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bank_statement_entries_account_date
    ON bank_statement_entries(bank_account_id, entry_date);

  CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_account_id TEXT NOT NULL REFERENCES bank_accounts(id),
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    ledger_income REAL DEFAULT 0,
    ledger_expense REAL DEFAULT 0,
    bank_credit REAL DEFAULT 0,
    bank_debit REAL DEFAULT 0,
    delta_income REAL DEFAULT 0,
    delta_expense REAL DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    unmatched_count INTEGER DEFAULT 0,
    details_json TEXT,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_account_created
    ON reconciliation_runs(bank_account_id, created_at DESC);

  CREATE TABLE IF NOT EXISTS reconciliation_locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    reason TEXT,
    is_active INTEGER DEFAULT 1,
    created_by TEXT REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_reconciliation_locks_period
    ON reconciliation_locks(period_start, period_end, is_active);
`);

function ensureColumn(table, column, typeDef) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = cols.some((c) => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDef}`);
  }
}

ensureColumn('bank_accounts', 'provider', "TEXT DEFAULT 'manual'");
ensureColumn('bank_accounts', 'provider_config_json', 'TEXT');
ensureColumn('bank_accounts', 'last_synced_at', 'TEXT');

// Migrate legacy default admin email and ensure FundNProof default admin exists.
const LEGACY_ADMIN_EMAIL = 'admin@transparenterp.org';
const DEFAULT_ADMIN_EMAIL = 'admin@fundnproof.org';

const defaultAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(DEFAULT_ADMIN_EMAIL);
const legacyAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(LEGACY_ADMIN_EMAIL);

if (!defaultAdmin && legacyAdmin) {
  db.prepare('UPDATE users SET email = ? WHERE id = ?').run(DEFAULT_ADMIN_EMAIL, legacyAdmin.id);
}

const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const { v4: uuidv4 } = require('uuid');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'Admin', DEFAULT_ADMIN_EMAIL, hashedPassword, 'admin'
  );
}

module.exports = db;
