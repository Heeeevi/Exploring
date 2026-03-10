import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import {
    BookOpen, DollarSign, Users, FolderKanban, Shield, Globe, Search,
    ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Download,
    CheckCircle, Lightbulb, HelpCircle, Rocket
} from 'lucide-react';

const sections = [
    {
        id: 'getting-started',
        icon: <Rocket size={20} />,
        title: 'Mulai Menggunakan ChainFund',
        color: '#3b82f6',
        steps: [
            {
                title: 'Login ke Dashboard',
                content: `Buka halaman login dan masukkan email serta password yang sudah diberikan oleh admin. Setelah berhasil login, kamu akan langsung diarahkan ke Dashboard utama.

**Akun default:** admin@chainfund.org / admin123

Kalau belum punya akun, klik "Register" untuk bikin akun baru. Akun baru otomatis mendapat role "staff".`
            },
            {
                title: 'Memahami Dashboard',
                content: `Dashboard menampilkan ringkasan keuangan organisasi kamu:

• **Total Income** — Semua pemasukan yang sudah dicatat
• **Total Expenses** — Semua pengeluaran yang sudah dicatat  
• **Net Balance** — Selisih income - expense (sisa dana)
• **Donors** — Jumlah donatur yang terdaftar
• **Chart** — Grafik income vs expense 30 hari terakhir
• **Blockchain Status** — Status integritas hash chain (harus "Verified ✓")`
            },
        ]
    },
    {
        id: 'finance',
        icon: <DollarSign size={20} />,
        title: 'Mencatat Transaksi Keuangan',
        color: '#10b981',
        steps: [
            {
                title: 'Menambah Transaksi Baru',
                content: `1. Buka menu **Finance** di sidebar kiri
2. Klik tombol **"+ New Transaction"** di kanan atas
3. Pilih tipe transaksi:
   - 🟢 **Income** — Untuk dana masuk (donasi, grant, dll)
   - 🔴 **Expense** — Untuk dana keluar (pembelian, gaji, dll)
4. Isi jumlah (Amount), deskripsi, dan kategori
5. *Opsional:* Hubungkan ke Donor dan/atau Program
6. Klik **"Record & Hash"**

✅ Transaksi langsung dicatat dan di-hash ke blockchain ledger secara otomatis. Kamu akan melihat hash SHA-256 unik untuk transaksi tersebut.`
            },
            {
                title: 'Memahami Blockchain Hash',
                content: `Setiap transaksi yang dicatat akan mendapat **hash unik** (contoh: a3f8b2c1...). Hash ini adalah "sidik jari digital" dari transaksi tersebut.

**Bagaimana ini menjamin transparansi?**
• Hash dibuat dari data transaksi + hash transaksi sebelumnya
• Kalau ada 1 angka berubah, hash-nya berubah total
• Siapapun bisa verifikasi melalui Public Ledger
• Data tidak bisa dimanipulasi tanpa merusak chain

Ini seperti rantai — kalau 1 mata rantai diubah, semuanya ketahuan.`
            },
            {
                title: 'Melihat Riwayat Transaksi',
                content: `Di halaman Finance, kamu bisa melihat semua transaksi dalam tabel. Setiap baris menampilkan:

• **Type** — Income (hijau) atau Expense (merah)
• **Description** — Keterangan transaksi
• **Amount** — Jumlah dalam USD
• **Category** — Kategori (Grant, Equipment, dll)
• **Program** — Program yang terkait
• **Donor** — Donatur yang terkait
• **Blockchain Hash** — Bukti kriptografis
• **Date** — Tanggal pencatatan`
            },
        ]
    },
    {
        id: 'donors',
        icon: <Users size={20} />,
        title: 'Mengelola Data Donatur',
        color: '#06b6d4',
        steps: [
            {
                title: 'Menambah Donatur Baru',
                content: `1. Buka menu **Donors** di sidebar
2. Klik **"+ Add Donor"**
3. Isi informasi donatur:
   - **Name** (wajib) — Nama donatur atau organisasi
   - **Email** — Alamat email
   - **Country** — Negara asal
   - **Organization** — Nama organisasi (jika ada)
4. Klik **"Add Donor"**

💡 Setelah donatur ditambahkan, kamu bisa menghubungkan mereka ke transaksi income di halaman Finance.`
            },
            {
                title: 'Tracking Kontribusi Donatur',
                content: `Di tabel Donors, kamu bisa melihat:

• **Total Donated** — Jumlah total donasi dari donatur tersebut
• **Transactions** — Berapa kali donatur sudah berkontribusi
• **Since** — Sejak kapan donatur terdaftar

Angka "Total Donated" otomatis ter-update setiap kamu mencatat transaksi income yang terhubung ke donatur tersebut.`
            },
        ]
    },
    {
        id: 'programs',
        icon: <FolderKanban size={20} />,
        title: 'Mengelola Program',
        color: '#8b5cf6',
        steps: [
            {
                title: 'Membuat Program Baru',
                content: `1. Buka menu **Programs** di sidebar
2. Klik **"+ New Program"**
3. Isi informasi program:
   - **Program Name** (wajib) — Contoh: "Clean Water Initiative"
   - **Description** — Deskripsi program
   - **Budget** — Total anggaran dalam USD
   - **Start Date / End Date** — Periode program
4. Klik **"Create Program"**

Setiap program otomatis tracking:
• Berapa budget yang sudah terpakai
• Progress persentase penggunaan budget
• Jumlah transaksi terkait`
            },
            {
                title: 'Monitoring Budget',
                content: `Di halaman Programs, setiap kartu program menampilkan:

• **Budget** — Total anggaran yang dialokasikan
• **Spent** — Total pengeluaran yang sudah dicatat
• **Remaining** — Sisa anggaran
• **Progress Bar** — Visual persentase penggunaan:
   - 🟢 Hijau = < 70% (aman)
   - 🟡 Kuning = 70-90% (perlu diperhatikan)
   - 🔴 Merah = > 90% (hampir habis)

💡 Angka "Spent" otomatis ter-update setiap kamu mencatat expense yang terhubung ke program tersebut.`
            },
        ]
    },
    {
        id: 'transparency',
        icon: <Globe size={20} />,
        title: 'Public Ledger & Verifikasi',
        color: '#f59e0b',
        steps: [
            {
                title: 'Apa Itu Public Ledger?',
                content: `Public Ledger adalah portal transparansi yang bisa diakses **siapa saja tanpa login**. URL: /public

Di sini, donatur, auditor, atau siapapun bisa:
• Melihat semua transaksi keuangan
• Mencari transaksi berdasarkan deskripsi, hash, atau kategori
• Memverifikasi integritas blockchain
• Download semua data dalam format CSV atau JSON

🔒 Ini adalah bukti nyata transparansi organisasi kamu kepada publik.`
            },
            {
                title: 'Cara Verifikasi Transaksi',
                content: `Setiap transaksi bisa diverifikasi secara independen:

1. Buka halaman **Verify Transaction** (/public/verify)
2. Masukkan **Transaction ID** (format UUID)
3. Klik **"Verify"**

Sistem akan menampilkan:
• ✅ Status: Apakah transaksi ada di ledger
• Hash SHA-256 dari transaksi
• Previous Hash (link ke transaksi sebelumnya)
• Detail lengkap: tipe, jumlah, deskripsi, tanggal
• Chain Context: posisi dalam rantai blockchain

📋 Transaction ID bisa didapat dari export data atau dari admin.`
            },
            {
                title: 'Chain Integrity Check',
                content: `Di halaman Verify, bagian bawah menampilkan **Full Chain Integrity Check**.

Ini memverifikasi SELURUH rantai blockchain dari entry pertama sampai terakhir:
• **"Chain Integrity Verified"** = ✅ Semua data utuh, tidak ada yang dimanipulasi
• **"Chain BROKEN at entry X"** = ❌ Ada data yang berubah/corrupt di entry ke-X

Jika chain broken, artinya ada anomali yang perlu diinvestigasi. Dalam keadaan normal, chain selalu intact.`
            },
            {
                title: 'Export Data',
                content: `Publik bisa mendownload semua data transaksi:

• **Export CSV** — Format spreadsheet, bisa dibuka di Excel/Google Sheets
• **Export JSON** — Format data lengkap termasuk status blockchain

File export berisi:
- Semua transaksi dengan detail lengkap
- Hash blockchain untuk setiap transaksi
- Status integritas chain
- Tanggal export

💡 Fitur ini penting untuk audit independen oleh pihak ketiga.`
            },
        ]
    },
    {
        id: 'blockchain',
        icon: <Shield size={20} />,
        title: 'Cara Kerja Blockchain di ChainFund',
        color: '#ef4444',
        steps: [
            {
                title: 'Apa Bedanya dengan Blockchain Biasa?',
                content: `ChainFund menggunakan **hash-chain ledger** — konsep yang sama dengan blockchain, tapi dioptimalkan untuk ERP:

**Sama seperti blockchain:**
• Setiap entry di-hash dengan SHA-256
• Setiap hash terhubung ke hash sebelumnya (chain)
• Data tidak bisa diubah tanpa merusak chain
• Siapapun bisa verifikasi

**Bedanya:**
• Tidak perlu mining/validator (lebih cepat & murah)
• Transaksi langsung confirmed (no waiting)
• Data di-anchor ke Solana testnet sebagai proof tambahan
• User tidak perlu paham crypto — semuanya otomatis

Hasilnya: transparansi setara blockchain, UX semudah ERP biasa.`
            },
            {
                title: 'Alur Data',
                content: `Begini alur setiap transaksi yang kamu catat:

1. **Staff input transaksi** → masuk ke database
2. **Sistem otomatis buat snapshot** → data transaksi di-freeze
3. **SHA-256 hashing** → snapshot + hash sebelumnya = hash baru
4. **Simpan ke ledger** → hash chain bertambah 1 entry
5. **Periodic anchor** → batch hash di-kirim ke Solana blockchain
6. **Publik bisa verifikasi** → via Public Ledger

Seluruh proses ini terjadi dalam **< 1 detik** dan sepenuhnya otomatis.`
            },
        ]
    },
];

