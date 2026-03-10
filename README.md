# ⛓️ ChainFund

**Blockchain-verified financial transparency for NGOs.**

ChainFund is an open-source ERP system that combines traditional financial management with cryptographic proof and Solana blockchain anchoring — so every dollar donated can be publicly verified.

![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.3-purple?logo=vite)
![Express](https://img.shields.io/badge/Express-4.21-black?logo=express)
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
│                  React SPA (Vite)                │
│  Dashboard · Finance · Donors · Programs · Log   │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│              Express 4.21 Backend                │
│  JWT Auth · CRUD · Hash Chain · Activity Log     │
└──────┬───────────────────────────────┬──────────┘
       │                               │
┌──────▼──────┐              ┌─────────▼─────────┐
│   SQLite    │              │  Solana Devnet     │
│  (WAL mode) │              │  Memo Program      │
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

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone & Install

```bash
git clone https://github.com/Heeeevi/Exploring.git
cd Exploring
npm install
```

### 2. Seed Demo Data (Optional)

```bash
npm run seed
```

This creates 7 donors, 5 programs, and 25 sample transactions with full hash chain.

### 3. Start Development

```bash
npm start
```

This runs both the backend (port 3001) and frontend (port 5173) concurrently.

### 4. Login

Open `http://localhost:5173` and login with:
- **Email:** admin@chainfund.org
- **Password:** admin123

---

## 📁 Project Structure

```
├── index.html              # Vite entry point
├── package.json            # Dependencies & scripts
├── vite.config.js          # Vite config with API proxy
├── netlify.toml            # Netlify deployment config
├── .env.example            # Environment variable template
│
├── server/                 # Express backend
│   ├── index.cjs           # Server entry, route mounting
│   ├── db.cjs              # SQLite init, schema, migrations
│   ├── blockchain.cjs      # SHA-256 hash chain logic
│   ├── seed-demo.cjs       # Demo data seeder
│   ├── data/               # SQLite database files
│   └── routes/
│       ├── auth.cjs        # Login, register, JWT
│       ├── transactions.cjs # CRUD + blockchain hashing
│       ├── donors.cjs      # CRUD + safety checks
│       ├── programs.cjs    # CRUD + status management
│       ├── public.cjs      # Public ledger & verify API
│       └── activity.cjs    # Activity log & stats
│
├── solana/                 # Solana integration
│   ├── anchor-service.cjs  # Merkle Root anchoring via Memo Program
│   └── keypair.json        # Solana wallet (devnet)
│
└── src/                    # React frontend
    ├── App.jsx             # Router & layout
    ├── api.js              # API client
    ├── AuthContext.jsx      # JWT auth context
    ├── index.css           # Design system (dark theme)
    ├── main.jsx            # React entry
    └── pages/
        ├── Dashboard.jsx    # Stats + Solana widget
        ├── DashboardLayout.jsx # Sidebar layout
        ├── Finance.jsx      # Transaction management
        ├── Donors.jsx       # Donor management
        ├── Programs.jsx     # Program management
        ├── ActivityLog.jsx  # Audit trail timeline
        ├── Landing.jsx      # Public landing page
        ├── Login.jsx        # Auth page
        ├── PublicLedger.jsx # Public transaction browser
        ├── Verify.jsx       # Transaction verification
        ├── Guide.jsx        # Admin guide (Indonesian)
        └── HowItWorks.jsx  # Public explainer (Indonesian)
```

---

## 🌐 Deployment

### Frontend → Netlify

1. Push to GitHub
2. Connect repo in [Netlify](https://app.netlify.com)
3. Build settings are auto-detected from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Set environment variable:
   - `VITE_API_URL` = `https://your-backend-url.com/api`
5. Every push to `main` triggers auto-deploy ✅

### Backend → Railway / Render / Fly.io

The Express + SQLite backend needs a persistent server. Recommended options:

#### Railway (easiest)
```bash
# In the repo root:
railway login
railway init
railway up
```
Set `PORT=3001` in Railway dashboard.

#### Render
1. Create a **Web Service** pointing to this repo
2. **Build command:** `npm install`
3. **Start command:** `node server/index.cjs`
4. Add env var `PORT=3001`

#### Fly.io
```bash
fly launch
fly deploy
```

> **Note:** After deploying the backend, copy its URL and set `VITE_API_URL` in Netlify.

---

## 🔐 Security Notes

- Change `JWT_SECRET` in production (set via env var)
- Solana keypair in `solana/keypair.json` is for **devnet only**
- SQLite WAL mode enables concurrent reads
- Passwords hashed with bcrypt (10 rounds)
- CORS configured for cross-origin API access

---

## 📜 API Endpoints

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
| GET | `/api/solana/anchors` | ✅ | List anchors |
| GET | `/api/solana/verify/:sig` | ✅ | Verify Solana TX |
| GET | `/api/solana/wallet` | ✅ | Wallet info |
| GET | `/api/public/stats` | ❌ | Public stats |
| GET | `/api/public/ledger` | ❌ | Public ledger |
| GET | `/api/public/verify/:id` | ❌ | Verify transaction |
| GET | `/api/public/programs` | ❌ | Public programs |
| GET | `/api/public/export` | ❌ | Export (JSON/CSV) |

---

## 🛠️ Scripts

```bash
npm start        # Run backend + frontend concurrently
npm run dev      # Frontend only (Vite dev server)
npm run server   # Backend only (Express)
npm run seed     # Seed demo data
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
