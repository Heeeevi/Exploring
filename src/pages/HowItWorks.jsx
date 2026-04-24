import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../useTheme';
import { Shield, ArrowLeft, Eye, Link as LinkIcon, DollarSign, Globe, FileText } from 'lucide-react';
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

    const faqs = [
        {
            q: 'Apakah data keuangan saya aman?',
            a: 'Ya. Hanya staff yang login bisa menambah transaksi. Public Ledger hanya menampilkan informasi yang relevan untuk transparansi.'
        },
        {
            q: 'Apa yang terjadi kalau ada yang coba mengubah data?',
            a: 'Setiap perubahan data akan merusak hash chain. Sistem Chain Integrity Check akan langsung menunjukkan titik kerusakannya.'
        },
        {
            q: 'Apakah saya perlu paham blockchain?',
            a: 'Tidak. FundNProof dirancang seperti software akuntansi biasa. Proses blockchain berjalan otomatis di belakang layar.'
        },
        {
            q: 'Siapa yang bisa melihat Public Ledger?',
            a: 'Siapa saja tanpa perlu login. Donatur, auditor, pemerintah, jurnalis, dan publik umum bisa memverifikasi transaksi.'
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
