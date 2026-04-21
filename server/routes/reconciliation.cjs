const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const { authMiddleware } = require('./auth.cjs');
const { appendAuditEvent } = require('../audit.cjs');
const {
    importStatementEntries,
    runReconciliation,
    getReconciliationStatus,
} = require('../reconciliation-service.cjs');
const { fetchEntriesForAccount, listSupportedProviders } = require('../bank-connectors/index.cjs');

const router = express.Router();

function dateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - Number(days || 0));
    return d.toISOString().slice(0, 10);
}

// GET /api/reconciliation/accounts
router.get('/accounts', authMiddleware, (req, res) => {
    const accounts = db.prepare(`
         SELECT a.*,
               (SELECT COUNT(*) FROM bank_statement_entries e WHERE e.bank_account_id = a.id) as statement_count,
               (SELECT created_at FROM reconciliation_runs r WHERE r.bank_account_id = a.id ORDER BY r.id DESC LIMIT 1) as last_reconciled_at
        FROM bank_accounts a
        WHERE a.is_active = 1
        ORDER BY a.created_at DESC
    `).all();

    res.json({ accounts });
});

// POST /api/reconciliation/accounts
router.post('/accounts', authMiddleware, (req, res) => {
    const { name, bank_name, account_number_masked, currency, provider, provider_config } = req.body || {};
    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }

    const id = uuidv4();
    db.prepare(`
        INSERT INTO bank_accounts (id, name, bank_name, account_number_masked, currency, is_active, provider, provider_config_json)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
        id,
        name,
        bank_name || null,
        account_number_masked || null,
        (currency || 'USD').toUpperCase(),
        (provider || 'manual').toLowerCase(),
        provider_config ? JSON.stringify(provider_config) : null
    );

    const created = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(id);

    appendAuditEvent({
        actorId: req.user.id,
        actorName: req.user.name,
        action: 'create',
        entityType: 'bank_account',
        entityId: id,
        details: `Added bank account: ${name}`,
        after: created,
    });

    res.status(201).json(created);
});

// GET /api/reconciliation/providers
router.get('/providers', authMiddleware, (req, res) => {
    res.json({ providers: listSupportedProviders() });
});

// POST /api/reconciliation/import
router.post('/import', authMiddleware, (req, res) => {
    const { bank_account_id, entries, source } = req.body || {};

    if (!bank_account_id) return res.status(400).json({ error: 'bank_account_id is required' });
    if (!Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: 'entries must be a non-empty array' });
    }

    const result = importStatementEntries({
        actor: req.user,
        bankAccountId: bank_account_id,
        entries,
        source: source || 'manual_upload',
        dedupe: true,
    });

    res.status(201).json({ imported: result.imported, skipped: result.skipped, bank_account_id });
});

// POST /api/reconciliation/sync
router.post('/sync', authMiddleware, async (req, res) => {
    const { bank_account_id, days = 7 } = req.body || {};
    if (!bank_account_id) return res.status(400).json({ error: 'bank_account_id is required' });

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND is_active = 1').get(bank_account_id);
    if (!account) return res.status(404).json({ error: 'Bank account not found' });

    const to = new Date().toISOString().slice(0, 10);
    const from = dateDaysAgo(days);
    const pulled = await fetchEntriesForAccount(account, { from, to });

    const imported = importStatementEntries({
        actor: req.user,
        bankAccountId: bank_account_id,
        entries: pulled.entries,
        source: `sync:${pulled.provider}`,
        dedupe: true,
    });

    appendAuditEvent({
        actorId: req.user.id,
        actorName: req.user.name,
        action: 'sync',
        entityType: 'bank_account',
        entityId: bank_account_id,
        details: `Synced ${imported.imported} entries from provider ${pulled.provider}`,
        after: { from, to, provider: pulled.provider, imported: imported.imported, skipped: imported.skipped }
    });

    res.json({
        bank_account_id,
        provider: pulled.provider,
        fetched: pulled.entries.length,
        imported: imported.imported,
        skipped: imported.skipped,
        from,
        to,
    });
});

// POST /api/reconciliation/run
router.post('/run', authMiddleware, (req, res) => {
    const { bank_account_id, period_start, period_end, lock_on_clean = true } = req.body || {};
    if (!bank_account_id || !period_start || !period_end) {
        return res.status(400).json({ error: 'bank_account_id, period_start, and period_end are required' });
    }

    const result = runReconciliation({
        actor: req.user,
        bankAccountId: bank_account_id,
        periodStart: period_start,
        periodEnd: period_end,
        lockOnClean: lock_on_clean !== false,
    });

    res.json(result);
});

// GET /api/reconciliation/locks
router.get('/locks', authMiddleware, (req, res) => {
    const locks = db.prepare(`
        SELECT *
        FROM reconciliation_locks
        WHERE is_active = 1
        ORDER BY created_at DESC
    `).all();

    res.json({ locks });
});

// POST /api/reconciliation/locks/:id/release
router.post('/locks/:id/release', authMiddleware, (req, res) => {
    const lock = db.prepare('SELECT * FROM reconciliation_locks WHERE id = ?').get(req.params.id);
    if (!lock) return res.status(404).json({ error: 'Lock not found' });
    if (!lock.is_active) return res.json({ ok: true, released: false, message: 'Lock already inactive' });

    db.prepare('UPDATE reconciliation_locks SET is_active = 0 WHERE id = ?').run(lock.id);

    appendAuditEvent({
        actorId: req.user.id,
        actorName: req.user.name,
        action: 'unlock',
        entityType: 'reconciliation_lock',
        entityId: String(lock.id),
        details: `Released reconciliation lock ${lock.id} (${lock.period_start}..${lock.period_end})`,
        before: lock,
        after: { ...lock, is_active: 0 },
    });

    res.json({ ok: true, released: true });
});

// GET /api/reconciliation/status
router.get('/status', authMiddleware, (req, res) => {
    res.json(getReconciliationStatus());
});

module.exports = router;
