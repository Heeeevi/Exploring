const express = require('express');
const db = require('../db.cjs');
const blockchain = require('../blockchain.cjs');
const { appendAuditEvent } = require('../audit.cjs');
const { authMiddleware } = require('./auth.cjs');

const router = express.Router();

// Lazy-load solana to not block startup if @solana/web3.js not installed
let solanaAnchor = null;
function getSolana() {
    if (!solanaAnchor) {
        try {
            solanaAnchor = require('../../solana/anchor-service.cjs');
        } catch (err) {
            console.warn('⚠️  Solana module not available. Install: npm install @solana/web3.js');
            return null;
        }
    }
    return solanaAnchor;
}

// POST /api/solana/anchor - Anchor current chain state to Solana
router.post('/anchor', authMiddleware, async (req, res) => {
    try {
        const solana = getSolana();
        if (!solana) {
            return res.status(503).json({ error: 'Solana not configured. Run: npm install @solana/web3.js' });
        }

        // Get all ledger entry hashes that haven't been anchored yet
        const lastAnchor = db.prepare('SELECT block_end FROM chain_anchors ORDER BY id DESC LIMIT 1').get();
        const startFrom = lastAnchor ? lastAnchor.block_end + 1 : 1;

        const entries = db.prepare('SELECT id, hash FROM ledger_entries WHERE id >= ? ORDER BY id ASC').all(startFrom);

        if (entries.length === 0) {
            return res.json({ message: 'No new entries to anchor', lastAnchor: lastAnchor || null });
        }

        // Compute Merkle Root
        const hashes = entries.map(e => e.hash);
        const merkleRoot = solana.computeMerkleRoot(hashes);

        const blockStart = entries[0].id;
        const blockEnd = entries[entries.length - 1].id;

        // Anchor to Solana
        const result = await solana.anchorToSolana(merkleRoot, entries.length, blockStart, blockEnd);

        if (result.success) {
            // Save anchor record to local DB
            db.prepare(`
                INSERT INTO chain_anchors (merkle_root, block_start, block_end, entry_count, anchored_to, anchor_tx_hash)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(merkleRoot, blockStart, blockEnd, entries.length, `solana:${result.network}`, result.signature);

            appendAuditEvent({
                actorId: req.user.id,
                actorName: req.user.name,
                action: 'anchor',
                entityType: 'anchor',
                entityId: result.signature,
                details: `Anchored ${entries.length} entries to Solana (Merkle: ${merkleRoot.slice(0, 16)}...)`,
                after: {
                    merkleRoot,
                    blockStart,
                    blockEnd,
                    entryCount: entries.length,
                    network: result.network,
                    signature: result.signature,
                }
            });
        }

        res.json(result);
    } catch (err) {
        console.error('Anchor error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/solana/anchors - List all anchors
router.get('/anchors', (req, res) => {
    const anchors = db.prepare('SELECT * FROM chain_anchors ORDER BY id DESC').all();
    res.json(anchors);
});

// GET /api/solana/verify/:signature - Verify a Solana anchor
router.get('/verify/:signature', async (req, res) => {
    try {
        const solana = getSolana();
        if (!solana) {
            return res.status(503).json({ error: 'Solana not configured' });
        }

        const result = await solana.verifyAnchor(req.params.signature);

        // Also check local DB
        const localAnchor = db.prepare('SELECT * FROM chain_anchors WHERE anchor_tx_hash = ?').get(req.params.signature);

        if (localAnchor) {
            // Re-compute Merkle root from local entries to verify match
            const entries = db.prepare('SELECT hash FROM ledger_entries WHERE id >= ? AND id <= ? ORDER BY id ASC')
                .all(localAnchor.block_start, localAnchor.block_end);
            const recomputedRoot = solana.computeMerkleRoot(entries.map(e => e.hash));

            result.localVerification = {
                merkleRootMatch: recomputedRoot === localAnchor.merkle_root,
                storedMerkleRoot: localAnchor.merkle_root,
                recomputedMerkleRoot: recomputedRoot,
                entryCount: localAnchor.entry_count,
                blockRange: `${localAnchor.block_start}-${localAnchor.block_end}`,
            };
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/solana/wallet - Get wallet info
router.get('/wallet', authMiddleware, async (req, res) => {
    try {
        const solana = getSolana();
        if (!solana) {
            return res.status(503).json({ error: 'Solana not configured' });
        }

        const info = await solana.getWalletInfo();
        res.json(info);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/solana/status - Public status of Solana anchoring
router.get('/status', (req, res) => {
    const anchors = db.prepare('SELECT * FROM chain_anchors ORDER BY id DESC').all();
    const totalEntries = db.prepare('SELECT COUNT(*) as count FROM ledger_entries').get().count;
    const lastAnchor = anchors[0] || null;

    const anchoredEntries = lastAnchor ? lastAnchor.block_end : 0;
    const unanchoredEntries = totalEntries - anchoredEntries;

    res.json({
        totalAnchors: anchors.length,
        totalLedgerEntries: totalEntries,
        anchoredEntries,
        unanchoredEntries,
        lastAnchor: lastAnchor ? {
            merkleRoot: lastAnchor.merkle_root,
            signature: lastAnchor.anchor_tx_hash,
            network: lastAnchor.anchored_to,
            entryCount: lastAnchor.entry_count,
            blockRange: `${lastAnchor.block_start}-${lastAnchor.block_end}`,
            timestamp: lastAnchor.created_at,
            explorerUrl: lastAnchor.anchor_tx_hash
                ? `https://explorer.solana.com/tx/${lastAnchor.anchor_tx_hash}?cluster=devnet`
                : null,
        } : null,
        anchors: anchors.map(a => ({
            id: a.id,
            merkleRoot: a.merkle_root.slice(0, 16) + '...',
            signature: a.anchor_tx_hash ? a.anchor_tx_hash.slice(0, 16) + '...' : null,
            entryCount: a.entry_count,
            blockRange: `${a.block_start}-${a.block_end}`,
            network: a.anchored_to,
            timestamp: a.created_at,
        })),
    });
});

module.exports = router;
