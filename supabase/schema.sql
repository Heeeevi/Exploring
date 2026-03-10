-- ============================================
-- ChainFund — Supabase Database Schema
-- ============================================
-- Run this SQL in the Supabase SQL Editor to set up all tables.
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Donors
CREATE TABLE IF NOT EXISTS donors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    organization TEXT,
    country TEXT,
    total_donated NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Programs
CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    budget NUMERIC DEFAULT 0,
    spent NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'USD',
    description TEXT NOT NULL,
    category TEXT,
    donor_id TEXT REFERENCES donors(id),
    program_id TEXT REFERENCES programs(id),
    created_by TEXT REFERENCES users(id),
    reference_number TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Ledger Entries (blockchain hash chain)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    tx_id TEXT NOT NULL REFERENCES transactions(id),
    hash TEXT NOT NULL UNIQUE,
    prev_hash TEXT,
    data_snapshot TEXT NOT NULL,
    nonce INTEGER DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 6. Chain Anchors (Solana)
CREATE TABLE IF NOT EXISTS chain_anchors (
    id BIGSERIAL PRIMARY KEY,
    merkle_root TEXT NOT NULL,
    block_start INTEGER NOT NULL,
    block_end INTEGER NOT NULL,
    entry_count INTEGER NOT NULL,
    anchored_to TEXT,
    anchor_tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Activity Log
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_donor ON transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_program ON transactions(program_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_id ON ledger_entries(tx_id);
CREATE INDEX IF NOT EXISTS idx_ledger_hash ON ledger_entries(hash);
CREATE INDEX IF NOT EXISTS idx_ledger_prev_hash ON ledger_entries(prev_hash);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_anchors_tx_hash ON chain_anchors(anchor_tx_hash);

-- ============================================
-- Views (for public ledger queries)
-- ============================================
CREATE OR REPLACE VIEW ledger_entries_view AS
SELECT 
    le.*,
    t.type,
    t.amount,
    t.currency,
    t.description,
    t.category,
    t.status,
    d.name AS donor_name,
    p.name AS program_name
FROM ledger_entries le
JOIN transactions t ON le.tx_id = t.id
LEFT JOIN donors d ON t.donor_id = d.id
LEFT JOIN programs p ON t.program_id = p.id;

-- ============================================
-- RPC Functions (used by Netlify Functions)
-- ============================================

-- Transaction totals for chain stats
CREATE OR REPLACE FUNCTION get_transaction_totals()
RETURNS TABLE(total_income NUMERIC, total_expense NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense
    FROM transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Transaction stats for dashboard
CREATE OR REPLACE FUNCTION get_transaction_stats()
RETURNS TABLE(
    totalincome NUMERIC, 
    totalexpense NUMERIC, 
    totaltransactions BIGINT, 
    incomecount BIGINT, 
    expensecount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
        COUNT(*),
        COUNT(CASE WHEN type = 'income' THEN 1 END),
        COUNT(CASE WHEN type = 'expense' THEN 1 END)
    FROM transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment program spent (atomic)
CREATE OR REPLACE FUNCTION increment_program_spent(p_id TEXT, p_amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE programs SET spent = spent + p_amount, updated_at = now() WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment donor total donated (atomic)
CREATE OR REPLACE FUNCTION increment_donor_total(d_id TEXT, d_amount NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE donors SET total_donated = total_donated + d_amount, updated_at = now() WHERE id = d_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donor transaction counts
CREATE OR REPLACE FUNCTION get_donor_tx_counts()
RETURNS TABLE(donor_id TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT t.donor_id, COUNT(*)
    FROM transactions t
    WHERE t.type = 'income' AND t.donor_id IS NOT NULL
    GROUP BY t.donor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Program transaction stats
CREATE OR REPLACE FUNCTION get_program_tx_stats()
RETURNS TABLE(program_id TEXT, tx_count BIGINT, actual_spent NUMERIC, actual_income NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.program_id,
        COUNT(*),
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0)
    FROM transactions t
    WHERE t.program_id IS NOT NULL
    GROUP BY t.program_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activity log aggregations
CREATE OR REPLACE FUNCTION activity_by_entity_type()
RETURNS TABLE(entity_type TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT al.entity_type, COUNT(*)
    FROM activity_log al
    GROUP BY al.entity_type
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activity_by_action()
RETURNS TABLE(action TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT al.action, COUNT(*)
    FROM activity_log al
    GROUP BY al.action
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION activity_recent_users()
RETURNS TABLE(user_name TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT al.user_name, COUNT(*)
    FROM activity_log al
    WHERE al.created_at >= now() - INTERVAL '7 days'
    GROUP BY al.user_id, al.user_name
    ORDER BY COUNT(*) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Seed default admin user
-- ============================================
-- Password: admin123 (bcrypt hash)
INSERT INTO users (id, name, email, password, role)
VALUES (
    'admin-' || gen_random_uuid()::TEXT,
    'Admin',
    'admin@chainfund.org',
    '$2b$10$U03RRZhNGq0.aJ.wS9d05OLs2VVdNTjNwZ/HDGneogiqctnKRQqsy',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================
-- Row Level Security (RLS) — DISABLE for service role
-- ============================================
-- We use the service_role key in Netlify Functions which bypasses RLS.
-- If you want to add client-side Supabase access later, enable RLS
-- and create appropriate policies.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS automatically.
-- These policies allow the service role full access.
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON donors FOR ALL USING (true);
CREATE POLICY "Service role full access" ON programs FOR ALL USING (true);
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON ledger_entries FOR ALL USING (true);
CREATE POLICY "Service role full access" ON chain_anchors FOR ALL USING (true);
CREATE POLICY "Service role full access" ON activity_log FOR ALL USING (true);
