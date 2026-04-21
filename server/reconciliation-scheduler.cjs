const db = require('./db.cjs');
const { fetchEntriesForAccount } = require('./bank-connectors/index.cjs');
const { importStatementEntries, runReconciliation } = require('./reconciliation-service.cjs');

let timer = null;

function dateDaysAgo(days) {
    const d = new Date();
    d.setDate(d.getDate() - Number(days || 0));
    return d.toISOString().slice(0, 10);
}

async function runSyncCycle() {
    const accounts = db.prepare(`
        SELECT *
        FROM bank_accounts
        WHERE is_active = 1 AND LOWER(IFNULL(provider, 'manual')) != 'manual'
    `).all();

    if (accounts.length === 0) return;

    const windowDays = Number(process.env.RECONCILIATION_WINDOW_DAYS || 7);
    const to = new Date().toISOString().slice(0, 10);
    const from = dateDaysAgo(windowDays);

    for (const account of accounts) {
        try {
            const pulled = await fetchEntriesForAccount(account, { from, to });
            const imported = importStatementEntries({
                actor: { id: null, name: 'scheduler' },
                bankAccountId: account.id,
                entries: pulled.entries,
                source: `sync:${pulled.provider}`,
                dedupe: true,
            });

            runReconciliation({
                actor: { id: null, name: 'scheduler' },
                bankAccountId: account.id,
                periodStart: from,
                periodEnd: to,
                lockOnClean: true,
            });

            if (imported.imported > 0 || imported.skipped > 0) {
                console.log(`[reconciliation-scheduler] account=${account.id} provider=${pulled.provider} imported=${imported.imported} skipped=${imported.skipped}`);
            }
        } catch (err) {
            console.warn(`[reconciliation-scheduler] account=${account.id} sync failed: ${err.message}`);
        }
     }
 }

function startReconciliationScheduler() {
    const enabled = String(process.env.RECONCILIATION_SCHEDULER_ENABLED || 'true').toLowerCase() !== 'false';
    if (!enabled) {
        console.log('[reconciliation-scheduler] disabled by RECONCILIATION_SCHEDULER_ENABLED=false');
        return;
    }

    const minutes = Math.max(1, Number(process.env.RECONCILIATION_SYNC_INTERVAL_MINUTES || 60));
    const ms = minutes * 60 * 1000;

    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        runSyncCycle().catch((err) => {
            console.warn('[reconciliation-scheduler] cycle error:', err.message);
        });
    }, ms);

    // Trigger once shortly after startup.
    setTimeout(() => {
        runSyncCycle().catch((err) => {
            console.warn('[reconciliation-scheduler] initial cycle error:', err.message);
        });
    }, 1500);

    console.log(`[reconciliation-scheduler] started. interval=${minutes} minute(s), window=${process.env.RECONCILIATION_WINDOW_DAYS || 7} day(s)`);
}

module.exports = { startReconciliationScheduler };
