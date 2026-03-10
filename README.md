# ⛓️ ChainFund

**Blockchain-verified financial transparency for NGOs.**

ChainFund is an open-source ERP system that combines traditional financial management with cryptographic proof and Solana blockchain anchoring — so every dollar donated can be publicly verified.

![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-purple?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)
![Netlify](https://img.shields.io/badge/Netlify-Functions-00C7B7?logo=netlify)
![Solana](https://img.shields.io/badge/Solana-Devnet-green?logo=solana)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## ✨ Features

### 📊 ERP Core
- **Dashboard** — Real-time stats, recent transactions, blockchain health
- **Finance** — Record income & expenses, search & filter, edit metadata
- **Donors** — Manage donor profiles, track contributions
- **Programs** — Track NGO programs with status management (active/completed/paused)
- **Activity Log** — Full audit trail of every action with timeline UI

### 🔗 Blockchain Layer
- **SHA-256 Hash Chain** — Every transaction is hashed and linked to the previous one
- **Tamper Detection** — Modifying any record breaks the chain, instantly detectable
- **Public Ledger** — Anyone can browse and verify transactions without login

### ☀️ Solana On-Chain Proof
- **Merkle Root Anchoring** — Periodically anchors batch hashes to Solana devnet
- **Memo Program** — Stores proof as JSON in Solana transaction memo
- **Dual Verification** — Verify by local UUID or Solana transaction signature
- **Explorer Links** — Direct links to Solana Explorer for independent verification

### 🌐 Public Transparency
- **Public Ledger** — Browse all transactions with blockchain proof status
- **Export** — Download ledger as JSON or CSV
- **Verify Page** — Look up any transaction by ID or Solana signature
- **How It Works** — Public explanation page (in Indonesian 🇮🇩)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              React SPA (Vite) — Netlify CDN      │
│  Dashboard · Finance · Donors · Programs · Log   │
└──────────────────────┬──────────────────────────┘
                       │ /api/* → redirects
┌──────────────────────▼──────────────────────────┐
│          Netlify Serverless Functions             │
│  auth · transactions · donors · programs · etc   │
└──────┬───────────────────────────────┬──────────┘
       │                               │
┌──────▼──────┐              ┌─────────▼─────────┐
│  Supabase   │              │  Solana Devnet     │
│  PostgreSQL │              │  Memo Program      │
│  7 tables   │              │  Merkle Root Proof  │
└─────────────┘              └────────────────────┘
```

### Database Tables
| Table | Purpose |
|-------|---------|
| `users` | Admin & staff accounts (JWT auth) |
| `donors` | Donor profiles |
| `programs` | NGO program tracking |
| `transactions` | Income & expense records |
| `ledger_entries` | SHA-256 hash chain (blockchain) |
| `chain_anchors` | Solana anchor records |
| `activity_log` | Audit trail of all actions |

---

## 🚀 Deployment (Netlify + Supabase)

### Prerequisites
- [Supabase](https://supabase.com) account (free tier)
- [Netlify](https://app.netlify.com) account (free tier)
- GitHub repo

### Step 1: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste the contents of `supabase/schema.sql` and **Run**
4. Copy from **Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Deploy to Netlify

1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Select your repo — build settings are auto-detected from `netlify.toml`
4. Add **Environment Variables** in Netlify dashboard:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` |
| `JWT_SECRET` | Any strong random string |
| `SOLANA_KEYPAIR` | `[1,2,3,...]` (JSON array from `solana/keypair.json`) |
| `SOLANA_NETWORK` | `devnet` |

5. Click **Deploy** → Done! 🎉

Every push to `main` auto-deploys.

### Step 3: Login

- **Email:** admin@chainfund.org
- **Password:** admin123

---

## 🛠️ Local Development

The project also includes an Express + SQLite backend for local dev:

```bash
# Install dependencies
npm install

# Seed demo data (optional)
npm run seed

# Start backend (port 3001) + frontend (port 5173)
npm start
```

Open `http://localhost:5173`

---

## 📁 Project Structure

```
├── index.html              # Vite entry point
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite config with API proxy
├── netlify.toml            # Netlify deployment + function routing
├── .env.example            # Environment variable template
│
├── netlify/functions/      # Serverless backend (Netlify Functions)
│   ├── auth.cjs            # Login, register, JWT
│   ├── transactions.cjs    # CRUD + blockchain hashing
│   ├── donors.cjs          # CRUD + safety checks
│   ├── programs.cjs        # CRUD + status management
│   ├── public.cjs          # Public ledger & verify API
│   ├── solana.cjs          # Solana anchoring & verification
│   ├── activity.cjs        # Activity log & stats
│   ├── health.cjs          # Health check
│   └── lib/
│       ├── supabase.cjs    # Supabase client
│       ├── helpers.cjs     # Auth, CORS, response helpers
│       ├── blockchain.cjs  # SHA-256 hash chain (Supabase)
│       └── solana-anchor.cjs # Solana Memo Program service
│
├── supabase/
│   └── schema.sql          # Full database schema + RPC functions + seed
│
├── server/                 # Express backend (local dev only)
│   ├── index.cjs           # Server entry, route mounting
│   ├── db.cjs              # SQLite init, schema
│   ├── blockchain.cjs      # SHA-256 hash chain logic
│   ├── seed-demo.cjs       # Demo data seeder
│   └── routes/             # Express API routes
│
├── solana/                 # Solana integration
│   ├── anchor-service.cjs  # Merkle Root anchoring
│   └── keypair.json        # Wallet keypair (devnet)
│
└── src/                    # React frontend
    ├── App.jsx             # Router & layout
    ├── api.js              # API client
    ├── AuthContext.jsx      # JWT auth context
    ├── index.css           # Design system (dark theme)
    └── pages/              # All page components
```

---

## 📜 API Endpoints

All endpoints are available at `/api/*` and route to Netlify Functions.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| POST | `/api/auth/register` | ❌ | Register new user |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/transactions` | ✅ | List transactions |
| POST | `/api/transactions` | ✅ | Create transaction |
| PUT | `/api/transactions/:id` | ✅ | Edit metadata |
| GET | `/api/donors` | ✅ | List donors |
| POST | `/api/donors` | ✅ | Create donor |
| PUT | `/api/donors/:id` | ✅ | Update donor |
| DELETE | `/api/donors/:id` | ✅ | Delete donor |
| GET | `/api/programs` | ✅ | List programs |
| POST | `/api/programs` | ✅ | Create program |
| PUT | `/api/programs/:id` | ✅ | Update program |
| DELETE | `/api/programs/:id` | ✅ | Delete program |
| GET | `/api/activity` | ✅ | Activity log |
| GET | `/api/activity/stats` | ✅ | Activity statistics |
| POST | `/api/solana/anchor` | ✅ | Anchor to Solana |
| GET | `/api/solana/anchors` | ❌ | List anchors |
| GET | `/api/solana/verify/:sig` | ❌ | Verify Solana TX |
| GET | `/api/solana/wallet` | ✅ | Wallet info |
| GET | `/api/solana/status` | ❌ | Solana status |
| GET | `/api/public/stats` | ❌ | Public stats |
| GET | `/api/public/ledger` | ❌ | Public ledger |
| GET | `/api/public/verify/:id` | ❌ | Verify transaction |
| GET | `/api/public/programs` | ❌ | Public programs |
| GET | `/api/public/export` | ❌ | Export (JSON/CSV) |

---

## 🔐 Security Notes

- Change `JWT_SECRET` in production (set via env var)
- Supabase uses `service_role` key (server-side only, never exposed to client)
- Solana keypair stored as env var in Netlify (not in repo)
- Passwords hashed with bcrypt (10 rounds)
- RLS enabled on all tables

---

## 🛠️ Scripts

```bash
npm start        # Local: backend + frontend concurrently
npm run dev      # Frontend only (Vite dev server)
npm run server   # Backend only (Express)
npm run seed     # Seed demo data (local SQLite)
npm run build    # Production build (Vite)
npm run preview  # Preview production build
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [Heeeevi](https://github.com/Heeeevi)

---

<p align="center">
  <strong>⛓️ ChainFund</strong> — Trust through transparency.
</p>
