const db = require('./db.cjs');
const { appendAuditEvent } = require('./audit.cjs');

function dayDiff(a, b) {
    const d1 = new Date(`${a}T00:00:00Z`).getTime();
    const d2 = new Date(`${b}T00:00:00Z`).getTime();
    return Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
}

function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function actorOrSystem(actor) {
    return actor && actor.id ? actor : { id: null, name: 'system' };
}

function importStatementEntries({ actor, bankAccountId, entries, source = 'manual', dedupe = true }) {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('entries must be a non-empty array');
    }

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND is_active = 1').get(bankAccountId);
    if (!account) throw new Error('Bank account not found');

    const insert = db.prepare(`
        INSERT INTO bank_statement_entries (id, bank_account_id, entry_date, amount, direction, description, external_ref, running_balance, imported_by, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const findDup = db.prepare(`
        SELECT id
        FROM bank_statement_entries
        WHERE bank_account_id = ?
          AND entry_date = ?
          AND amount = ?
          AND direction = ?
          AND IFNULL(external_ref, '') = IFNULL(?, '')
        LIMIT 1
    `);

    const { v4: uuidv4 } = require('uuid');
    const insertedIds = [];
    let skipped = 0;

    const tx = db.transaction((items) => {
        for (const row of items) {
            const entry_date = String(row.entry_date || '').slice(0, 10);
            const amount = Number(row.amount || 0);
            const direction = String(row.direction || '').toLowerCase();
            const externalRef = row.external_ref || null;

            if (!entry_date || Number.isNaN(amount) || amount <= 0) {
                throw new Error('Invalid entry format: entry_date and positive amount are required');
            }
            if (!['credit', 'debit'].includes(direction)) {
                throw new Error('Invalid entry format: direction must be credit or debit');
            }

            if (dedupe) {
                const existing = findDup.get(bankAccountId, entry_date, round2(amount), direction, externalRef);
                if (existing) {
                    skipped += 1;
                    continue;
                }
            }

            const id = uuidv4();
            insert.run(
                id,
                bankAccountId,
                entry_date,
                round2(amount),
                direction,
                row.description || null,
                externalRef,
                row.running_balance !== undefined && row.running_balance !== null ? Number(row.running_balance) : null,
                actorOrSystem(actor).id,
                source
            );
            insertedIds.push(id);
        }
    });

    tx(entries);

    if (source !== 'manual_upload' && source !== 'manual') {
        db.prepare('UPDATE bank_accounts SET last_synced_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE id = ?').run(bankAccountId);
    }

    const performer = actorOrSystem(actor);
    appendAuditEvent({
        actorId: performer.id,
        actorName: performer.name,
        action: 'import',
        entityType: 'bank_statement',
        entityId: bankAccountId,
        details: `Imported ${insertedIds.length} statement entries to ${account.name}${skipped ? ` (${skipped} skipped duplicates)` : ''}`,
        after: {
            bank_account_id: bankAccountId,
            inserted_count: insertedIds.length,
            skipped_duplicates: skipped,
            source,
            sample_ids: insertedIds.slice(0, 5),
        },
    });

    return { account, imported: insertedIds.length, skipped, insertedIds };
}

function ensureLockForPeriod({ actor, periodStart, periodEnd, reason }) {
    const existing = db.prepare(`
        SELECT * FROM reconciliation_locks
        WHERE is_active = 1 AND period_start = ? AND period_end = ?
        LIMIT 1
    `).get(periodStart, periodEnd);

    if (existing) return existing;

    const result = db.prepare(`
        INSERT INTO reconciliation_locks (period_start, period_end, reason, is_active, created_by)
        VALUES (?, ?, ?, 1, ?)
    `).run(periodStart, periodEnd, reason || 'Auto lock after clean reconciliation', actorOrSystem(actor).id);

    return db.prepare('SELECT * FROM reconciliation_locks WHERE id = ?').get(result.lastInsertRowid);
}

function runReconciliation({ actor, bankAccountId, periodStart, periodEnd, lockOnClean = true }) {
    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ? AND is_active = 1').get(bankAccountId);
    if (!account) throw new Error('Bank account not found');

    const transactions = db.prepare(`
        SELECT id, type, amount, description, reference_number, date(created_at) as tx_date
        FROM transactions
        WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
        ORDER BY created_at ASC
    `).all(periodStart, periodEnd);

    const statements = db.prepare(`
        SELECT id, direction, amount, description, external_ref, entry_date
        FROM bank_statement_entries
        WHERE bank_account_id = ?
          AND date(entry_date) >= date(?)
          AND date(entry_date) <= date(?)
        ORDER BY entry_date ASC, created_at ASC
    `).all(bankAccountId, periodStart, periodEnd);

    const ledgerIncome = round2(transactions.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.amount || 0), 0));
    const ledgerExpense = round2(transactions.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.amount || 0), 0));
    const bankCredit = round2(statements.filter(s => s.direction === 'credit').reduce((a, b) => a + Number(b.amount || 0), 0));
    const bankDebit = round2(statements.filter(s => s.direction === 'debit').reduce((a, b) => a + Number(b.amount || 0), 0));

    const unmatchedStatementIds = new Set(statements.map(s => s.id));
    const matches = [];
    const unmatchedTransactions = [];

    for (const txItem of transactions) {
        const expectedDirection = txItem.type === 'income' ? 'credit' : 'debit';
        const sameDirection = statements.filter(s => s.direction === expectedDirection && Math.abs(Number(s.amount) - Number(txItem.amount)) < 0.01 && unmatchedStatementIds.has(s.id));

        let chosen = null;
        let bestScore = Number.MAX_SAFE_INTEGER;

        for (const candidate of sameDirection) {
            const txRef = (txItem.reference_number || '').trim().toLowerCase();
            const extRef = (candidate.external_ref || '').trim().toLowerCase();
            const refMatch = txRef && extRef && txRef === extRef;
            const dateDistance = dayDiff(txItem.tx_date, candidate.entry_date);
            if (!refMatch && dateDistance > 3) continue;

            const score = (refMatch ? 0 : 100) + dateDistance;
            if (score < bestScore) {
                bestScore = score;
                chosen = candidate;
            }
        }

        if (chosen) {
            unmatchedStatementIds.delete(chosen.id);
            matches.push({ transaction_id: txItem.id, statement_id: chosen.id, date_diff_days: dayDiff(txItem.tx_date, chosen.entry_date) });
        } else {
            unmatchedTransactions.push(txItem.id);
        }
    }

    const unmatchedStatements = statements.filter(s => unmatchedStatementIds.has(s.id)).map(s => s.id);
    const unmatchedCount = unmatchedTransactions.length + unmatchedStatements.length;

    const deltaIncome = round2(bankCredit - ledgerIncome);
    const deltaExpense = round2(bankDebit - ledgerExpense);

    const details = {
        account: { id: account.id, name: account.name },
        period: { start: periodStart, end: periodEnd },
        matched: matches,
        unmatched_transactions: unmatchedTransactions,
        unmatched_statements: unmatchedStatements,
        tolerance_days: 3,
        amount_tolerance: 0.01,
    };

    const run = db.prepare(`
        INSERT INTO reconciliation_runs (
            bank_account_id, period_start, period_end,
            ledger_income, ledger_expense, bank_credit, bank_debit,
            delta_income, delta_expense,
            matched_count, unmatched_count, details_json, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        bankAccountId,
        periodStart,
        periodEnd,
        ledgerIncome,
        ledgerExpense,
        bankCredit,
        bankDebit,
        deltaIncome,
        deltaExpense,
        matches.length,
        unmatchedCount,
        JSON.stringify(details),
        actorOrSystem(actor).id
    );

    const runId = run.lastInsertRowid;

    let lock = null;
    const clean = Math.abs(deltaIncome) <= 0.009 && Math.abs(deltaExpense) <= 0.009 && unmatchedCount === 0;
    if (clean && lockOnClean) {
        lock = ensureLockForPeriod({
            actor,
            periodStart,
            periodEnd,
            reason: `Auto lock from clean reconciliation run #${runId}`,
        });
    }

    appendAuditEvent({
        actorId: actorOrSystem(actor).id,
        actorName: actorOrSystem(actor).name,
        action: 'reconcile',
        entityType: 'bank_account',
        entityId: bankAccountId,
        details: `Ran reconciliation #${runId} for ${account.name} (${periodStart} to ${periodEnd})`,
        after: {
            run_id: runId,
            delta_income: deltaIncome,
            delta_expense: deltaExpense,
            matched_count: matches.length,
            unmatched_count: unmatchedCount,
            lock_id: lock ? lock.id : null,
        },
        meta: details,
    });

    return {
        run_id: runId,
        bank_account_id: bankAccountId,
        period_start: periodStart,
        period_end: periodEnd,
        ledger_income: ledgerIncome,
        ledger_expense: ledgerExpense,
        bank_credit: bankCredit,
        bank_debit: bankDebit,
        delta_income: deltaIncome,
        delta_expense: deltaExpense,
        matched_count: matches.length,
        unmatched_count: unmatchedCount,
        details,
        lock,
    };
}

