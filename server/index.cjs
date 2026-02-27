const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB (creates tables + seeds)
require('./db.cjs');

const { router: authRouter } = require('./routes/auth.cjs');
const transactionsRouter = require('./routes/transactions.cjs');
const donorsRouter = require('./routes/donors.cjs');
const programsRouter = require('./routes/programs.cjs');
const publicRouter = require('./routes/public.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/public', publicRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🔗 Transparent ERP Backend running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Public Ledger API: http://localhost:${PORT}/api/public\n`);
});
