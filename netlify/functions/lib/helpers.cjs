/**
 * ChainFund — Shared auth helpers for Netlify Functions
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chainfund-secret-key-change-in-prod';

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

module.exports = {
    JWT_SECRET,
    corsHeaders,
    jsonResponse,
    verifyAuth,
    handleOptions,
    parsePath,
    parseQuery,
};
