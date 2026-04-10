/**
 * FundNProof — Donors Function
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
        // GET /donors/:id
        if (method === 'GET' && segments[0]) {
            const { data: donor } = await supabase
                .from('donors')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!donor) return jsonResponse(404, { error: 'Donor not found' });

            const { data: transactions } = await supabase
                .from('transactions')
                .select('*, ledger_entries(hash)')
                .eq('donor_id', segments[0])
                .order('created_at', { ascending: false });

            return jsonResponse(200, {
                ...donor,
                transactions: (transactions || []).map(t => ({
                    ...t,
                    blockchain_hash: t.ledger_entries?.[0]?.hash,
                    ledger_entries: undefined,
                }))
            });
        }

        // GET /donors - list all
        if (method === 'GET') {
            const { data } = await supabase
                .from('donors')
                .select('*')
                .order('created_at', { ascending: false });

            // Get transaction counts
            const { data: txCounts } = await supabase.rpc('get_donor_tx_counts');
            const countMap = {};
            (txCounts || []).forEach(r => { countMap[r.donor_id] = r.count; });

            const donors = (data || []).map(d => ({
                ...d,
                transaction_count: countMap[d.id] || 0
            }));

            return jsonResponse(200, donors);
        }

        // POST /donors
        if (method === 'POST') {
            const { name, email, organization, country } = JSON.parse(event.body || '{}');
            if (!name) return jsonResponse(400, { error: 'Name is required' });

            const id = crypto.randomUUID();
            await supabase.from('donors').insert({
                id, name, email: email || null, organization: organization || null, country: country || null
            });

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'create',
                entity_type: 'donor', entity_id: id, details: `Added donor: ${name}`
            });

            return jsonResponse(201, { id, name, email, organization, country, total_donated: 0 });
        }

        // PUT /donors/:id
        if (method === 'PUT' && segments[0]) {
            const { name, email, organization, country } = JSON.parse(event.body || '{}');

            const { data: existing } = await supabase
                .from('donors')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!existing) return jsonResponse(404, { error: 'Donor not found' });

            await supabase.from('donors').update({
                name: name || existing.name,
                email: email !== undefined ? email : existing.email,
                organization: organization !== undefined ? organization : existing.organization,
                country: country !== undefined ? country : existing.country,
                updated_at: new Date().toISOString()
            }).eq('id', segments[0]);

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'update',
                entity_type: 'donor', entity_id: segments[0],
                details: `Updated donor: ${name || existing.name}`
            });

            return jsonResponse(200, { id: segments[0], name: name || existing.name, email, organization, country });
        }

        // DELETE /donors/:id
        if (method === 'DELETE' && segments[0]) {
            const { data: existing } = await supabase
                .from('donors')
                .select('*')
                .eq('id', segments[0])
                .single();

            if (!existing) return jsonResponse(404, { error: 'Donor not found' });

            const { count: txCount } = await supabase
                .from('transactions')
                .select('*', { count: 'exact', head: true })
                .eq('donor_id', segments[0]);

            if (txCount > 0) {
                return jsonResponse(400, {
                    error: `Cannot delete donor with ${txCount} linked transaction(s). Remove or reassign them first.`
                });
            }

            await supabase.from('donors').delete().eq('id', segments[0]);

            await supabase.from('activity_log').insert({
                user_id: user.id, user_name: user.name, action: 'delete',
                entity_type: 'donor', entity_id: segments[0],
                details: `Deleted donor: ${existing.name}`
            });

            return jsonResponse(200, { message: 'Donor deleted' });
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Donors error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
