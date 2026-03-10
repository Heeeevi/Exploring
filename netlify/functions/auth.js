/**
 * ChainFund — Auth Function (login, register, me)
 * Routes: POST /login, POST /register, GET /me
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('./lib/supabase.js');
const { JWT_SECRET, jsonResponse, verifyAuth, handleOptions, parsePath } = require('./lib/helpers.js');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const segments = parsePath(event);
    const method = event.httpMethod;

    try {
        // POST /auth/login
        if (method === 'POST' && segments[0] === 'login') {
            const { email, password } = JSON.parse(event.body || '{}');
            if (!email || !password) {
                return jsonResponse(400, { error: 'Email and password required' });
            }

            const { data: user } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (!user || !bcrypt.compareSync(password, user.password)) {
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

            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existing) {
                return jsonResponse(409, { error: 'Email already registered' });
            }

            const id = uuidv4();
            const hashedPassword = bcrypt.hashSync(password, 10);
            await supabase.from('users').insert({
                id, name, email, password: hashedPassword, role: role || 'staff'
            });

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

            const { data } = await supabase
                .from('users')
                .select('id, name, email, role, created_at')
                .eq('id', user.id)
                .single();

            if (!data) return jsonResponse(404, { error: 'User not found' });
            return jsonResponse(200, data);
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Auth error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
