/**
 * FundNProof — Supabase Client (shared by all Netlify Functions)
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseServiceKey);

if (!hasSupabaseConfig) {
    console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
}

const supabase = hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false }
    })
    : null;

module.exports = { supabase, hasSupabaseConfig };
