import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
    Shield, ArrowLeft, Eye, LinkIcon, DollarSign, Users, Globe,
    CheckCircle, ArrowRight, Lock, Search, Download, Database, Cpu, Zap
} from 'lucide-react';

export default function HowItWorks() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.publicStats().then(setStats).catch(() => {});
    }, []);

    return (
        <div className="public-layout">
            <nav className="public-nav">
                <div className="landing-logo">
                    <div className="logo-icon">🔗</div>
                    <span>ChainFund</span>
                    <span className="badge badge-chain" style={{ marginLeft: 8 }}>How It Works</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/public" className="btn btn-secondary btn-sm">
                        <ArrowLeft size={14} /> Public Ledger
                    </Link>
                </div>
            </nav>

            <div className="public-body" style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Hero */}
                <div style={{ textAlign: 'center', padding: '48px 0 40px' }}>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
                        Bagaimana ChainFund<br />Menjamin Transparansi?
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
                        Panduan sederhana tentang cara kerja sistem transparansi keuangan berbasis blockchain untuk organisasi nirlaba.
                    </p>
                </div>

                {/* Live Stats Banner */}
                {stats && (
                    <div style={{
                        display: 'flex', justifyContent: 'center', gap: 32, padding: '20px 0', marginBottom: 40,
                        borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)',
                        flexWrap: 'wrap'
                    }}>
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
                                {stats.chainIntegrity?.valid ? '✅ Intact' : '❌ Broken'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Chain</div>
                        </div>
                    </div>
                )}

                {/* Step-by-Step Flow */}
                <div style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
                        🔄 Alur Transparansi — Dari Input Sampai Verifikasi
                    </h2>

                    {[
                        {
                            step: 1, icon: <DollarSign size={22} />, color: '#10b981',
                            title: 'Staff Mencatat Transaksi',
                            desc: 'Staff NGO menginput transaksi keuangan (income/expense) melalui dashboard. Sama seperti menggunakan software akuntansi biasa — tidak perlu paham teknologi blockchain.',
                            detail: 'Contoh: "Donasi dari Ford Foundation sebesar $50,000 untuk program Clean Water Initiative"'
                        },
                        {
                            step: 2, icon: <Cpu size={22} />, color: '#8b5cf6',
                            title: 'Sistem Otomatis Membuat Hash',
                            desc: 'Dalam hitungan milidetik, sistem mengambil data transaksi dan membuat "sidik jari digital" menggunakan algoritma SHA-256.',
                            detail: 'Data transaksi + hash transaksi sebelumnya → SHA-256 → hash unik baru (misal: a3f8b2c1e9...)'
                        },
                        {
                            step: 3, icon: <LinkIcon size={22} />, color: '#3b82f6',
                            title: 'Hash Dirantai ke Entry Sebelumnya',
                            desc: 'Hash baru ini otomatis terhubung ke hash transaksi sebelumnya, membentuk rantai yang tak terputus (blockchain). Jika ada satu data yang diubah, seluruh rantai setelahnya akan rusak.',
                            detail: 'Genesis → TX1 → TX2 → TX3 → ... → TX terbaru. Setiap link di-verify secara kriptografis.'
                        },
                        {
                            step: 4, icon: <Globe size={22} />, color: '#f59e0b',
                            title: 'Data Tersedia di Public Ledger',
                            desc: 'Semua transaksi langsung muncul di Public Ledger yang bisa diakses siapa saja tanpa login. Donatur, auditor, jurnalis, atau publik umum bisa melihat ke mana uang mengalir.',
                            detail: 'Termasuk: jumlah, deskripsi, program terkait, donatur, hash blockchain, dan timestamp.'
                        },
                        {
                            step: 5, icon: <Shield size={22} />, color: '#ef4444',
                            title: 'Siapapun Bisa Verifikasi',
                            desc: 'Dengan Transaction ID, siapa saja bisa memverifikasi bahwa transaksi benar-benar ada di ledger dan datanya tidak pernah diubah sejak pertama kali dicatat.',
                            detail: 'Sistem menampilkan hash, previous hash, chain context, dan data snapshot asli.'
                        },
                    ].map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: 20, marginBottom: 28, alignItems: 'flex-start'
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                                background: `${item.color}15`, color: item.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {item.icon}
                                <div style={{
                                    position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                                    borderRadius: '50%', background: item.color, color: 'white',
                                    fontSize: '0.65rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {item.step}
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>{item.title}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{item.desc}</p>
                                <div style={{
                                    fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5,
                                    padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-color)', borderRadius: 8,
                                    fontFamily: 'var(--font-mono)'
                                }}>
                                    💡 {item.detail}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* FAQ */}
                <div style={{ marginBottom: 56 }}>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 28, textAlign: 'center' }}>
                        ❓ Pertanyaan Umum
                    </h2>

                    {[
                        {
                            q: 'Apakah data keuangan saya aman?',
                            a: 'Ya. Hanya staff yang login bisa menambah transaksi. Public Ledger hanya menampilkan informasi keuangan yang relevan untuk transparansi (jumlah, deskripsi, program, donatur). Data sensitif seperti password dan internal notes tidak ditampilkan.'
                        },
                        {
                            q: 'Apa yang terjadi kalau ada yang coba mengubah data?',
                            a: 'Setiap perubahan data akan merusak hash chain. Sistem Chain Integrity Check akan langsung mendeteksi di entry mana kerusakan terjadi. Ini bisa dicek kapan saja oleh siapapun di halaman Verify.'
                        },
                        {
                            q: 'Apakah saya perlu paham blockchain?',
                            a: 'Tidak sama sekali! ChainFund dirancang agar bisa digunakan seperti software akuntansi biasa. Semua proses blockchain berjalan otomatis di belakang layar. Kamu cukup input data seperti biasa.'
                        },
                        {
                            q: 'Siapa yang bisa melihat Public Ledger?',
                            a: 'Siapa saja — tanpa perlu membuat akun atau login. Ini adalah inti dari transparansi: donatur, auditor, pemerintah, jurnalis, dan publik umum bisa melihat dan memverifikasi semua transaksi.'
                        },
                        {
                            q: 'Apa perbedaannya dengan laporan keuangan biasa?',
                            a: 'Laporan keuangan biasa bisa diedit atau dipalsukan. Di ChainFund, setiap transaksi dibuktikan dengan hash kriptografis yang saling terhubung. Mengubah 1 angka saja akan merusak seluruh chain — dan semua orang akan tahu.'
                        },
                        {
                            q: 'Bagaimana dengan Solana blockchain?',
                            a: 'Selain hash-chain internal, ChainFund secara periodik mengirim Merkle Root (ringkasan kriptografis dari batch transaksi) ke Solana blockchain. Ini memberikan bukti tambahan yang disimpan di jaringan blockchain publik dan global — tidak bisa dihapus oleh siapapun.'
                        },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '20px 24px', marginBottom: 12,
                            background: 'var(--gradient-card)', border: '1px solid var(--border-color)',
                            borderRadius: 12
                        }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-accent)' }}>
                                Q: {item.q}
                            </h3>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                                {item.a}
                            </p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{
                    textAlign: 'center', padding: '48px 32px', marginBottom: 48,
                    background: 'var(--gradient-card)', border: '1px solid var(--border-color)',
                    borderRadius: 16
                }}>
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
