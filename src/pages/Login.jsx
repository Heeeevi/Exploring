import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('admin@transparenterp.org');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegister) {
                await register(name, email, password);
            } else {
                await login(email, password);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div className="landing-logo" style={{ justifyContent: 'center', marginBottom: 16 }}>
                        <div className="logo-icon">🔗</div>
                        TransparentERP
                    </div>
                </div>
                <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="subtitle">{isRegister ? 'Join the transparency movement' : 'Sign in to your dashboard'}</p>

                {error && (
                    <div style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        marginBottom: 20
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ngo.org" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                        {loading ? 'Please wait...' : (isRegister ? <><UserPlus size={18} /> Create Account</> : <><LogIn size={18} /> Sign In</>)}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                        {isRegister ? 'Sign in' : 'Register'}
                    </button>
                </p>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <Link to="/public" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Or view the Public Ledger →
                    </Link>
                </div>
            </div>
        </div>
    );
}
