const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const blockchain = require('../blockchain.cjs');
const { appendAuditEvent } = require('../audit.cjs');
const { isDateLocked } = require('../reconciliation-service.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

function formatAmount(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

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
    LEFT JOIN ledger_entries le ON le.id = (
      SELECT id FROM ledger_entries WHERE tx_id = t.id ORDER BY id DESC LIMIT 1
    )
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

  appendAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    action: 'create',
    entityType: 'transaction',
    entityId: id,
    details: `${type} ${formatAmount(amount)} — ${description}`,
    before: null,
    after: txRecord,
    meta: { ledgerHash: hash, prevHash }
  });

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

// PUT /api/transactions/:id - update a transaction (description, category, donor, program only — amount/type are immutable once hashed)
router.put('/:id', authMiddleware, (req, res) => {
  const { description, category, donor_id, program_id } = req.body;
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const txDate = String(existing.created_at || '').slice(0, 10);
  const lock = isDateLocked(txDate);
  if (lock) {
    return res.status(423).json({
      error: `This transaction is in locked reconciled period ${lock.period_start} to ${lock.period_end}. Use correction entry instead of direct edit.`,
      lock,
      action: 'use-correction-entry',
    });
  }

  const nextDescription = description !== undefined ? description : existing.description;
  const nextCategory = category !== undefined ? category : existing.category;
  const nextDonorId = donor_id !== undefined ? (donor_id || null) : existing.donor_id;
  const nextProgramId = program_id !== undefined ? (program_id || null) : existing.program_id;

  // Reconcile derived totals when relation changes to avoid silent reporting drift.
  if (existing.type === 'income' && existing.donor_id !== nextDonorId) {
    if (existing.donor_id) {
      db.prepare('UPDATE donors SET total_donated = total_donated - ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, existing.donor_id);
    }
    if (nextDonorId) {
      db.prepare('UPDATE donors SET total_donated = total_donated + ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, nextDonorId);
    }
  }

  if (existing.type === 'expense' && existing.program_id !== nextProgramId) {
    if (existing.program_id) {
      db.prepare('UPDATE programs SET spent = spent - ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, existing.program_id);
    }
    if (nextProgramId) {
      db.prepare('UPDATE programs SET spent = spent + ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, nextProgramId);
    }
  }

  db.prepare(`UPDATE transactions SET description = ?, category = ?, donor_id = ?, program_id = ? WHERE id = ?`)
    .run(
      nextDescription,
      nextCategory,
      nextDonorId,
      nextProgramId,
      req.params.id
    );

  const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  const { hash, prevHash } = blockchain.recordToLedger(updated);

  appendAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    action: 'update',
    entityType: 'transaction',
    entityId: req.params.id,
    details: `Updated transaction: ${nextDescription}`,
    before: {
      description: existing.description,
      category: existing.category,
      donor_id: existing.donor_id,
      program_id: existing.program_id,
    },
    after: {
      description: updated.description,
      category: updated.category,
      donor_id: updated.donor_id,
      program_id: updated.program_id,
    },
    meta: { ledgerHash: hash, prevHash, amendment: true }
  });

  res.json({ id: req.params.id, message: 'Updated and re-recorded to immutable ledger' });
});

// POST /api/transactions/:id/correction - create reversal entry for locked/incorrect transaction
router.post('/:id/correction', authMiddleware, (req, res) => {
  const existing = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Transaction not found' });

  const { reason, description, category, donor_id, program_id } = req.body || {};
  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ error: 'reason is required for correction entry' });
  }

  const correctionId = uuidv4();
  const now = new Date().toISOString();
  const correctionType = existing.type === 'income' ? 'expense' : 'income';
  const correctionDescription = description || `Correction reversal for ${existing.id}: ${String(reason).trim()}`;
  const correctionCategory = category !== undefined ? category : existing.category;
  const correctionDonorId = donor_id !== undefined ? (donor_id || null) : existing.donor_id;
  const correctionProgramId = program_id !== undefined ? (program_id || null) : existing.program_id;
  const correctionRef = `CORR-${existing.id.slice(0, 8)}`;

  db.prepare(`
    INSERT INTO transactions (id, type, amount, currency, description, category, donor_id, program_id, created_by, reference_number, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    correctionId,
    correctionType,
    existing.amount,
    existing.currency || 'USD',
    correctionDescription,
    correctionCategory || null,
    correctionDonorId,
    correctionProgramId,
    req.user.id,
    correctionRef,
    now
  );

  if (correctionType === 'expense' && correctionProgramId) {
    db.prepare('UPDATE programs SET spent = spent + ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, correctionProgramId);
  }
  if (correctionType === 'income' && correctionDonorId) {
    db.prepare('UPDATE donors SET total_donated = total_donated + ?, updated_at = datetime(\'now\') WHERE id = ?').run(existing.amount, correctionDonorId);
  }

  const correctionRecord = db.prepare('SELECT * FROM transactions WHERE id = ?').get(correctionId);
  const { hash, prevHash } = blockchain.recordToLedger(correctionRecord);

  appendAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    action: 'correction',
    entityType: 'transaction',
    entityId: correctionId,
    details: `Correction entry for ${existing.id}: ${reason}`,
    before: {
      original_transaction_id: existing.id,
      original_type: existing.type,
      original_amount: existing.amount,
    },
    after: {
      correction_transaction_id: correctionId,
      correction_type: correctionType,
      amount: existing.amount,
      reference_number: correctionRef,
    },
    meta: { ledgerHash: hash, prevHash, reason }
  });

  res.status(201).json({
    message: 'Correction entry created and tracked in immutable ledger',
    correction: {
      id: correctionId,
      type: correctionType,
      amount: existing.amount,
      reference_number: correctionRef,
      blockchain: { hash, prevHash },
    }
  });
});

module.exports = router;
