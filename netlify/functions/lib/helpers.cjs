/**
 * FundNProof — Shared auth helpers for Netlify Functions
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fundnproof-secret-key-change-in-prod';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Build JSON response
function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    };
}

// Extract and verify JWT from Authorization header
function verifyAuth(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.split(' ')[1];
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Handle OPTIONS preflight
function handleOptions() {
    return { statusCode: 204, headers: corsHeaders, body: '' };
}

// Parse path segments from the event
// With Netlify redirects (status 200), the event.path contains the ORIGINAL path:
//   /api/auth/login  (not /.netlify/functions/auth/login)
// With direct calls:
//   /.netlify/functions/auth/login
function parsePath(event) {
    const rawPath = event.rawPath || event.path || '';
    
    // Pattern 1: /.netlify/functions/<name>/<rest>
    const netlifyMatch = rawPath.match(/\/\.netlify\/functions\/[^/]+(\/.*)?/);
    if (netlifyMatch) {
        return netlifyMatch[1] ? netlifyMatch[1].split('/').filter(Boolean) : [];
    }
    
    // Pattern 2: /api/<name>/<rest> (from Netlify redirect with status 200)
    const apiMatch = rawPath.match(/\/api\/[^/]+(\/.*)?/);
    if (apiMatch) {
        return apiMatch[1] ? apiMatch[1].split('/').filter(Boolean) : [];
    }

    // Pattern 3: just the path segments (e.g. /login)
    return rawPath.split('/').filter(Boolean);
}

// Parse query string params
function parseQuery(event) {
    return event.queryStringParameters || {};
}

/**
 * Classify a Supabase error to determine if it's transient (paused project, network)
 * or permanent (bad query, auth issue).
 */
function classifySupabaseError(err) {
    if (!err) return null;
    const msg = String(err.message || err.code || '').toLowerCase();
    const hint = String(err.hint || err.details || '').toLowerCase();
    const combined = `${msg} ${hint}`;

    if (combined.includes('project is paused') || combined.includes('project has been paused')) {
        return 'paused';
    }
    if (combined.includes('timeout') || combined.includes('econnrefused') || combined.includes('econnreset')
        || combined.includes('fetch failed') || combined.includes('network') || combined.includes('dns')
        || combined.includes('socket hang up') || combined.includes('aborted')) {
        return 'network';
    }
    if (combined.includes('rate limit') || combined.includes('too many')) {
        return 'rate_limit';
    }
    return 'unknown';
}

/**
 * Build a user-friendly JSON response for Supabase errors.
 */
function supabaseErrorResponse(context, err) {
    const kind = classifySupabaseError(err);
    console.error(`[${context}] Supabase error [${kind}]:`, err.message);

    if (kind === 'paused') {
        return jsonResponse(503, {
            error: 'Database is currently paused due to inactivity. It is waking up now — please try again in 30-60 seconds.',
            code: 'DB_PAUSED'
        });
    }
    if (kind === 'network') {
        return jsonResponse(503, {
            error: 'Cannot reach the database. The service may be waking up — please try again in a moment.',
            code: 'DB_UNREACHABLE'
        });
    }
    if (kind === 'rate_limit') {
        return jsonResponse(429, {
            error: 'Too many requests. Please wait a moment and try again.',
            code: 'RATE_LIMITED'
        });
    }
    return jsonResponse(503, {
        error: 'Database service is temporarily unavailable. Please try again in a moment.',
        code: 'DB_ERROR'
    });
}

/**
 * Execute a Supabase query with a single automatic retry for transient errors.
 * This handles the common case where a free-tier project was paused and needs
 * a moment to wake up.
 */
async function queryWithRetry(queryFn, retryDelayMs = 3000) {
    const first = await queryFn();
    if (!first.error) return first;

    const kind = classifySupabaseError(first.error);
    if (kind === 'paused' || kind === 'network') {
        console.warn(`Supabase transient error (${kind}), retrying in ${retryDelayMs}ms...`);
        await new Promise((r) => setTimeout(r, retryDelayMs));
        return queryFn();
    }
    return first;
}

module.exports = {
    JWT_SECRET,
    corsHeaders,
    jsonResponse,
    verifyAuth,
    handleOptions,
    parsePath,
    parseQuery,
    classifySupabaseError,
    supabaseErrorResponse,
    queryWithRetry,
};

