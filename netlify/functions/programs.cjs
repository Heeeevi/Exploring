/**
 * ChainFund — Programs Function
 * Routes: GET /, POST /, GET /:id, PUT /:id, DELETE /:id
 */
const crypto = require('crypto');
const { supabase } = require('./lib/supabase.cjs');
const { jsonResponse, verifyAuth, handleOptions, parsePath } = require('./lib/helpers.cjs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const user = verifyAuth(event);
    if (!user) return jsonResponse(401, { error: 'No token provided' });

    const segments = parsePath(event);
    const method = event.httpMethod;

    try {
        // GET /programs/:id
        if (method === 'GET' && segments[0]) {
            const { data: program } = await supabase
                .from('programs')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!program) return jsonResponse(404, { error: 'Program not found' });

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*, ledger_entries(hash), donors(name)')
                .eq('program_id', segments[0])
                .order('created_at', { ascending: false });

            return jsonResponse(200, {
                ...program,
                transactions: (transactions || []).map(t => ({
                    ...t,
                    blockchain_hash: t.ledger_entries?.[0]?.hash,
                    donor_name: t.donors?.name,
                    ledger_entries: undefined,
                    donors: undefined,
                }))
            });
        }

        // GET /programs - list all
        if (method === 'GET') {
            const { data } = await supabase
                .from('programs')
                .select('*')
                .order('created_at', { ascending: false });

            // Get transaction stats per program
            const { data: txStats } = await supabase.rpc('get_program_tx_stats');
            const statsMap = {};
            (txStats || []).forEach(r => {
                statsMap[r.program_id] = {
                    transaction_count: r.tx_count,
                    actual_spent: r.actual_spent,
                    actual_income: r.actual_income,
                };
            });

            const programs = (data || []).map(p => ({
                ...p,
                transaction_count: statsMap[p.id]?.transaction_count || 0,
                actual_spent: statsMap[p.id]?.actual_spent || 0,
                actual_income: statsMap[p.id]?.actual_income || 0,
            }));

            return jsonResponse(200, programs);
        }

        // POST /programs
        if (method === 'POST') {
            const { name, description, budget, start_date, end_date } = JSON.parse(event.body || '{}');
            if (!name) return jsonResponse(400, { error: 'Name is required' });

            const id = crypto.randomUUID();
            await supabase.from('programs').insert({
                id, name, description: description || null, budget: budget || 0,
                start_date: start_date || null, end_date: end_date || null
            });

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'create',
                entity_type: 'program', entity_id: id, details: `Created program: ${name}`
            });

            return jsonResponse(201, { id, name, description, budget: budget || 0, spent: 0, status: 'active' });
        }

        // PUT /programs/:id
        if (method === 'PUT' && segments[0]) {
            const { name, description, budget, status, start_date, end_date } = JSON.parse(event.body || '{}');

            const { data: existing } = await supabase
                .from('programs')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!existing) return jsonResponse(404, { error: 'Program not found' });

            await supabase.from('programs').update({
                name: name || existing.name,
                description: description !== undefined ? description : existing.description,
                budget: budget !== undefined ? budget : existing.budget,
                status: status || existing.status,
                start_date: start_date || existing.start_date,
                end_date: end_date || existing.end_date,
                updated_at: new Date().toISOString()
            }).eq('id', segments[0]);

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'update',
                entity_type: 'program', entity_id: segments[0],
                details: `Updated program: ${name || existing.name}`
            });

            return jsonResponse(200, { id: segments[0], message: 'Updated' });
        }

        // DELETE /programs/:id
        if (method === 'DELETE' && segments[0]) {
            const { data: existing } = await supabase
                .from('programs')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!existing) return jsonResponse(404, { error: 'Program not found' });

            const { count: txCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('program_id', segments[0]);

            if (txCount > 0) {
                return jsonResponse(400, {
                    error: `Cannot delete program with ${txCount} linked transaction(s). Remove or reassign them first.`
                });
            }

            await supabase.from('programs').delete().eq('id', segments[0]);

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'delete',
                entity_type: 'program', entity_id: segments[0],
                details: `Deleted program: ${existing.name}`
            });

            return jsonResponse(200, { message: 'Program deleted' });
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Programs error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
