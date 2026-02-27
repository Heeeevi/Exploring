const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const blockchain = require('../blockchain.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

// GET /api/transactions - list all transactions
router.get('/', authMiddleware, (req, res) => {
  const { type, program_id, donor_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = `
    SELECT t.*, d.name as donor_name, p.name as program_name, u.name as created_by_name,
           le.hash as blockchain_hash
    FROM transactions t
    LEFT JOIN donors d ON t.donor_id = d.id
    LEFT JOIN programs p ON t.program_id = p.id
    LEFT JOIN users u ON t.created_by = u.id
    LEFT JOIN ledger_entries le ON le.tx_id = t.id
  `;
  const conditions = [];
  const params = [];

  if (type) { conditions.push('t.type = ?'); params.push(type); }
  if (program_id) { conditions.push('t.program_id = ?'); params.push(program_id); }
  if (donor_id) { conditions.push('t.donor_id = ?'); params.push(donor_id); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const transactions = db.prepare(query).all(...params);

  const countQuery = conditions.length > 0
    ? `SELECT COUNT(*) as count FROM transactions t WHERE ${conditions.join(' AND ')}`
    : 'SELECT COUNT(*) as count FROM transactions';
  const total = db.prepare(countQuery).get(...(conditions.length > 0 ? params.slice(0, -2) : [])).count;

  res.json({ transactions, total, page: Number(page), limit: Number(limit) });
});

// GET /api/transactions/stats - dashboard stats
router.get('/stats', authMiddleware, (req, res) => {
  const stats = db.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as totalTransactions,
      COUNT(CASE WHEN type = 'income' THEN 1 END) as incomeCount,
      COUNT(CASE WHEN type = 'expense' THEN 1 END) as expenseCount
    FROM transactions
  `).get();

  const donorCount = db.prepare('SELECT COUNT(*) as count FROM donors').get().count;
  const programCount = db.prepare('SELECT COUNT(*) as count FROM programs').get().count;
  const activePrograms = db.prepare("SELECT COUNT(*) as count FROM programs WHERE status = 'active'").get().count;
  const chainStats = blockchain.getChainStats();

  res.json({
    ...stats,
    netBalance: stats.totalIncome - stats.totalExpense,
    donorCount,
    programCount,
    activePrograms,
    chainStats
  });
});

// GET /api/transactions/recent-chart - data for chart
router.get('/recent-chart', authMiddleware, (req, res) => {
  const days = Number(req.query.days) || 30;
  const data = db.prepare(`
    SELECT 
      date(created_at) as date,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE created_at >= datetime('now', ?)
    GROUP BY date(created_at)
    ORDER BY date(created_at) ASC
  `).all(`-${days} days`);

  res.json(data);
});

// POST /api/transactions - create a new transaction
router.post('/', authMiddleware, (req, res) => {
  const { type, amount, currency, description, category, donor_id, program_id, reference_number } = req.body;

  if (!type || !amount || !description) {
    return res.status(400).json({ error: 'type, amount, and description are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be income or expense' });
  }

  const id = uuidv4();
  const now = new Date().toISOString();

  const transaction = db.prepare(`
    INSERT INTO transactions (id, type, amount, currency, description, category, donor_id, program_id, created_by, reference_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, amount, currency || 'USD', description, category || null, donor_id || null, program_id || null, req.user.id, reference_number || null, now);

  // Update program spent if expense linked to program
  if (type === 'expense' && program_id) {
    db.prepare('UPDATE programs SET spent = spent + ?, updated_at = datetime(\'now\') WHERE id = ?').run(amount, program_id);
  }

  // Update donor total if income linked to donor
  if (type === 'income' && donor_id) {
    db.prepare('UPDATE donors SET total_donated = total_donated + ?, updated_at = datetime(\'now\') WHERE id = ?').run(amount, donor_id);
  }

  // Record to blockchain ledger
  const txRecord = { id, type, amount, currency: currency || 'USD', description, category, donor_id, program_id, created_by: req.user.id, reference_number, created_at: now };
  const { hash, prevHash } = blockchain.recordToLedger(txRecord);

  res.status(201).json({
    id, type, amount, currency: currency || 'USD', description, category,
    donor_id, program_id, reference_number,
    blockchain: { hash, prevHash },
    created_at: now
  });
});

// GET /api/transactions/:id - get single transaction with blockchain proof
router.get('/:id', authMiddleware, (req, res) => {
  const tx = db.prepare(`
    SELECT t.*, d.name as donor_name, p.name as program_name, u.name as created_by_name
    FROM transactions t
    LEFT JOIN donors d ON t.donor_id = d.id
    LEFT JOIN programs p ON t.program_id = p.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  const proof = blockchain.verifyTransaction(tx.id);
  res.json({ ...tx, blockchainProof: proof });
});

module.exports = router;
