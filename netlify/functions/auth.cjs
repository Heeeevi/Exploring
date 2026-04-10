/**
 * FundNProof — Auth Function (login, register, me)
 * Routes: POST /login, POST /register, GET /me
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase, hasSupabaseConfig } = require('./lib/supabase.cjs');
const { JWT_SECRET, jsonResponse, verifyAuth, handleOptions, parsePath } = require('./lib/helpers.cjs');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const segments = parsePath(event);
    const method = event.httpMethod;

    if (!hasSupabaseConfig || !supabase) {
        return jsonResponse(503, {
            error: 'Auth service is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
        });
    }

    try {
        // POST /auth/login
        if (method === 'POST' && segments[0] === 'login') {
            const { email, password } = JSON.parse(event.body || '{}');
            if (!email || !password) {
                return jsonResponse(400, { error: 'Email and password required' });
            }

            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id, name, email, role, password')
                .eq('email', email)
                .maybeSingle();

            if (userError) {
                console.error('Auth login query error:', userError.message);
                return jsonResponse(500, { error: 'Failed to validate credentials' });
            }

            if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
                return jsonResponse(401, { error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, name: user.name, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return jsonResponse(200, {
                token,
                user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }

        // POST /auth/register
        if (method === 'POST' && segments[0] === 'register') {
            const { name, email, password, role } = JSON.parse(event.body || '{}');
            if (!name || !email || !password) {
                return jsonResponse(400, { error: 'Name, email, and password required' });
            }

            const { data: existing, error: existingError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (existingError) {
                console.error('Auth register lookup error:', existingError.message);
                return jsonResponse(500, { error: 'Failed to validate email' });
            }

            if (existing) {
                return jsonResponse(409, { error: 'Email already registered' });
            }

            const id = crypto.randomUUID();
            const hashedPassword = bcrypt.hashSync(password, 10);
            const { error: insertError } = await supabase.from('users').insert({
                id, name, email, password: hashedPassword, role: role || 'staff'
            });

            if (insertError) {
                console.error('Auth register insert error:', insertError.message);
                return jsonResponse(500, { error: 'Failed to create account' });
            }

            const token = jwt.sign(
                { id, name, email, role: role || 'staff' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return jsonResponse(201, {
                token,
                user: { id, name, email, role: role || 'staff' }
            });
        }

        // GET /auth/me
        if (method === 'GET' && segments[0] === 'me') {
            const user = verifyAuth(event);
            if (!user) return jsonResponse(401, { error: 'No token provided' });

            const { data, error: meError } = await supabase
                .from('users')
                .select('id, name, email, role, created_at')
                .eq('id', user.id)
                .maybeSingle();

            if (meError) {
                console.error('Auth me query error:', meError.message);
                return jsonResponse(500, { error: 'Failed to load user profile' });
            }

            if (!data) return jsonResponse(404, { error: 'User not found' });
            return jsonResponse(200, data);
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Auth error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
