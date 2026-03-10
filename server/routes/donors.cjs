const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

// GET /api/donors
router.get('/', authMiddleware, (req, res) => {
    const donors = db.prepare(`
    SELECT d.*, 
           COUNT(t.id) as transaction_count
    FROM donors d
    LEFT JOIN transactions t ON t.donor_id = d.id AND t.type = 'income'
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).all();
    res.json(donors);
});

// POST /api/donors
router.post('/', authMiddleware, (req, res) => {
    const { name, email, organization, country } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();
    db.prepare('INSERT INTO donors (id, name, email, organization, country) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, email || null, organization || null, country || null);

    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'create', 'donor', id, `Added donor: ${name}`);

    res.status(201).json({ id, name, email, organization, country, total_donated: 0 });
});

// GET /api/donors/:id
router.get('/:id', authMiddleware, (req, res) => {
    const donor = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });

    const transactions = db.prepare(`
    SELECT t.*, le.hash as blockchain_hash 
    FROM transactions t 
    LEFT JOIN ledger_entries le ON le.tx_id = t.id
    WHERE t.donor_id = ? 
    ORDER BY t.created_at DESC
  `).all(req.params.id);

    res.json({ ...donor, transactions });
});

// PUT /api/donors/:id
router.put('/:id', authMiddleware, (req, res) => {
    const { name, email, organization, country } = req.body;
    const existing = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Donor not found' });

    db.prepare('UPDATE donors SET name = ?, email = ?, organization = ?, country = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(name || existing.name, email !== undefined ? email : existing.email, organization !== undefined ? organization : existing.organization, country !== undefined ? country : existing.country, req.params.id);

    // Activity log
    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'update', 'donor', req.params.id, `Updated donor: ${name || existing.name}`);

    res.json({ id: req.params.id, name: name || existing.name, email, organization, country });
});

// DELETE /api/donors/:id
router.delete('/:id', authMiddleware, (req, res) => {
    const existing = db.prepare('SELECT * FROM donors WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Donor not found' });

    // Check for linked transactions
    const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE donor_id = ?').get(req.params.id).count;
    if (txCount > 0) {
        return res.status(400).json({ error: `Cannot delete donor with ${txCount} linked transaction(s). Remove or reassign them first.` });
    }

    db.prepare('DELETE FROM donors WHERE id = ?').run(req.params.id);

    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(req.user.id, req.user.name, 'delete', 'donor', req.params.id, `Deleted donor: ${existing.name}`);

    res.json({ message: 'Donor deleted' });
});

module.exports = router;
