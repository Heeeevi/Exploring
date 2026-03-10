/**
 * ChainFund — Solana Anchor Function
 * Routes: POST /anchor, GET /anchors, GET /verify/:sig, GET /wallet, GET /status
 */
const crypto = require('crypto');
const { supabase } = require('./lib/supabase.js');
const { jsonResponse, verifyAuth, handleOptions, parsePath } = require('./lib/helpers.js');

// Lazy-load Solana anchor service
let solanaAnchor = null;
function getSolana() {
    if (!solanaAnchor) {
        try {
            solanaAnchor = require('./lib/solana-anchor.js');
        } catch (err) {
            console.warn('⚠️  Solana module not available:', err.message);
            return null;
        }
    }
    return solanaAnchor;
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const segments = parsePath(event);
    const method = event.httpMethod;

    try {
        // GET /solana/anchors (public)
        if (method === 'GET' && segments[0] === 'anchors') {
            const { data } = await supabase
                .from('chain_anchors')
                .select('*')
                .order('id', { ascending: false });
            return jsonResponse(200, data || []);
        }

        // GET /solana/status (public)
        if (method === 'GET' && segments[0] === 'status') {
            const { data: anchors } = await supabase
                .from('chain_anchors')
                .select('*')
                .order('id', { ascending: false });

            const { count: totalEntries } = await supabase
                .from('ledger_entries')
                .select('*', { count: 'exact', head: true });

            const lastAnchor = anchors?.[0] || null;
            const anchoredEntries = lastAnchor ? lastAnchor.block_end : 0;

            return jsonResponse(200, {
                totalAnchors: anchors?.length || 0,
                totalLedgerEntries: totalEntries || 0,
                anchoredEntries,
                unanchoredEntries: (totalEntries || 0) - anchoredEntries,
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
                anchors: (anchors || []).map(a => ({
                    id: a.id,
                    merkleRoot: a.merkle_root.slice(0, 16) + '...',
                    signature: a.anchor_tx_hash ? a.anchor_tx_hash.slice(0, 16) + '...' : null,
                    entryCount: a.entry_count,
                    blockRange: `${a.block_start}-${a.block_end}`,
                    network: a.anchored_to,
                    timestamp: a.created_at,
                })),
            });
        }

        // GET /solana/verify/:signature (public)
        if (method === 'GET' && segments[0] === 'verify' && segments[1]) {
            const solana = getSolana();
            if (!solana) return jsonResponse(503, { error: 'Solana not configured' });

            const result = await solana.verifyAnchor(segments[1]);

            // Cross-check with local DB
            const { data: localAnchor } = await supabase
                .from('chain_anchors')
                .select('*')
                .eq('anchor_tx_hash', segments[1])
                .single();

            if (localAnchor) {
                const { data: entries } = await supabase
                    .from('ledger_entries')
                    .select('hash')
                    .gte('id', localAnchor.block_start)
                    .lte('id', localAnchor.block_end)
                    .order('id', { ascending: true });

                const recomputedRoot = solana.computeMerkleRoot((entries || []).map(e => e.hash));

                result.localVerification = {
                    merkleRootMatch: recomputedRoot === localAnchor.merkle_root,
                    storedMerkleRoot: localAnchor.merkle_root,
                    recomputedMerkleRoot: recomputedRoot,
                    entryCount: localAnchor.entry_count,
                    blockRange: `${localAnchor.block_start}-${localAnchor.block_end}`,
                };
            }

            return jsonResponse(200, result);
        }

        // ---- Auth-required routes below ----
        const user = verifyAuth(event);
        if (!user) return jsonResponse(401, { error: 'No token provided' });

        // POST /solana/anchor
        if (method === 'POST' && segments[0] === 'anchor') {
            const solana = getSolana();
            if (!solana) return jsonResponse(503, { error: 'Solana not configured' });

            // Get unanchored entries
            const { data: lastAnchorRow } = await supabase
                .from('chain_anchors')
                .select('block_end')
                .order('id', { ascending: false })
                .limit(1)
                .single();

            const startFrom = lastAnchorRow ? lastAnchorRow.block_end + 1 : 1;

            const { data: entries } = await supabase
                .from('ledger_entries')
                .select('id, hash')
                .gte('id', startFrom)
                .order('id', { ascending: true });

            if (!entries || entries.length === 0) {
                return jsonResponse(200, { message: 'No new entries to anchor', lastAnchor: lastAnchorRow || null });
            }

            const hashes = entries.map(e => e.hash);
            const merkleRoot = solana.computeMerkleRoot(hashes);
            const blockStart = entries[0].id;
            const blockEnd = entries[entries.length - 1].id;

            const result = await solana.anchorToSolana(merkleRoot, entries.length, blockStart, blockEnd);

            if (result.success) {
                await supabase.from('chain_anchors').insert({
                    merkle_root: merkleRoot,
                    block_start: blockStart,
                    block_end: blockEnd,
                    entry_count: entries.length,
                    anchored_to: `solana:${result.network}`,
                    anchor_tx_hash: result.signature
                });

                await supabase.from('activity_log').insert({
                    user_id: user.id, user_name: user.name, action: 'anchor',
                    entity_type: 'anchor', entity_id: result.signature,
                    details: `Anchored ${entries.length} entries to Solana (Merkle: ${merkleRoot.slice(0, 16)}...)`
                });
            }

            return jsonResponse(200, result);
        }

        // GET /solana/wallet
        if (method === 'GET' && segments[0] === 'wallet') {
            const solana = getSolana();
            if (!solana) return jsonResponse(503, { error: 'Solana not configured' });

            const info = await solana.getWalletInfo();
            return jsonResponse(200, info);
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Solana error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
