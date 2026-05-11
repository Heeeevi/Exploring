import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../useTheme';
import { Shield, ArrowLeft, Eye, Link as LinkIcon, DollarSign, Globe, FileText, Database, Lock, Users, Clock } from 'lucide-react';
import { Sun, Moon } from 'lucide-react';

export default function HowItWorks() {
    const [stats, setStats] = useState(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        api.publicStats().then(setStats).catch(() => {});
    }, []);

    const steps = [
        {
            icon: <DollarSign size={20} />,
            title: 'Staff records a transaction',
            desc: 'Transactions are entered in the dashboard using a normal financial workflow.',
        },
        {
            icon: <FileText size={20} />,
            title: 'System creates a hash',
            desc: 'Each record is turned into a cryptographic fingerprint using SHA-256.',
        },
        {
            icon: <LinkIcon size={20} />,
            title: 'Records are chained',
            desc: 'Each new hash links to the previous one, making silent edits easy to detect.',
        },
        {
            icon: <Globe size={20} />,
            title: 'Public verification is available',
            desc: 'Anyone can inspect the ledger and verify entries independently.',
        },
        {
            icon: <Shield size={20} />,
            title: 'Chain integrity stays visible',
            desc: 'If any part changes, the chain integrity check exposes it immediately.',
        },
    ];

    const whyBlockchain = [
        {
            icon: <Database size={18} />,
            title: 'Why not just use a regular database?',
            desc: 'A database — even append-only — requires trust in the operator. An admin can wipe the server, delete records, or redeploy. With Solana anchoring, the proof exists independently of any single party.'
        },
        {
            icon: <Globe size={18} />,
            title: 'Public verifiability without permission',
            desc: 'Anyone can verify the Merkle Root on Solana Explorer — no API keys, no database access, no permission from the organization needed.'
        },
        {
            icon: <Clock size={18} />,
            title: 'Temporal proof (prevents backdating)',
            desc: "Solana's slot timestamp proves data existed at a specific point in time. Organizations cannot retroactively create fake historical records that match the on-chain root."
        },
        {
            icon: <Lock size={18} />,
            title: 'Censorship resistance',
            desc: 'The organization can shut down their server, delete their database, fire their IT team. The on-chain proof remains permanently on Solana.'
        },
        {
            icon: <Users size={18} />,
            title: 'Multi-party verification',
            desc: 'A donor in Jakarta, a journalist in Surabaya, and an auditor in London can all independently verify the same proof — without coordinating.'
        },
    ];

    const faqs = [
        {
            q: 'Why not use a regular database or audit log?',
            a: 'An append-only database requires you to trust the database operator. Solana requires you to trust math. With FundNProof, proofs exist independently — even if we disappear, the on-chain evidence remains forever.'
        },
        {
            q: 'Can organizations input fake data?',
            a: 'Honest answer: yes, no system prevents false input. But FundNProof makes lying expensive and permanent. Fake data is recorded on a public ledger, anchored to Solana permanently, and donors can cross-verify amounts against their own receipts. The discrepancy becomes permanent, traceable evidence.'
        },
        {
            q: 'Do I need to understand blockchain?',
            a: 'No. FundNProof is designed like regular accounting software. Blockchain processes run automatically in the background. Public verification is as simple as opening a web page.'
        },
        {
            q: 'Who can see the Public Ledger?',
            a: 'Anyone — no login required. Donors, auditors, journalists, government, and the general public can independently verify transactions.'
        },
        {
            q: 'What happens if someone tries to modify recorded data?',
            a: 'Every modification breaks the SHA-256 hash chain. The Chain Integrity Check immediately reveals where the break occurred. Additionally, the on-chain Merkle Root will no longer match the recomputed local root — making tampering mathematically detectable.'
        },
        {
            q: 'What if FundNProof as a company disappears?',
            a: 'The on-chain proofs on Solana remain forever. Exported data can be independently verified by anyone using the open-source hashing algorithm. The database is the convenience layer — Solana is the truth layer.'
        },
    ];

    const [openFaq, setOpenFaq] = useState(null);

    return (
        <div className="public-layout">
            <div className="fronsciers-nav-wrapper">
                <nav className="fronsciers-nav">
                    <Link to="/" className="landing-v2-brand" style={{display: 'flex', alignItems: 'center', marginLeft: 16, fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', textDecoration: 'none'}}>
                        <img src="/FNP Logo.png" alt="FundNProof logo" style={{width:30, height:30, objectFit:'contain', marginRight: 8, background: 'var(--bg-card)', borderRadius: 10, padding: 3, border: '1px solid var(--border-color)'}} />
                        FUNDNPROOF
                    </Link>
                    <div className="landing-v2-actions" style={{display: 'flex', gap: 16, alignItems: 'center', marginRight: 16}}>
                        <Link to="/public" className="btn btn-ghost btn-sm text-muted-foreground">Public Ledger</Link>
                        <button type="button" className="btn btn-ghost btn-sm theme-toggle text-muted-foreground" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                        <Link to="/login" className="btn btn-secondary btn-sm" style={{borderRadius: 9999}}>Sign In</Link>
                    </div>
                </nav>
            </div>

            <div className="public-body" style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '96px 0 40px' }} className="fade-up">
                    <div className="landing-clean-kicker" style={{justifyContent: 'center', marginBottom: 16}}>
                        <span className="uppercase-kicker tracking-widest text-muted-foreground">Blockchain-Powered Transparency</span>
                    </div>
                    <h1 className="tracking-tight" style={{ fontSize: '3.5rem', fontWeight: 600, marginBottom: 16, lineHeight: 1.1 }}>
                        Open, Verifiable, On-Chain
                    </h1>
                    <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '1.125rem', maxWidth: 700, margin: '0 auto' }}>
                        Publish financial transactions faster with transparent proof, permanent storage via Solana, and truly open access. Built for organizations who value rigor, clarity, and credibility.
                    </p>
                </div>

                {stats && (
                    <div className="fade-up delay-100" style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '20px 0', marginBottom: 40, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{stats.txCount}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaksi Tercatat</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{stats.totalEntries}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blockchain Entries</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-accent)' }}>
                                {stats.chainIntegrity?.valid ? 'Intact' : 'Broken'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Chain</div>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: 56 }} className="fade-up delay-200">
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
                        Alur Transparansi - Dari Input Sampai Verifikasi
                    </h2>

                    {steps.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 28, alignItems: 'flex-start' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: i % 2 === 0 ? 'rgba(37, 99, 235, 0.12)' : 'rgba(59, 130, 246, 0.12)', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Why Blockchain Section */}
                <div style={{ marginBottom: 56 }} className="fade-up delay-200">
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
                        Why Blockchain Must Exist Here
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28, maxWidth: 600, margin: '0 auto 28px' }}>
                        "An append-only database requires you to trust the operator. Solana requires you to trust math."
                    </p>

                    {whyBlockchain.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 20, marginBottom: 24, alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {item.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{margin: '6rem 0'}} className="fade-up delay-300">
                    <div className="custom-scroll-text-container">
                        <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                        <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                        <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                    </div>
                </div>

                <div style={{ marginBottom: 56 }} className="fade-up delay-300">
                    <h2 className="tracking-tight" style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 28, color: 'var(--text-primary)' }}>
                        Got Questions?<br/>We've Got Answers.
                    </h2>
                    <div style={{marginTop: 32}}>
                    {faqs.map((item, i) => (
                        <div key={i} className="fronsciers-faq-group">
                            <button className="fronsciers-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                <span>{item.q}</span>
                                <div style={{width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                                    <div style={{width: 16, height: 2, background: 'var(--text-primary)'}}></div>
                                    <div style={{width: 2, height: 16, background: 'var(--text-primary)', position: 'absolute', transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)', opacity: openFaq === i ? 0 : 1, transition: 'all 0.3s'}}></div>
                                </div>
                            </button>
                            <div className={`fronsciers-faq-content ${openFaq === i ? 'is-open' : ''}`}>
                                <p className="text-muted-foreground">{item.a}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                <div className="fade-up delay-400" style={{ textAlign: 'center', padding: '48px 32px', marginBottom: 48, background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>Siap Melihat Datanya?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '1rem' }}>
                        Jelajahi Public Ledger atau verifikasi transaksi secara independen.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/public" className="btn btn-primary">
                            <Eye size={16} /> Buka Public Ledger
                        </Link>
                        <Link to="/public/verify" className="btn btn-secondary">
                            <Shield size={16} /> Verifikasi Transaksi
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
