const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

// GET /api/activity - get activity log
router.get('/', authMiddleware, (req, res) => {
    const { page = 1, limit = 50, entity_type } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM activity_log';
    const params = [];

    if (entity_type) {
        query += ' WHERE entity_type = ?';
        params.push(entity_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const activities = db.prepare(query).all(...params);

    const countQuery = entity_type
        ? 'SELECT COUNT(*) as count FROM activity_log WHERE entity_type = ?'
        : 'SELECT COUNT(*) as count FROM activity_log';
    const total = db.prepare(countQuery).get(...(entity_type ? [entity_type] : [])).count;

    res.json({ activities, total, page: Number(page), limit: Number(limit) });
});

// GET /api/activity/stats - activity summary
router.get('/stats', authMiddleware, (req, res) => {
    const today = db.prepare("SELECT COUNT(*) as count FROM activity_log WHERE date(created_at) = date('now')").get().count;
    const thisWeek = db.prepare("SELECT COUNT(*) as count FROM activity_log WHERE created_at >= datetime('now', '-7 days')").get().count;
    const thisMonth = db.prepare("SELECT COUNT(*) as count FROM activity_log WHERE created_at >= datetime('now', '-30 days')").get().count;
    const total = db.prepare('SELECT COUNT(*) as count FROM activity_log').get().count;

    const byType = db.prepare(`
        SELECT entity_type, COUNT(*) as count 
        FROM activity_log 
        GROUP BY entity_type 
        ORDER BY count DESC
    `).all();

    const byAction = db.prepare(`
        SELECT action, COUNT(*) as count 
        FROM activity_log 
        GROUP BY action 
        ORDER BY count DESC
    `).all();

    const recentUsers = db.prepare(`
        SELECT user_name, COUNT(*) as count 
        FROM activity_log 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY user_id 
        ORDER BY count DESC 
        LIMIT 5
    `).all();

    res.json({ today, thisWeek, thisMonth, total, byType, byAction, recentUsers });
});

module.exports = router;
