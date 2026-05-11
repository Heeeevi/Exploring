/**
 * FundNProof — Anomaly Detection Function
 * Route: GET /anomalies
 * Computes 6 rule-based anomaly checks from existing data.
 * No ML/AI needed — pure SQL + JS statistics.
 */
const { supabase } = require('./lib/supabase.cjs');
const { jsonResponse, verifyAuth, handleOptions } = require('./lib/helpers.cjs');

// Severity levels
const SEV = { OK: 'ok', LOW: 'low', MEDIUM: 'medium', HIGH: 'high' };

function severity(score) {
    if (score >= 0.7) return SEV.HIGH;
    if (score >= 0.4) return SEV.MEDIUM;
    if (score >= 0.1) return SEV.LOW;
    return SEV.OK;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();
    if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

    const user = verifyAuth(event);
    if (!user) return jsonResponse(401, { error: 'Authentication required' });

    try {
        const anomalies = [];
        let overallScore = 0;
        let checkCount = 0;

        // ─── 1. SUSPICIOUS EDITS ────────────────────────
        // Transactions updated more than once (tracked via activity_log)
        const { data: editLogs } = await supabase
            .from('activity_log')
            .select('entity_id, action')
            .eq('entity_type', 'transaction')
            .eq('action', 'update');

        const editCounts = {};
        (editLogs || []).forEach(l => {
            editCounts[l.entity_id] = (editCounts[l.entity_id] || 0) + 1;
        });
        const multiEdited = Object.entries(editCounts).filter(([, c]) => c > 1);
        const editScore = Math.min(multiEdited.length / 5, 1);
        anomalies.push({
            id: 'suspicious_edits',
            title: 'Suspicious Edits',
            description: 'Transactions modified more than once after initial recording.',
            severity: severity(editScore),
            score: editScore,
            count: multiEdited.length,
            details: multiEdited.slice(0, 5).map(([id, count]) => ({
                transaction_id: id,
                edit_count: count,
                note: `Edited ${count} times`
            })),
            recommendation: multiEdited.length > 0
                ? 'Review these transactions — frequent edits to financial records may indicate data manipulation.'
                : 'No suspicious edits detected. All transactions have clean audit trails.'
        });
        overallScore += editScore; checkCount++;

        // ─── 2. ABNORMAL CASHFLOW ───────────────────────
        // Flag transactions with amounts > 3x standard deviation from mean
        const { data: txAmounts } = await supabase
            .from('transactions')
            .select('id, type, amount, description, created_at')
            .order('created_at', { ascending: false })
            .limit(200);

        let outliers = [];
        if (txAmounts && txAmounts.length > 2) {
            const amounts = txAmounts.map(t => t.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length);
            const threshold = mean + 3 * stdDev;

            outliers = txAmounts.filter(t => t.amount > threshold && threshold > 0);
        }
        const cashflowScore = Math.min(outliers.length / 3, 1);
        anomalies.push({
            id: 'abnormal_cashflow',
            title: 'Abnormal Cashflow',
            description: 'Transactions with amounts significantly above the statistical average (>3σ).',
            severity: severity(cashflowScore),
            score: cashflowScore,
            count: outliers.length,
            details: outliers.slice(0, 5).map(t => ({
                transaction_id: t.id,
                amount: t.amount,
                type: t.type,
                description: t.description,
                date: t.created_at
            })),
            recommendation: outliers.length > 0
                ? 'These amounts are statistical outliers. Verify they are legitimate transactions with proper documentation.'
                : 'All transaction amounts are within normal statistical range.'
        });
        overallScore += cashflowScore; checkCount++;

        // ─── 3. DONOR CLAIM MISMATCH ────────────────────
        // Compare donors.total_donated vs actual SUM of income transactions
        const { data: donors } = await supabase
            .from('donors')
            .select('id, name, total_donated');

        const { data: donorTxs } = await supabase
            .from('transactions')
            .select('donor_id, amount')
            .eq('type', 'income')
            .not('donor_id', 'is', null);

        const actualTotals = {};
        (donorTxs || []).forEach(t => {
            actualTotals[t.donor_id] = (actualTotals[t.donor_id] || 0) + t.amount;
        });

        const mismatches = (donors || []).filter(d => {
            const recorded = d.total_donated || 0;
            const actual = actualTotals[d.id] || 0;
            return Math.abs(recorded - actual) > 0.01;
        }).map(d => ({
            donor_id: d.id,
            donor_name: d.name,
            recorded_total: d.total_donated || 0,
            actual_total: actualTotals[d.id] || 0,
            difference: (d.total_donated || 0) - (actualTotals[d.id] || 0)
        }));

        const mismatchScore = Math.min(mismatches.length / 3, 1);
        anomalies.push({
            id: 'donor_mismatch',
            title: 'Donor Record Mismatch',
            description: 'Donors whose recorded total doesn\'t match the sum of their actual transactions.',
            severity: severity(mismatchScore),
            score: mismatchScore,
            count: mismatches.length,
            details: mismatches.slice(0, 5),
            recommendation: mismatches.length > 0
                ? 'Donor totals are inconsistent with transaction records. This could indicate data entry errors or manipulation.'
                : 'All donor records are consistent with transaction history.'
        });
        overallScore += mismatchScore; checkCount++;

        // ─── 4. DELAYED ANCHORING ───────────────────────
        const { data: lastAnchor } = await supabase
            .from('chain_anchors')
            .select('block_end, created_at')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        const { count: totalEntries } = await supabase
            .from('ledger_entries')
            .select('*', { count: 'exact', head: true });

        const anchoredTo = lastAnchor ? lastAnchor.block_end : 0;
        const unanchored = (totalEntries || 0) - anchoredTo;
        const hoursSinceAnchor = lastAnchor
            ? (Date.now() - new Date(lastAnchor.created_at).getTime()) / 3600000
            : 999;

        const anchorScore = Math.min(
            (unanchored > 10 ? 0.3 : 0) + (hoursSinceAnchor > 72 ? 0.4 : hoursSinceAnchor > 24 ? 0.2 : 0),
            1
        );
        anomalies.push({
            id: 'delayed_anchoring',
            title: 'Delayed Solana Anchoring',
            description: 'Unanchored ledger entries that haven\'t been committed to Solana yet.',
            severity: severity(anchorScore),
            score: anchorScore,
            count: unanchored,
            details: [{
                unanchored_entries: unanchored,
                total_entries: totalEntries || 0,
                hours_since_last_anchor: Math.round(hoursSinceAnchor * 10) / 10,
                last_anchor_date: lastAnchor?.created_at || 'Never'
            }],
            recommendation: unanchored > 0
                ? `${unanchored} entries are not yet anchored to Solana. Anchor regularly to maintain on-chain proof integrity.`
                : 'All entries are anchored to Solana. On-chain proof is up to date.'
        });
        overallScore += anchorScore; checkCount++;

        // ─── 5. RAPID-FIRE ENTRIES ──────────────────────
        // Multiple transactions within 2 minutes by same user
        const { data: recentTxLogs } = await supabase
            .from('activity_log')
            .select('user_id, user_name, created_at, entity_id')
            .eq('entity_type', 'transaction')
            .eq('action', 'create')
            .order('created_at', { ascending: false })
            .limit(100);

        const rapidFire = [];
        if (recentTxLogs && recentTxLogs.length > 1) {
            for (let i = 0; i < recentTxLogs.length - 1; i++) {
                const curr = recentTxLogs[i];
                const next = recentTxLogs[i + 1];
                if (curr.user_id === next.user_id) {
                    const diff = new Date(curr.created_at) - new Date(next.created_at);
                    if (diff < 120000 && diff >= 0) { // < 2 minutes
                        rapidFire.push({
                            user_name: curr.user_name,
                            tx1: curr.entity_id,
                            tx2: next.entity_id,
                            gap_seconds: Math.round(diff / 1000),
                            at: curr.created_at
                        });
                    }
                }
            }
        }
        const rapidScore = Math.min(rapidFire.length / 5, 1);
        anomalies.push({
            id: 'rapid_fire',
            title: 'Rapid-Fire Entries',
            description: 'Multiple transactions created within 2 minutes by the same user.',
            severity: severity(rapidScore),
            score: rapidScore,
            count: rapidFire.length,
            details: rapidFire.slice(0, 5),
            recommendation: rapidFire.length > 0
                ? 'Rapid entry patterns detected. While this may be normal during batch data entry, verify these are legitimate.'
                : 'No unusual entry timing patterns detected.'
        });
        overallScore += rapidScore; checkCount++;

        // ─── 6. ROUND NUMBER BIAS ───────────────────────
        // High % of perfectly round amounts may suggest fabricated data
        const roundCount = (txAmounts || []).filter(t => t.amount % 1000 === 0 && t.amount > 0).length;
        const totalTx = (txAmounts || []).length;
        const roundPct = totalTx > 0 ? roundCount / totalTx : 0;
        // > 80% round is suspicious, > 60% is medium
        const roundScore = roundPct > 0.8 ? 0.7 : roundPct > 0.6 ? 0.4 : roundPct > 0.4 ? 0.1 : 0;

        anomalies.push({
            id: 'round_number_bias',
            title: 'Round Number Bias',
            description: 'High percentage of perfectly round amounts (multiples of 1000) may indicate estimated/fabricated data.',
            severity: severity(roundScore),
            score: roundScore,
            count: roundCount,
            details: [{
                round_count: roundCount,
                total_transactions: totalTx,
                percentage: Math.round(roundPct * 100),
                threshold_note: 'Normal range: < 40%. Suspicious: > 60%.'
            }],
            recommendation: roundPct > 0.6
                ? `${Math.round(roundPct * 100)}% of transactions have perfectly round amounts. This is unusually high and may warrant review.`
                : 'Round number distribution is within normal range.'
        });
        overallScore += roundScore; checkCount++;

        // ─── OVERALL TRUST SCORE ────────────────────────
        const avgScore = checkCount > 0 ? overallScore / checkCount : 0;
        const trustScore = Math.round((1 - avgScore) * 100);

        return jsonResponse(200, {
            trust_score: trustScore,
            trust_level: trustScore >= 90 ? 'Excellent' : trustScore >= 70 ? 'Good' : trustScore >= 50 ? 'Fair' : 'Needs Attention',
            total_checks: checkCount,
            anomalies_found: anomalies.filter(a => a.severity !== 'ok').length,
            anomalies,
            computed_at: new Date().toISOString(),
            note: 'Anomaly detection uses rule-based statistical analysis on existing transaction data. No external AI/ML services required.'
        });

    } catch (err) {
        console.error('Anomaly detection error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
