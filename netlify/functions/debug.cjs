/**
 * ChainFund — Debug Function (test all requires)
 */
exports.handler = async (event) => {
    const results = {};

    try { require('bcryptjs'); results.bcryptjs = 'ok'; } catch (e) { results.bcryptjs = e.message; }
    try { require('jsonwebtoken'); results.jsonwebtoken = 'ok'; } catch (e) { results.jsonwebtoken = e.message; }
    try { require('uuid'); results.uuid = 'ok'; } catch (e) { results.uuid = e.message; }
    try { require('@supabase/supabase-js'); results.supabase = 'ok'; } catch (e) { results.supabase = e.message; }
    try { require('./lib/helpers.cjs'); results.helpers = 'ok'; } catch (e) { results.helpers = e.message; }
    try { require('./lib/supabase.cjs'); results.supabaseLib = 'ok'; } catch (e) { results.supabaseLib = e.message; }
    try { require('./lib/blockchain.cjs'); results.blockchain = 'ok'; } catch (e) { results.blockchain = e.message; }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(results, null, 2),
    };
};
