/**
 * ChainFund — Activity Log Function
 * Routes: GET /, GET /stats
 */
const { supabase } = require('./lib/supabase.cjs');
const { jsonResponse, verifyAuth, handleOptions, parsePath, parseQuery } = require('./lib/helpers.cjs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();
    if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

    const user = verifyAuth(event);
    if (!user) return jsonResponse(401, { error: 'No token provided' });

    const segments = parsePath(event);
    const query = parseQuery(event);

    try {
        // GET /activity/stats
        if (segments[0] === 'stats') {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            const weekAgo = new Date(now - 7 * 86400000).toISOString();
            const monthAgo = new Date(now - 30 * 86400000).toISOString();

            const { count: today } = await supabase.from('activity_log').select('*', { count: 'exact', head: true }).gte('created_at', todayStart);
            const { count: thisWeek } = await supabase.from('activity_log').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo);
            const { count: thisMonth } = await supabase.from('activity_log').select('*', { count: 'exact', head: true }).gte('created_at', monthAgo);
            const { count: total } = await supabase.from('activity_log').select('*', { count: 'exact', head: true });

            const { data: byTypeRaw } = await supabase.rpc('activity_by_entity_type');
            const { data: byActionRaw } = await supabase.rpc('activity_by_action');
            const { data: recentUsers } = await supabase.rpc('activity_recent_users');

            return jsonResponse(200, {
                today: today || 0,
                thisWeek: thisWeek || 0,
                thisMonth: thisMonth || 0,
                total: total || 0,
                byType: byTypeRaw || [],
                byAction: byActionRaw || [],
                recentUsers: recentUsers || []
            });
        }

        // GET /activity - list
        const { page = 1, limit = 50, entity_type } = query;
        const offset = (Number(page) - 1) * Number(limit);

        let q = supabase
            .from('activity_log')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);

        if (entity_type) q = q.eq('entity_type', entity_type);

        const { data, count } = await q;

        return jsonResponse(200, {
            activities: data || [],
            total: count || 0,
            page: Number(page),
            limit: Number(limit)
        });

    } catch (err) {
        console.error('Activity error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
