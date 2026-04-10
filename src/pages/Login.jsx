import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import { useTheme } from '../useTheme';

export default function Login() {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('admin@fundnproof.org');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuth();
    const { theme, toggleTheme } = useTheme();
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
            <button
                className="theme-toggle login-theme-toggle"
                onClick={toggleTheme}
                type="button"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <div className="login-card">
                <div className="login-brand-wrap">
                    <div className="landing-logo login-brand-logo">
                        <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" />
                        FundNProof
                    </div>
                </div>
                <h1>{isRegister ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="subtitle">{isRegister ? 'Join the transparency movement' : 'Sign in to your dashboard'}</p>

                {error && (
                    <div className="login-error-box">
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
                    <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
                        {loading ? 'Please wait...' : (isRegister ? <><UserPlus size={18} /> Create Account</> : <><LogIn size={18} /> Sign In</>)}
                    </button>
                </form>

                <p className="login-switch-text">
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button className="login-switch-btn" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                        {isRegister ? 'Sign in' : 'Register'}
                    </button>
                </p>

                <div className="login-link-row">
                    <Link to="/public" className="login-public-link">
                        Or view the Public Ledger →
                    </Link>
                </div>
            </div>
        </div>
    );
}
