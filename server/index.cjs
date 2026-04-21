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
const solanaRouter = require('./routes/solana.cjs');
const activityRouter = require('./routes/activity.cjs');
const telegramRouter = require('./routes/telegram.cjs');
const reconciliationRouter = require('./routes/reconciliation.cjs');
const { startReconciliationScheduler } = require('./reconciliation-scheduler.cjs');

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
app.use('/api/solana', solanaRouter);
app.use('/api/activity', activityRouter);
app.use('/api/telegram', telegramRouter);
app.use('/api/reconciliation', reconciliationRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`\n🔗 FundNProof Backend running on http://localhost:${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api`);
    console.log(`🌐 Public Ledger API: http://localhost:${PORT}/api/public`);
    console.log(`⛓️  Solana Anchor API: http://localhost:${PORT}/api/solana\n`);

    startReconciliationScheduler();
});
