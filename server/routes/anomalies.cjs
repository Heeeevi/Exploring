const express = require('express');
const db = require('../db.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

function severity(score) {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    if (score >= 0.1) return 'low';
    return 'ok';
}

// GET /api/anomalies — Anomaly detection dashboard
router.get('/', authMiddleware, (req, res) => {
    try {
        const anomalies = [];
        let overallScore = 0;
        let checkCount = 0;

        // 1. Suspicious Edits
        const editLogs = db.prepare(
            "SELECT entity_id, COUNT(*) as cnt FROM activity_log WHERE entity_type = 'transaction' AND action = 'update' GROUP BY entity_id HAVING cnt > 1"
        ).all();
        const editScore = Math.min(editLogs.length / 5, 1);
        anomalies.push({
            id: 'suspicious_edits', title: 'Suspicious Edits',
            description: 'Transactions modified more than once after initial recording.',
            severity: severity(editScore), score: editScore, count: editLogs.length,
            details: editLogs.slice(0, 5).map(r => ({ transaction_id: r.entity_id, edit_count: r.cnt, note: `Edited ${r.cnt} times` })),
            recommendation: editLogs.length > 0 ? 'Review these transactions — frequent edits may indicate data manipulation.' : 'No suspicious edits detected.'
        });
        overallScore += editScore; checkCount++;

        // 2. Abnormal Cashflow
        const txAmounts = db.prepare("SELECT id, type, amount, description, created_at FROM transactions ORDER BY created_at DESC LIMIT 200").all();
        let outliers = [];
        if (txAmounts.length > 2) {
            const amounts = txAmounts.map(t => t.amount);
            const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length);
            const threshold = mean + 3 * stdDev;
            outliers = txAmounts.filter(t => t.amount > threshold && threshold > 0);
        }
        const cashflowScore = Math.min(outliers.length / 3, 1);
        anomalies.push({
            id: 'abnormal_cashflow', title: 'Abnormal Cashflow',
            description: 'Transactions with amounts significantly above the statistical average (>3σ).',
            severity: severity(cashflowScore), score: cashflowScore, count: outliers.length,
            details: outliers.slice(0, 5).map(t => ({ transaction_id: t.id, amount: t.amount, type: t.type, description: t.description })),
            recommendation: outliers.length > 0 ? 'These amounts are statistical outliers. Verify they are legitimate.' : 'All amounts within normal range.'
        });
        overallScore += cashflowScore; checkCount++;

        // 3. Donor Mismatch
        const donors = db.prepare("SELECT id, name, total_donated FROM donors").all();
        const mismatches = donors.filter(d => {
            const actual = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='income' AND donor_id=?").get(d.id);
            return Math.abs((d.total_donated || 0) - (actual.total || 0)) > 0.01;
        }).map(d => {
            const actual = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE type='income' AND donor_id=?").get(d.id);
            return { donor_id: d.id, donor_name: d.name, recorded_total: d.total_donated || 0, actual_total: actual.total || 0, difference: (d.total_donated || 0) - (actual.total || 0) };
        });
        const mismatchScore = Math.min(mismatches.length / 3, 1);
        anomalies.push({
            id: 'donor_mismatch', title: 'Donor Record Mismatch',
            description: "Donors whose recorded total doesn't match the sum of actual transactions.",
            severity: severity(mismatchScore), score: mismatchScore, count: mismatches.length,
            details: mismatches.slice(0, 5),
            recommendation: mismatches.length > 0 ? 'Donor totals are inconsistent with transaction records.' : 'All donor records are consistent.'
        });
        overallScore += mismatchScore; checkCount++;

        // 4. Delayed Anchoring
        let lastAnchor = null, totalEntries = 0;
        try {
            lastAnchor = db.prepare("SELECT block_end, created_at FROM chain_anchors ORDER BY id DESC LIMIT 1").get();
            totalEntries = db.prepare("SELECT COUNT(*) as cnt FROM ledger_entries").get().cnt;
        } catch { totalEntries = db.prepare("SELECT COUNT(*) as cnt FROM ledger_entries").get()?.cnt || 0; }
        const anchoredTo = lastAnchor ? lastAnchor.block_end : 0;
        const unanchored = totalEntries - anchoredTo;
        const hoursSinceAnchor = lastAnchor ? (Date.now() - new Date(lastAnchor.created_at).getTime()) / 3600000 : 999;
        const anchorScore = Math.min((unanchored > 10 ? 0.3 : 0) + (hoursSinceAnchor > 72 ? 0.4 : hoursSinceAnchor > 24 ? 0.2 : 0), 1);
        anomalies.push({
            id: 'delayed_anchoring', title: 'Delayed Solana Anchoring',
            description: "Unanchored ledger entries not yet committed to Solana.",
            severity: severity(anchorScore), score: anchorScore, count: unanchored,
            details: [{ unanchored_entries: unanchored, total_entries: totalEntries, hours_since_last_anchor: Math.round(hoursSinceAnchor * 10) / 10, last_anchor_date: lastAnchor?.created_at || 'Never' }],
            recommendation: unanchored > 0 ? `${unanchored} entries not yet anchored.` : 'All entries anchored.'
        });
        overallScore += anchorScore; checkCount++;

        // 5. Rapid-Fire Entries
        const recentLogs = db.prepare(
            "SELECT user_id, user_name, created_at, entity_id FROM activity_log WHERE entity_type='transaction' AND action='create' ORDER BY created_at DESC LIMIT 100"
        ).all();
        const rapidFire = [];
        for (let i = 0; i < recentLogs.length - 1; i++) {
            const curr = recentLogs[i], next = recentLogs[i + 1];
            if (curr.user_id === next.user_id) {
                const diff = new Date(curr.created_at) - new Date(next.created_at);
                if (diff < 120000 && diff >= 0) {
                    rapidFire.push({ user_name: curr.user_name, tx1: curr.entity_id, tx2: next.entity_id, gap_seconds: Math.round(diff / 1000) });
                }
            }
        }
        const rapidScore = Math.min(rapidFire.length / 5, 1);
        anomalies.push({
            id: 'rapid_fire', title: 'Rapid-Fire Entries',
            description: 'Multiple transactions within 2 minutes by same user.',
            severity: severity(rapidScore), score: rapidScore, count: rapidFire.length,
            details: rapidFire.slice(0, 5),
            recommendation: rapidFire.length > 0 ? 'Rapid entry patterns detected. Verify these are legitimate.' : 'No unusual timing patterns.'
        });
        overallScore += rapidScore; checkCount++;

        // 6. Round Number Bias
        const roundCount = txAmounts.filter(t => t.amount % 1000 === 0 && t.amount > 0).length;
        const totalTx = txAmounts.length;
        const roundPct = totalTx > 0 ? roundCount / totalTx : 0;
        const roundScore = roundPct > 0.8 ? 0.7 : roundPct > 0.6 ? 0.4 : roundPct > 0.4 ? 0.1 : 0;
        anomalies.push({
            id: 'round_number_bias', title: 'Round Number Bias',
            description: 'High percentage of round amounts may indicate estimated/fabricated data.',
            severity: severity(roundScore), score: roundScore, count: roundCount,
            details: [{ round_count: roundCount, total_transactions: totalTx, percentage: Math.round(roundPct * 100), threshold_note: 'Normal: < 40%. Suspicious: > 60%.' }],
            recommendation: roundPct > 0.6 ? `${Math.round(roundPct * 100)}% round amounts — unusually high.` : 'Round number distribution normal.'
        });
        overallScore += roundScore; checkCount++;

        const avgScore = checkCount > 0 ? overallScore / checkCount : 0;
        const trustScore = Math.round((1 - avgScore) * 100);

        res.json({
            trust_score: trustScore,
            trust_level: trustScore >= 90 ? 'Excellent' : trustScore >= 70 ? 'Good' : trustScore >= 50 ? 'Fair' : 'Needs Attention',
            total_checks: checkCount,
            anomalies_found: anomalies.filter(a => a.severity !== 'ok').length,
            anomalies,
            computed_at: new Date().toISOString(),
            note: 'Rule-based statistical analysis. No external AI/ML services required.'
        });
    } catch (err) {
        console.error('Anomaly detection error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
