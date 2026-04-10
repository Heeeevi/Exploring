/**
 * FundNProof — Health Check
 */
const { jsonResponse, handleOptions } = require('./lib/helpers.cjs');

exports.handler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') return handleOptions();

        // Test Supabase connection
        let dbStatus = 'unknown';
        try {
            const { supabase } = require('./lib/supabase.cjs');
            const { count, error } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            dbStatus = error ? `error: ${error.message}` : `ok (${count} users)`;
        } catch (dbErr) {
            dbStatus = `exception: ${dbErr.message}`;
        }

        return jsonResponse(200, {
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            env: {
                hasSupabaseUrl: !!process.env.SUPABASE_URL,
                hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasJwtSecret: !!process.env.JWT_SECRET,
                hasSolanaKeypair: !!process.env.SOLANA_KEYPAIR,
                nodeVersion: process.version,
            },
        });
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: err.message, stack: err.stack }),
        };
    }
};
