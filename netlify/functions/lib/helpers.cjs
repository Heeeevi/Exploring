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
// With Netlify redirects, paths come as:
//   /api/auth/login → /.netlify/functions/auth/login → rawPath="/login" or path="/.netlify/functions/auth/login"
function parsePath(event) {
    const rawPath = event.rawPath || event.path || '';
    
    // Try to extract from /.netlify/functions/<name>/<rest>
    const match = rawPath.match(/\/\.netlify\/functions\/[^/]+(\/.*)?/);
    if (match && match[1]) {
        return match[1].split('/').filter(Boolean);
    }
    
    // Fallback: everything after the function name
    const functionName = rawPath.split('/').find((_, i, arr) => arr[i - 1] === 'functions') || '';
    if (functionName) {
        const afterFunction = rawPath.split(`/functions/${functionName}`)[1] || '';
        return afterFunction.split('/').filter(Boolean);
    }

    // Last resort: just split the path
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
