/**
 * Reconciliation Scheduler
 * 
 * Currently a no-op. Automated bank feed synchronization requires
 * Open Banking API integration (e.g., Brick, Finantier) which is
 * planned for Phase 2.
 * 
 * For now, reconciliation is triggered manually:
 * 1. User imports bank statement (CSV/JSON) via the Finance page
 * 2. User runs reconciliation to match statement entries vs ledger
 * 3. System auto-locks clean periods to prevent edits
 */

function startReconciliationScheduler() {
    console.log('[reconciliation-scheduler] Manual mode — automated bank sync available in Phase 2 (Open Banking API)');
}

module.exports = { startReconciliationScheduler };
