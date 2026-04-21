const express = require('express');
const blockchain = require('../blockchain.cjs');
const db = require('../db.cjs');

const router = express.Router();

// GET /api/public/stats - public chain statistics
router.get('/stats', (req, res) => {
    const stats = blockchain.getChainStats();
    const programCount = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'active'").get().count;
    const donorCount = db.prepare('SELECT COUNT(*) as count FROM donors').get().count;
    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;

    res.json({
        ...stats,
        programCount,
        donorCount,
        txCount,
        chainIntegrity: blockchain.verifyChain()
    });
});

// GET /api/public/ledger - public ledger (paginated)
router.get('/ledger', (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = blockchain.getPublicLedger(Number(page), Number(limit), search);
    res.json(result);
});

// GET /api/public/verify/chain - verify entire chain integrity
router.get('/verify/chain', (req, res) => {
    const result = blockchain.verifyChain();
    res.json(result);
});

// GET /api/public/verify/:txId - verify a single transaction
router.get('/verify/:txId', (req, res) => {
    const result = blockchain.verifyTransaction(req.params.txId);
    res.json(result);
});

// GET /api/public/programs - public program list
router.get('/programs', (req, res) => {
    const programs = db.prepare(`
    SELECT p.id, p.name, p.description, p.budget, p.spent, p.status, p.start_date, p.end_date,
           COUNT(t.id) as transaction_count
    FROM programs p
    LEFT JOIN transactions t ON t.program_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
    res.json(programs);
});

// GET /api/public/export - export all transactions as JSON (CSV can be client-side)
router.get('/export', (req, res) => {
    const transactions = db.prepare(`
    SELECT t.id, t.type, t.amount, t.currency, t.description, t.category, t.status, t.created_at,
           d.name as donor_name, p.name as program_name,
           le.hash as blockchain_hash, le.prev_hash
    FROM transactions t
    LEFT JOIN donors d ON t.donor_id = d.id
    LEFT JOIN programs p ON t.program_id = p.id
        LEFT JOIN ledger_entries le ON le.id = (
            SELECT id FROM ledger_entries WHERE tx_id = t.id ORDER BY id DESC LIMIT 1
        )
    ORDER BY t.created_at DESC
  `).all();

    res.json({
        exported_at: new Date().toISOString(),
        total_records: transactions.length,
        chain_integrity: blockchain.verifyChain(),
        transactions
    });
});

module.exports = router;
