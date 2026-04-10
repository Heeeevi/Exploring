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

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Public error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
