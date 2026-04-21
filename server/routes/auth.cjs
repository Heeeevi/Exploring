const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db.cjs');
const { appendAuditEvent } = require('../audit.cjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fundnproof-secret-key-change-in-prod';

// Middleware to verify JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        try {
            appendAuditEvent({
                actorId: user.id,
                actorName: user.name,
                action: 'login',
                entityType: 'user',
                entityId: user.id,
                details: `Successful login for ${user.email}`,
                meta: { role: user.role }
            });
        } catch (auditErr) {
            console.warn('Audit event failed (non-blocking):', auditErr.message);
        }

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error during login. Please try again.' });
    }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password required' });
        }

        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const id = uuidv4();
        const hashedPassword = bcrypt.hashSync(password, 10);
        const role = 'staff';
        db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
            .run(id, name, email, hashedPassword, role);

        const token = jwt.sign(
            { id, name, email, role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        try {
            appendAuditEvent({
                actorId: id,
                actorName: name,
                action: 'register',
                entityType: 'user',
                entityId: id,
                details: `New staff account registered: ${email}`,
                after: { id, name, email, role }
            });
        } catch (auditErr) {
            console.warn('Audit event failed (non-blocking):', auditErr.message);
        }

        res.status(201).json({
            token,
            user: { id, name, email, role }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error during registration. Please try again.' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Auth /me error:', err);
        res.status(500).json({ error: 'Failed to load user profile' });
    }
});

module.exports = { router, authMiddleware, JWT_SECRET };
