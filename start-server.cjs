// Wrapper to start server with error handling
process.on('uncaughtException', (e) => { console.error('UNCAUGHT:', e); });
process.on('unhandledRejection', (e) => { console.error('UNHANDLED:', e); });

const express = require('express');
const cors = require('cors');

// Initialize DB
require('./server/db.cjs');

const { router: authRouter } = require('./server/routes/auth.cjs');
const transactionsRouter = require('./server/routes/transactions.cjs');
const donorsRouter = require('./server/routes/donors.cjs');
const programsRouter = require('./server/routes/programs.cjs');
const publicRouter = require('./server/routes/public.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/donors', donorsRouter);
app.use('/api/programs', programsRouter);
app.use('/api/public', publicRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🔗 Transparent ERP Backend running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Public Ledger API: http://localhost:${PORT}/api/public\n`);
});

server.on('error', (e) => {
    console.error('Server error:', e);
});

// Keep alive
setInterval(() => {}, 1000 * 60 * 60);
