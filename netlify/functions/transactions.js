/**
 * ChainFund — Transactions Function
 * Routes: GET /, GET /stats, GET /recent-chart, POST /, GET /:id, PUT /:id
 */
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./lib/supabase.js');
const blockchain = require('./lib/blockchain.js');
const { jsonResponse, verifyAuth, handleOptions, parsePath, parseQuery } = require('./lib/helpers.js');

function formatAmount(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const user = verifyAuth(event);
    if (!user) return jsonResponse(401, { error: 'No token provided' });

    const segments = parsePath(event);
    const method = event.httpMethod;
    const query = parseQuery(event);

    try {
        // GET /transactions/stats
        if (method === 'GET' && segments[0] === 'stats') {
            const { data: txData } = await supabase.rpc('get_transaction_stats');
            const stats = txData?.[0] || { totalincome: 0, totalexpense: 0, totaltransactions: 0, incomecount: 0, expensecount: 0 };

            const { count: donorCount } = await supabase.from('donors').select('*', { count: 'exact', head: true });
            const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
            const { count: activePrograms } = await supabase.from('programs').select('*', { count: 'exact', head: true }).eq('status', 'active');
            const chainStats = await blockchain.getChainStats();

            return jsonResponse(200, {
                totalIncome: stats.totalincome || 0,
                totalExpense: stats.totalexpense || 0,
                totalTransactions: stats.totaltransactions || 0,
                incomeCount: stats.incomecount || 0,
                expenseCount: stats.expensecount || 0,
                netBalance: (stats.totalincome || 0) - (stats.totalexpense || 0),
                donorCount: donorCount || 0,
                programCount: programCount || 0,
                activePrograms: activePrograms || 0,
                chainStats
            });
        }

        // GET /transactions/recent-chart
        if (method === 'GET' && segments[0] === 'recent-chart') {
            const days = Number(query.days) || 30;
            const since = new Date(Date.now() - days * 86400000).toISOString();

            const { data } = await supabase
                .from('transactions')
                .select('type, amount, created_at')
                .gte('created_at', since)
                .order('created_at', { ascending: true });

            // Group by date
            const grouped = {};
            (data || []).forEach(t => {
                const date = t.created_at.split('T')[0];
                if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };
                grouped[date][t.type] += t.amount;
            });

            return jsonResponse(200, Object.values(grouped));
        }

        // GET /transactions/:id
        if (method === 'GET' && segments[0] && segments[0] !== 'stats' && segments[0] !== 'recent-chart') {
            const { data: tx } = await supabase
                .from('transactions')
                .select('*, donors(name), programs(name), users:created_by(name)')
                .eq('id', segments[0])
                .single();

            if (!tx) return jsonResponse(404, { error: 'Transaction not found' });

            const proof = await blockchain.verifyTransaction(tx.id);
            return jsonResponse(200, {
                ...tx,
                donor_name: tx.donors?.name,
                program_name: tx.programs?.name,
                created_by_name: tx.users?.name,
                blockchainProof: proof
            });
        }

        // GET /transactions - list all
        if (method === 'GET') {
            const { type, program_id, donor_id, page = 1, limit = 50 } = query;
            const offset = (Number(page) - 1) * Number(limit);

            let q = supabase
                .from('transactions')
                .select(`
                    *,
                    donors(name),
                    programs(name),
                    users:created_by(name),
                    ledger_entries(hash)
                `, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(offset, offset + Number(limit) - 1);

            if (type) q = q.eq('type', type);
            if (program_id) q = q.eq('program_id', program_id);
            if (donor_id) q = q.eq('donor_id', donor_id);

            const { data, count } = await q;

            const transactions = (data || []).map(t => ({
                ...t,
                donor_name: t.donors?.name,
                program_name: t.programs?.name,
                created_by_name: t.users?.name,
                blockchain_hash: t.ledger_entries?.[0]?.hash,
                donors: undefined,
                programs: undefined,
                users: undefined,
                ledger_entries: undefined,
            }));

            return jsonResponse(200, { transactions, total: count || 0, page: Number(page), limit: Number(limit) });
        }

        // POST /transactions
        if (method === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { type, amount, currency, description, category, donor_id, program_id, reference_number } = body;

            if (!type || !amount || !description) {
                return jsonResponse(400, { error: 'type, amount, and description are required' });
            }
            if (!['income', 'expense'].includes(type)) {
                return jsonResponse(400, { error: 'type must be income or expense' });
            }

            const id = uuidv4();
            const now = new Date().toISOString();

            await supabase.from('transactions').insert({
                id, type, amount, currency: currency || 'USD', description,
                category: category || null, donor_id: donor_id || null,
                program_id: program_id || null, created_by: user.id,
                reference_number: reference_number || null, created_at: now
            });

            // Update program spent
            if (type === 'expense' && program_id) {
                await supabase.rpc('increment_program_spent', { p_id: program_id, p_amount: amount });
            }
            // Update donor total
            if (type === 'income' && donor_id) {
                await supabase.rpc('increment_donor_total', { d_id: donor_id, d_amount: amount });
            }

            // Record to blockchain
            const txRecord = { id, type, amount, currency: currency || 'USD', description, category, donor_id, program_id, created_by: user.id, reference_number, created_at: now };
            const { hash, prevHash } = await blockchain.recordToLedger(txRecord);

            // Activity log
            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'create',
                entity_type: 'transaction', entity_id: id,
                details: `${type} ${formatAmount(amount)} — ${description}`
            });

            return jsonResponse(201, {
                id, type, amount, currency: currency || 'USD', description, category,
                donor_id, program_id, reference_number,
                blockchain: { hash, prevHash },
                created_at: now
            });
        }

        // PUT /transactions/:id
        if (method === 'PUT' && segments[0]) {
            const body = JSON.parse(event.body || '{}');
            const { description, category, donor_id, program_id } = body;

            const { data: existing } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!existing) return jsonResponse(404, { error: 'Transaction not found' });

            await supabase.from('transactions').update({
                description: description !== undefined ? description : existing.description,
                category: category !== undefined ? category : existing.category,
                donor_id: donor_id !== undefined ? (donor_id || null) : existing.donor_id,
                program_id: program_id !== undefined ? (program_id || null) : existing.program_id,
            }).eq('id', segments[0]);

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'update',
                entity_type: 'transaction', entity_id: segments[0],
                details: `Updated transaction: ${description || existing.description}`
            });

            return jsonResponse(200, { id: segments[0], message: 'Updated (amount & type are immutable once on-chain)' });
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Transactions error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