function GuideSection({ section, isOpen, onToggle }) {
    return (
        <div className="card animate-in" style={{ marginBottom: 16 }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', padding: '20px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'var(--font-sans)', textAlign: 'left'
                }}
            >
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${section.color}15`, color: section.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    {section.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{section.steps.length} langkah</div>
                </div>
                {isOpen ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {isOpen && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-color)' }}>
                    {section.steps.map((step, i) => (
                        <div key={i} style={{ marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    background: `${section.color}20`, color: section.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
                                }}>
                                    {i + 1}
                                </div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h3>
                            </div>
                            <div style={{
                                fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.8,
                                paddingLeft: 38, whiteSpace: 'pre-line'
                            }}>
                                {step.content.split('\n').map((line, j) => {
                                    // Bold text
                                    const parts = line.split(/\*\*(.*?)\*\*/g);
                                    return (
                                        <div key={j} style={{ marginBottom: line.trim() === '' ? 8 : 2 }}>
                                            {parts.map((part, k) =>
                                                k % 2 === 1
                                                    ? <strong key={k} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part}</strong>
                                                    : <span key={k}>{part}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Guide() {
    const [openSections, setOpenSections] = useState(new Set(['getting-started']));

    const toggleSection = (id) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setOpenSections(new Set(sections.map(s => s.id)));
    const collapseAll = () => setOpenSections(new Set());

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>📖 Panduan Penggunaan</h1>
                    <p>Cara menggunakan ChainFund dari A sampai Z</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={expandAll}>Buka Semua</button>
                    <button className="btn btn-ghost btn-sm" onClick={collapseAll}>Tutup Semua</button>
                </div>
            </div>
            <div className="page-body">
                {/* Quick tips */}
                <div style={{
                    display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap'
                }}>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Lightbulb size={14} style={{ color: '#3b82f6' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6' }}>Quick Tip</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Setiap transaksi otomatis di-hash. Kamu tidak perlu melakukan apa-apa ekstra untuk blockchain — just input data seperti biasa.
                        </p>
                    </div>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>Best Practice</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Selalu hubungkan transaksi ke Program dan Donor agar tracking lebih akurat dan laporan lebih lengkap.
                        </p>
                    </div>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <HelpCircle size={14} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>Penting</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            Data Public Ledger bisa dilihat siapa saja tanpa login. Pastikan deskripsi transaksi sudah benar sebelum submit.
                        </p>
                    </div>
                </div>

                {/* Sections */}
                {sections.map(section => (
                    <GuideSection
                        key={section.id}
                        section={section}
                        isOpen={openSections.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                    />
                ))}
            </div>
        </>
    );
}
