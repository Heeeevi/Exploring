/**
 * FundNProof — Public API Function (no auth required)
 * Routes: GET /stats, GET /ledger, GET /verify/chain, GET /verify/:txId, GET /programs, GET /export
 */
const { supabase } = require('./lib/supabase.cjs');
const blockchain = require('./lib/blockchain.cjs');
const { jsonResponse, handleOptions, parsePath, parseQuery } = require('./lib/helpers.cjs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();
    if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

    const segments = parsePath(event);
    const query = parseQuery(event);

    try {
        // GET /public/stats
        if (segments[0] === 'stats') {
            const chainStats = await blockchain.getChainStats();

            const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active');
            const { count: donorCount } = await supabase.from('donors').select('*', { count: 'exact', head: true });
            const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
            const chainIntegrity = await blockchain.verifyChain();

            return jsonResponse(200, {
                ...chainStats,
                programCount: programCount || 0,
                donorCount: donorCount || 0,
                txCount: txCount || 0,
                chainIntegrity
            });
        }

        // GET /public/ledger
        if (segments[0] === 'ledger') {
            const { page = 1, limit = 20, search = '' } = query;
            const result = await blockchain.getPublicLedger(Number(page), Number(limit), search);
            return jsonResponse(200, result);
        }

        // GET /public/verify/chain
        if (segments[0] === 'verify' && segments[1] === 'chain') {
            const result = await blockchain.verifyChain();
            return jsonResponse(200, result);
        }

        // GET /public/verify/:txId
        if (segments[0] === 'verify' && segments[1]) {
            const result = await blockchain.verifyTransaction(segments[1]);
            return jsonResponse(200, result);
        }

        // GET /public/programs
        if (segments[0] === 'programs') {
            const { data } = await supabase
                .from('programs')
                .select('id, name, description, budget, spent, status, start_date, end_date')
                .order('created_at', { ascending: false });

            // Get tx counts
            const { data: txStats } = await supabase.rpc('get_program_tx_stats');
            const statsMap = {};
            (txStats || []).forEach(r => { statsMap[r.program_id] = r.tx_count; });

            const programs = (data || []).map(p => ({
                ...p,
                transaction_count: statsMap[p.id] || 0
            }));

            return jsonResponse(200, programs);
        }

        // GET /public/export
        if (segments[0] === 'export') {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('id, type, amount, currency, description, category, status, created_at, donors(name), programs(name), ledger_entries(hash, prev_hash)')
                .order('created_at', { ascending: false });

            const chainIntegrity = await blockchain.verifyChain();

            const formatted = (transactions || []).map(t => ({
                id: t.id, type: t.type, amount: t.amount, currency: t.currency,
                description: t.description, category: t.category, status: t.status,
                created_at: t.created_at,
                donor_name: t.donors?.name,
                program_name: t.programs?.name,
                blockchain_hash: t.ledger_entries?.[0]?.hash,
                prev_hash: t.ledger_entries?.[0]?.prev_hash,
            }));

            return jsonResponse(200, {
                exported_at: new Date().toISOString(),
                total_records: formatted.length,
                chain_integrity: chainIntegrity,
                transactions: formatted
            });
        }

        // GET /public/donor-lookup?name=...&ref=...
        // Donor Receipt Verification: allows donors to cross-verify their donations
        // This addresses the oracle/input trust problem by enabling independent verification
        if (segments[0] === 'donor-lookup') {
            const { name, ref } = query;
            if (!name && !ref) {
                return jsonResponse(400, { error: 'Provide donor name or reference number to search' });
            }

            let q = supabase
                .from('transactions')
                .select(`
                    id, type, amount, currency, description, category, reference_number, created_at,
                    donors(name, email),
                    programs(name),
                    ledger_entries(hash, prev_hash, timestamp)
                `)
                .eq('type', 'income')
                .order('created_at', { ascending: false })
                .limit(20);

            if (name) {
                q = q.ilike('donors.name', `%${name}%`);
            }
            if (ref) {
                q = q.ilike('reference_number', `%${ref}%`);
            }

            const { data: transactions } = await q;

            // Filter out transactions where the donor join returned null (no match)
            const matched = (transactions || []).filter(t => t.donors !== null);

            const results = matched.map(t => ({
                transaction_id: t.id,
                amount: t.amount,
                currency: t.currency,
                description: t.description,
                category: t.category,
                reference_number: t.reference_number,
                donor_name: t.donors?.name,
                program_name: t.programs?.name,
                recorded_at: t.created_at,
                blockchain_hash: t.ledger_entries?.[0]?.hash,
                hash_timestamp: t.ledger_entries?.[0]?.timestamp,
                // Verification hint for donors
                verification_note: 'Compare this amount and date against your own donation receipt. If they don\'t match, the organization may have recorded incorrect data — and the discrepancy is now permanently traceable on-chain.'
            }));

            return jsonResponse(200, {
                query: { name: name || null, ref: ref || null },
                total_matches: results.length,
                results,
                trust_message: 'These records are cryptographically hashed and anchored to Solana. If any data is modified after recording, the hash chain will break and the tampering will be detectable.'
            });
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Public error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
