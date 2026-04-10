import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../useTheme';
import { Shield, ArrowLeft, Eye, Link as LinkIcon, DollarSign, Globe, Cpu } from 'lucide-react';
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
            icon: <Cpu size={20} />,
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

    return (
        <div className="public-layout">
            <nav className="public-nav">
                <div className="landing-logo">
                    <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" />
                    <span>FundNProof</span>
                    <span className="badge badge-chain" style={{ marginLeft: 8 }}>How It Works</span>
                </div>
                <div className="public-nav-actions">
                    <button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        type="button"
                        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    >
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <Link to="/public" className="btn btn-secondary btn-sm">
                        <ArrowLeft size={14} /> Public Ledger
                    </Link>
                </div>
            </nav>

            <div className="public-body" style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', padding: '48px 0 40px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
                        Bagaimana FundNProof Menjamin Transparansi?
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                        Panduan sederhana tentang cara kerja sistem transparansi keuangan berbasis blockchain untuk organisasi nirlaba.
                    </p>
                </div>

                {stats && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 32, padding: '20px 0', marginBottom: 40, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
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

                <div style={{ marginBottom: 56 }}>
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

                <div style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
                        Pertanyaan Umum
                    </h2>

                    {faqs.map((item, i) => (
                        <div key={i} style={{ padding: '20px 24px', marginBottom: 12, background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-accent)' }}>Q: {item.q}</h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.a}</p>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', padding: '48px 32px', marginBottom: 48, background: 'var(--gradient-card)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
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
