# TransparentERP

Blockchain-backed ERP system providing verifiable financial transparency for NGOs and nonprofit organizations. Every transaction is immutably recorded and publicly verifiable.

## What This App Does

TransparentERP helps NGOs manage their finances while giving donors and auditors cryptographic proof that funds are being used as reported. It combines traditional ERP capabilities with a blockchain-inspired immutable ledger.

### Core Features

- **Financial Management** — Record income and expense transactions with categories, donor links, and program allocation.
- **Donor Tracking** — Manage donor profiles, track contributions, and maintain relationship history.
- **Program Management** — Create and monitor programs with budgets, track spending against allocations, and view utilization.
- **Immutable Ledger** — Every transaction is hashed (SHA-256) and chain-linked to the previous entry, creating a tamper-evident audit trail.
- **Public Transparency Portal** — A public-facing ledger page (no login required) where anyone can browse all transactions, search entries, and export data.
- **Transaction Verification** — Anyone can verify a specific transaction's existence and integrity using its ID, and check the full chain's integrity.
- **Dashboard & Charts** — Overview of income vs. expenses over time, net balance, donor counts, and blockchain chain status.

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 19, React Router, Recharts, Vite  |
| Backend  | Node.js, Express 5                      |
| Database | SQLite (better-sqlite3)                 |
| Auth     | JWT + bcrypt                            |
| Icons    | Lucide React                            |

## Getting Started

```bash
# Install dependencies
npm install

# Start both the backend server and frontend dev server
npm start
```

This runs:
- **Backend API** on `http://localhost:3001`
- **Frontend** on `http://localhost:5173`

### Default Admin Credentials

> **⚠️ Change these immediately in any non-development environment.**

| Email                        | Password  |
| ---------------------------- | --------- |
| admin@transparenterp.org     | admin123  |

## Project Structure

```
├── src/                    # React frontend
│   ├── App.jsx             # Routes and app shell
│   ├── AuthContext.jsx      # Authentication state
│   ├── api.js              # API client
│   └── pages/              # Page components
│       ├── Landing.jsx     # Public homepage
│       ├── Login.jsx       # Login / register
│       ├── DashboardLayout.jsx
│       ├── Dashboard.jsx   # Financial overview
│       ├── Finance.jsx     # Transaction management
│       ├── Donors.jsx      # Donor management
│       ├── Programs.jsx    # Program tracking
│       ├── PublicLedger.jsx # Public transparency portal
│       └── Verify.jsx      # Transaction verification
├── server/                 # Express backend
│   ├── index.cjs           # Server entry point
│   ├── db.cjs              # SQLite setup and schema
│   ├── blockchain.cjs      # Blockchain ledger layer
│   └── routes/             # API route handlers
│       ├── auth.cjs        # Authentication
│       ├── transactions.cjs
│       ├── donors.cjs
│       ├── programs.cjs
│       └── public.cjs      # Public (no-auth) endpoints
└── package.json
```

## API Endpoints

### Authenticated (require JWT)

| Method | Path                        | Description               |
| ------ | --------------------------- | ------------------------- |
| POST   | `/api/auth/login`           | Log in                    |
| POST   | `/api/auth/register`        | Register a new user       |
| GET    | `/api/auth/me`              | Get current user profile  |
| GET    | `/api/transactions`         | List transactions         |
| POST   | `/api/transactions`         | Create a transaction      |
| GET    | `/api/transactions/stats`   | Financial statistics      |
| GET    | `/api/donors`               | List donors               |
| POST   | `/api/donors`               | Create a donor            |
| GET    | `/api/programs`             | List programs             |
| POST   | `/api/programs`             | Create a program          |

### Public (no auth required)

| Method | Path                        | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| GET    | `/api/public/stats`         | Public financial statistics        |
| GET    | `/api/public/ledger`        | Browse the immutable ledger        |
| GET    | `/api/public/verify/chain`  | Verify full chain integrity        |
| GET    | `/api/public/verify/:txId`  | Verify a single transaction        |
| GET    | `/api/public/programs`      | View public program information    |
| GET    | `/api/public/export`        | Export ledger data                 |
| GET    | `/api/health`               | Health check                       |
