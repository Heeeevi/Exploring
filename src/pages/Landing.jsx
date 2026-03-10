import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, LinkIcon, BarChart3, Lock, Globe, Anchor } from 'lucide-react';

export default function Landing() {
    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="landing-logo">
                    <div className="logo-icon">🔗</div>
                    ChainFund
                </div>
                <div className="landing-nav-links">
                    <Link to="/public" className="btn btn-ghost">Public Ledger</Link>
                    <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                </div>
            </nav>

            <section className="landing-hero">
                <div className="landing-badge">
                    <span className="pulse"></span>
                    Blockchain-Verified Transparency
                </div>
                <h1>Every Dollar Tracked.<br />Every Transaction Verified.</h1>
                <p>
                    The ERP system built for NGOs that believe in radical transparency.
                    Every financial transaction is cryptographically sealed into an immutable ledger —
                    verifiable by anyone, manipulable by no one.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', fontSize: '0.82rem', color: 'var(--accent-purple)' }}>
                        <Anchor size={14} /> Anchored on Solana
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.82rem', color: '#10b981' }}>
                        <Shield size={14} /> SHA-256 Hash Chain
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: '#3b82f6' }}>
                        <Eye size={14} /> Public Verification
                    </div>
                </div>
                <div className="landing-ctas">
                    <Link to="/login" className="btn btn-primary">
                        <Lock size={18} />
                        Enter Dashboard
                    </Link>
                    <Link to="/public" className="btn btn-secondary">
                        <Eye size={18} />
                        View Public Ledger
                    </Link>
                </div>
            </section>

            <section className="landing-features">
                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                        <Shield size={24} />
                    </div>
                    <h3>Immutable Audit Trail</h3>
                    <p>Every transaction is hashed and chained. Once recorded, it cannot be altered or deleted — even by system administrators.</p>
                </div>

                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#8b5cf6' }}>
                        <Anchor size={24} />
                    </div>
                    <h3>Solana On-Chain Proof</h3>
                    <p>Merkle roots of all transactions are periodically anchored to the Solana blockchain — providing tamper-proof, third-party-verifiable proof.</p>
                </div>

                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        <Eye size={24} />
                    </div>
                    <h3>Public Verification</h3>
                    <p>Donors, auditors, and the public can verify any transaction independently through our public transparency portal.</p>
                </div>

                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' }}>
                        <LinkIcon size={24} />
                    </div>
                    <h3>Hash-Chain Integrity</h3>
                    <p>Cryptographic SHA-256 hash chain ensures data integrity. Any tampering is immediately detectable.</p>
                </div>

                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        <BarChart3 size={24} />
                    </div>
                    <h3>Real-Time Analytics</h3>
                    <p>Track income, expenses, and fund allocation across programs with live dashboards and reporting.</p>
                </div>

                <div className="feature-card animate-in">
                    <div className="feature-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                        <Lock size={24} />
                    </div>
                    <h3>Zero-Knowledge UX</h3>
                    <p>No blockchain knowledge needed. Staff use it like any ERP. The crypto happens invisibly in the background.</p>
                </div>
            </section>
        </div>
    );
}
