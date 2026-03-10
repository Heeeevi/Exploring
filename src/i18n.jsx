import React, { createContext, useContext, useState, useMemo } from 'react';

const translations = {
  en: {
    siteName: 'ChainFund',
    sidebar: {
      main: 'Main',
      dashboard: 'Dashboard',
      finance: 'Finance',
      donors: 'Donors',
      programs: 'Programs',
      guide: 'Guide',
      transparency: 'Transparency',
      solana: 'Solana Anchor',
      activity: 'Activity Log',
      public: 'Public Ledger',
      verify: 'Verify Transaction',
      signOut: 'Sign Out'
    },
    guide: {
      title: '📖 User Guide',
      subtitle: 'How to use ChainFund from A to Z',
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      quickTip: 'Quick Tip',
      bestPractice: 'Best Practice',
      important: 'Important',
      sections: [
        {
          id: 'getting-started',
          color: '#3b82f6',
          icon: '🚀',
          title: 'Getting Started with ChainFund',
          steps: [
            {
              title: 'Login to the Dashboard',
              content: `Open the login page and enter the email and password provided by the admin. After successful login you will be redirected to the main Dashboard.\n\nDefault account: admin@chainfund.org / admin123\n\nIf you don't have an account, click Register to create one. New accounts get the 'staff' role.`
            },
            {
              title: 'Understanding the Dashboard',
              content: `The Dashboard shows a summary of your organisation's finances:\n\n• Total Income — All recorded incomes\n• Total Expenses — All recorded expenses\n• Net Balance — Income minus Expenses\n• Donors — Number of registered donors\n• Chart — Income vs expense (last 30 days)\n• Blockchain Status — Integrity status of the hash chain`
            }
          ]
        },
        {
          id: 'finance',
          color: '#10b981',
          icon: '💵',
          title: 'Recording Financial Transactions',
          steps: [
            {
              title: 'Add a New Transaction',
              content: `1. Open the Finance menu in the left sidebar\n2. Click the "+ New Transaction" button\n3. Choose type: Income or Expense\n4. Fill amount, description and category\n5. Optionally link a Donor and/or Program\n6. Click "Record & Hash"\n\nThe transaction is recorded and hashed automatically — you will see a SHA-256 hash for the entry.`
            },
            {
              title: 'Blockchain Hash Explained',
              content: `Each recorded transaction receives a unique SHA-256 hash (e.g. a3f8b2c1...). The hash is produced from the transaction snapshot + previous hash.\n\nThis guarantees tamper-evidence: changing any data alters the hash and breaks the chain.`
            }
          ]
        },
        {
          id: 'donors',
          color: '#06b6d4',
          icon: '👥',
          title: 'Managing Donors',
          steps: [
            {
              title: 'Add a Donor',
              content: `1. Open Donors in the sidebar\n2. Click "+ Add Donor"\n3. Fill Name (required), Email, Country, Organization\n4. Click "Add Donor"\n\nAfter adding, you can link donors to income transactions.`
            }
          ]
        },
        {
          id: 'programs',
          color: '#8b5cf6',
          icon: '📁',
          title: 'Managing Programs',
          steps: [
            {
              title: 'Create a Program',
              content: `1. Open Programs in the sidebar\n2. Click "+ New Program"\n3. Fill Program Name, Description, Budget, Start/End dates\n4. Click "Create Program"\n\nPrograms track budget, spent amount and related transactions.`
            }
          ]
        }
      ]
    }
  },
  id: {
    siteName: 'ChainFund',
    sidebar: {
      main: 'Main',
      dashboard: 'Dashboard',
      finance: 'Keuangan',
      donors: 'Donatur',
      programs: 'Program',
      guide: 'Panduan',
      transparency: 'Transparansi',
      solana: 'Solana Anchor',
      activity: 'Activity Log',
      public: 'Public Ledger',
      verify: 'Verify Transaction',
      signOut: 'Keluar'
    },
    guide: {
      title: '📖 Panduan Penggunaan',
      subtitle: 'Cara menggunakan ChainFund dari A sampai Z',
      expandAll: 'Buka Semua',
      collapseAll: 'Tutup Semua',
      quickTip: 'Quick Tip',
      bestPractice: 'Best Practice',
      important: 'Penting',
      sections: [
        {
          id: 'getting-started',
          color: '#3b82f6',
          icon: '🚀',
          title: 'Mulai Menggunakan ChainFund',
          steps: [
            {
              title: 'Login ke Dashboard',
              content: `Buka halaman login dan masukkan email serta password yang sudah diberikan oleh admin. Setelah berhasil login, kamu akan langsung diarahkan ke Dashboard utama.\n\nAkun default: admin@chainfund.org / admin123\n\nKalau belum punya akun, klik "Register" untuk bikin akun baru. Akun baru otomatis mendapat role "staff".`
            },
            {
              title: 'Memahami Dashboard',
              content: `Dashboard menampilkan ringkasan keuangan organisasi kamu:\n\n• Total Income — Semua pemasukan yang sudah dicatat\n• Total Expenses — Semua pengeluaran yang sudah dicatat\n• Net Balance — Selisih income - expense (sisa dana)\n• Donors — Jumlah donatur yang terdaftar\n• Chart — Grafik income vs expense 30 hari terakhir\n• Blockchain Status — Status integritas hash chain`
            }
          ]
        },
        {
          id: 'finance',
          color: '#10b981',
          icon: '💵',
          title: 'Mencatat Transaksi Keuangan',
          steps: [
            {
              title: 'Menambah Transaksi Baru',
              content: `1. Buka menu Finance di sidebar kiri\n2. Klik tombol "+ New Transaction" di kanan atas\n3. Pilih tipe transaksi: Income atau Expense\n4. Isi jumlah (Amount), deskripsi, dan kategori\n5. Opsional: Hubungkan ke Donor dan/atau Program\n6. Klik "Record & Hash"\n\nTransaksi langsung dicatat dan di-hash ke blockchain ledger secara otomatis.`
            },
            {
              title: 'Memahami Blockchain Hash',
              content: `Setiap transaksi yang dicatat akan mendapat hash unik. Hash ini adalah sidik jari digital dari transaksi tersebut.\n\nHash dibuat dari data transaksi + hash transaksi sebelumnya; perubahan pada data akan mengubah hash.`
            }
          ]
        },
        {
          id: 'donors',
          color: '#06b6d4',
          icon: '👥',
          title: 'Mengelola Data Donatur',
          steps: [
            {
              title: 'Menambah Donatur Baru',
              content: `1. Buka menu Donors di sidebar\n2. Klik "+ Add Donor"\n3. Isi informasi donatur: Name (wajib), Email, Country, Organization\n4. Klik "Add Donor"\n\nSetelah donatur ditambahkan, kamu bisa menghubungkan mereka ke transaksi income di halaman Finance.`
            }
          ]
        },
        {
          id: 'programs',
          color: '#8b5cf6',
          icon: '📁',
          title: 'Mengelola Program',
          steps: [
            {
              title: 'Membuat Program Baru',
              content: `1. Buka menu Programs di sidebar\n2. Klik "+ New Program"\n3. Isi Program Name, Description, Budget, Start/End dates\n4. Klik "Create Program"\n\nSetiap program otomatis tracking budget, spent, dan transaksi terkait.`
            }
          ]
        },
        {
          id: 'transparency',
          color: '#f59e0b',
          icon: '🌐',
          title: 'Public Ledger & Verifikasi',
          steps: [
            {
              title: 'Apa Itu Public Ledger?',
              content: `Public Ledger adalah portal transparansi yang bisa diakses siapa saja tanpa login. URL: /public\n\nDi sini, donatur, auditor, atau siapapun bisa melihat semua transaksi, mencari berdasarkan deskripsi atau hash, memverifikasi integritas blockchain, dan men-download data.`
            }
          ]
        },
        {
          id: 'blockchain',
          color: '#ef4444',
          icon: '🔐',
          title: 'Cara Kerja Blockchain di ChainFund',
          steps: [
            {
              title: 'Alur Data',
              content: `1. Staff input transaksi → masuk ke database\n2. Sistem buat snapshot → data transaksi di-freeze\n3. SHA-256 hashing → snapshot + prev hash = hash baru\n4. Simpan ke ledger → chain bertambah 1 entry\n5. Periodic anchor → batch hash dikirim ke Solana\n6. Publik bisa verifikasi via Public Ledger` 
            }
          ]
        }
      ]
    }
  }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('lang') || 'en');

  const value = useMemo(() => ({
    locale,
    setLocale: (l) => {
      localStorage.setItem('lang', l);
      setLocale(l);
    },
    t: (path, fallback) => {
      const keys = path.split('.');
      let cur = translations[locale];
      for (let k of keys) {
        if (!cur) break;
        cur = cur[k];
      }
      return cur ?? fallback ?? path;
    },
    strings: translations[locale]
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export default I18nContext;
