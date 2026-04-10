import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useTheme } from '../useTheme';
import { Search, Shield, Download, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, ExternalLink, HelpCircle, Anchor } from 'lucide-react';
import { Sun, Moon } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function PublicLedger() {
    const [stats, setStats] = useState(null);
    const [ledger, setLedger] = useState({ entries: [], pagination: { page: 1, totalPages: 1, total: 0 } });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [solana, setSolana] = useState(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        api.publicStats().then(setStats);
        api.solanaStatus().then(setSolana).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        api.publicLedger(page, 15, search).then(setLedger).finally(() => setLoading(false));
    }, [page, search]);

    const handleExport = async () => {
        const data = await api.publicExport();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fundnproof-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCSVExport = async () => {
        const data = await api.publicExport();
        const headers = ['ID', 'Type', 'Amount', 'Currency', 'Description', 'Category', 'Status', 'Donor', 'Program', 'Blockchain Hash', 'Date'];
        const rows = data.transactions.map(t => [
            t.id, t.type, t.amount, t.currency, `"${t.description}"`, t.category, t.status, t.donor_name, t.program_name, t.blockchain_hash, t.created_at
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fundnproof-export-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    let searchTimeout;
    const handleSearch = (v) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearch(v);
            setPage(1);
        }, 400);
    };

    return (
        <div className="public-layout">
            <nav className="public-nav">
                <div className="landing-logo">
                    <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" />
                    <span>FundNProof</span>
                    <span className="badge badge-chain" style={{ marginLeft: 8 }}>Public Ledger</span>
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
                    <Link to="/public/how-it-works" className="btn btn-ghost btn-sm">
                        <HelpCircle size={14} /> Cara Kerja
                    </Link>
                    <Link to="/public/verify" className="btn btn-secondary btn-sm">
                        <Shield size={14} /> Verify Transaction
                    </Link>
                    <Link to="/login" className="btn btn-ghost btn-sm">Staff Login</Link>
                </div>
            </nav>

            <div className="public-body">
                <div className="public-hero">
                    <h1>Public Financial Ledger</h1>
                    <p>Asked "Where did my money go?" Verify it here directly with cryptographic proof.</p>
                </div>

                {/* Chain Status */}
                {stats?.chainIntegrity && (
                    <div className={`chain-status ${stats.chainIntegrity.valid ? 'valid' : 'invalid'}`}>
                        <span className="status-dot"></span>
                        <span>
                            Chain Integrity: {stats.chainIntegrity.valid ? 'Verified' : 'Broken'} — {stats.chainIntegrity.totalEntries} entries,
                            {stats.chainIntegrity.valid ? ' all hashes intact' : ` broken at entry ${stats.chainIntegrity.brokenAt}`}
                        </span>
                    </div>
                )}

                {/* Solana Proof Banner */}
                {solana && solana.totalAnchors > 0 && (
                    <div className="public-banner public-banner-purple">
                        <Anchor size={20} className="public-banner-icon" />
                        <div className="public-banner-content">
                            <div className="public-banner-title">
                                On-Chain Proof: {solana.anchoredEntries}/{solana.totalLedgerEntries} entries anchored to Solana
                            </div>
                            <div className="public-banner-subtitle">
                                {solana.totalAnchors} Merkle root(s) permanently recorded on Solana blockchain
                            </div>
                        </div>
                        {solana.lastAnchor?.explorerUrl && (
                            <a href={solana.lastAnchor.explorerUrl} target="_blank" rel="noopener noreferrer"
                                className="btn btn-sm public-banner-action">
                                <ExternalLink size={12} /> Verify on Solana
                            </a>
                        )}
                    </div>
                )}

                {/* Stats */}
                {stats && (
                    <div className="stats-grid" style={{ marginBottom: 32 }}>
                        <div className="stat-card income animate-in">
                            <div className="stat-label">Total Income</div>
                            <div className="stat-value income">{formatUSD(stats.totalIncome)}</div>
                        </div>
                        <div className="stat-card expense animate-in">
                            <div className="stat-label">Total Expenses</div>
                            <div className="stat-value expense">{formatUSD(stats.totalExpense)}</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-label">Net Balance</div>
                            <div className="stat-value accent">{formatUSD(stats.netBalance)}</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-label">Ledger Entries</div>
                            <div className="stat-value accent">{stats.totalEntries}</div>
                            <div className="stat-sub">{stats.programCount} programs, {stats.donorCount} donors</div>
                        </div>
                    </div>
                )}

                {/* Search & Export */}
                <div className="public-toolbar">
                    <div className="search-bar">
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input placeholder="Search transactions, hashes, categories..." onChange={e => handleSearch(e.target.value)} />
                    </div>
                    <div className="public-toolbar-actions">
                        <button className="btn btn-secondary btn-sm" onClick={handleCSVExport}>
                            <Download size={14} /> Export CSV
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
                            <Download size={14} /> Export JSON
                        </button>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Program</th>
                                    <th>Donor</th>
                                    <th>Blockchain Hash</th>
                                    <th>Prev Hash</th>
                                    <th>Timestamp</th>
                                    <th>Verify</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading ledger...</td></tr>
                                ) : ledger.entries.length === 0 ? (
                                    <tr><td colSpan={9}>
                                        <div className="empty-state">
                                            <div className="icon">Ledger</div>
                                            <h3>No entries found</h3>
                                            <p>The ledger is empty or no results match your search.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    ledger.entries.map(entry => (
                                        <tr key={entry.id}>
                                            <td>
                                                <span className={`badge badge-${entry.type}`}>
                                                    {entry.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {entry.type}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</td>
                                            <td style={{ fontWeight: 700, color: entry.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                {entry.type === 'income' ? '+' : '-'}{formatUSD(entry.amount)}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{entry.program_name || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{entry.donor_name || '—'}</td>
                                            <td>
                                                <div className="hash-display" title={entry.hash}>
                                                    {entry.hash.slice(0, 16)}...
                                                </div>
                                            </td>
                                            <td>
                                                <div className="hash-display" title={entry.prev_hash} style={{ fontSize: '0.65rem', opacity: 0.7 }}>
                                                    {entry.prev_hash.slice(0, 12)}...
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td>
                                                <Link to={`/public/verify/${entry.tx_id}`} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
                                                    <ExternalLink size={12} />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {ledger.pagination.totalPages > 1 && (
                    <div className="pagination">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <span className="page-info">Page {page} of {ledger.pagination.totalPages} ({ledger.pagination.total} entries)</span>
                        <button onClick={() => setPage(p => Math.min(ledger.pagination.totalPages, p + 1))} disabled={page === ledger.pagination.totalPages}>
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
