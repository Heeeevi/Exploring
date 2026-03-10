const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

// GET /api/programs
router.get('/', authMiddleware, (req, res) => {
    const programs = db.prepare(`
    SELECT p.*,
           COUNT(t.id) as transaction_count,
           COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as actual_spent,
           COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as actual_income
    FROM programs p
    LEFT JOIN transactions t ON t.program_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `).all();
    res.json(programs);
});

// POST /api/programs
router.post('/', authMiddleware, (req, res) => {
    const { name, description, budget, start_date, end_date } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();
    db.prepare('INSERT INTO programs (id, name, description, budget, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, description || null, budget || 0, start_date || null, end_date || null);

    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'create', 'program', id, `Created program: ${name}`);

    res.status(201).json({ id, name, description, budget: budget || 0, spent: 0, status: 'active' });
});

// GET /api/programs/:id
router.get('/:id', authMiddleware, (req, res) => {
    const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
    if (!program) return res.status(404).json({ error: 'Program not found' });

    const transactions = db.prepare(`
    SELECT t.*, le.hash as blockchain_hash, d.name as donor_name
    FROM transactions t 
    LEFT JOIN ledger_entries le ON le.tx_id = t.id
    LEFT JOIN donors d ON t.donor_id = d.id
    WHERE t.program_id = ? 
    ORDER BY t.created_at DESC
  `).all(req.params.id);

    res.json({ ...program, transactions });
});

// PUT /api/programs/:id
router.put('/:id', authMiddleware, (req, res) => {
    const { name, description, budget, status, start_date, end_date } = req.body;
    const existing = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Program not found' });

    db.prepare(`UPDATE programs SET 
    name = ?, description = ?, budget = ?, status = ?, start_date = ?, end_date = ?, updated_at = datetime('now')
    WHERE id = ?`)
        .run(
            name || existing.name,
            description !== undefined ? description : existing.description,
            budget !== undefined ? budget : existing.budget,
            status || existing.status,
            start_date || existing.start_date,
            end_date || existing.end_date,
            req.params.id
        );

    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'update', 'program', req.params.id, `Updated program: ${name || existing.name}`);

    res.json({ id: req.params.id, message: 'Updated' });
});

// DELETE /api/programs/:id
router.delete('/:id', authMiddleware, (req, res) => {
    const existing = db.prepare('SELECT * FROM programs WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Program not found' });

    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE program_id = ?').get(req.params.id).count;
    if (txCount > 0) {
        return res.status(400).json({ error: `Cannot delete program with ${txCount} linked transaction(s). Remove or reassign them first.` });
    }

    db.prepare('DELETE FROM programs WHERE id = ?').run(req.params.id);

    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'delete', 'program', req.params.id, `Deleted program: ${existing.name}`);

    res.json({ message: 'Program deleted' });
});

module.exports = router;