function getReconciliationStatus() {
    const latestRuns = db.prepare(`
        SELECT r.*, a.name as account_name, a.bank_name, a.account_number_masked
        FROM reconciliation_runs r
        JOIN bank_accounts a ON a.id = r.bank_account_id
        WHERE r.id IN (
            SELECT MAX(id) FROM reconciliation_runs GROUP BY bank_account_id
        )
        ORDER BY r.created_at DESC
    `).all();

    const totalUnmatched = latestRuns.reduce((acc, row) => acc + Number(row.unmatched_count || 0), 0);
    const hasMismatch = latestRuns.some(r => Math.abs(Number(r.delta_income || 0)) > 0.009 || Math.abs(Number(r.delta_expense || 0)) > 0.009 || Number(r.unmatched_count || 0) > 0);

    const activeLocks = db.prepare(`
        SELECT id, period_start, period_end, reason, created_at
        FROM reconciliation_locks
        WHERE is_active = 1
        ORDER BY created_at DESC
        LIMIT 10
    `).all();

    return {
        total_accounts: latestRuns.length,
        has_mismatch: hasMismatch,
        total_unmatched: totalUnmatched,
        active_locks: activeLocks,
        latest_runs: latestRuns.map(r => ({
            id: r.id,
            bank_account_id: r.bank_account_id,
            account_name: r.account_name,
            bank_name: r.bank_name,
            account_number_masked: r.account_number_masked,
            period_start: r.period_start,
            period_end: r.period_end,
            delta_income: Number(r.delta_income || 0),
            delta_expense: Number(r.delta_expense || 0),
            unmatched_count: Number(r.unmatched_count || 0),
            matched_count: Number(r.matched_count || 0),
            created_at: r.created_at,
        })),
    };
}

function isDateLocked(dateYmd) {
    const row = db.prepare(`
        SELECT id, period_start, period_end, reason
        FROM reconciliation_locks
        WHERE is_active = 1
          AND date(?) >= date(period_start)
          AND date(?) <= date(period_end)
        ORDER BY id DESC
        LIMIT 1
    `).get(dateYmd, dateYmd);

    return row || null;
}

module.exports = {
    importStatementEntries,
    runReconciliation,
    getReconciliationStatus,
    isDateLocked,
};
