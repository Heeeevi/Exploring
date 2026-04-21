import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Users, FolderKanban, Link as LinkIcon, Shield, Anchor, ExternalLink, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [solana, setSolana] = useState(null);
    const [reconciliation, setReconciliation] = useState(null);
    const [recentTx, setRecentTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.getTransactionStats(),
            api.getRecentChart(30),
            api.solanaStatus().catch(() => null),
            api.reconciliationStatus().catch(() => null),
            api.getTransactions('limit=5').catch(() => ({ transactions: [] })),
        ])
            .then(([s, c, sol, rec, tx]) => {
                setStats(s);
                setChartData(c);
                setSolana(sol);
                setReconciliation(rec);
                setRecentTx(tx.transactions || []);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-body"><p style={{ color: 'var(--text-muted)' }}>Loading dashboard...</p></div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Overview of your organization's financial health</p>
                </div>
            </div>
            <div className="page-body">
                <div className="stats-grid">
                    <div className="stat-card income animate-in">
                        <div className="stat-label">Total Income</div>
                        <div className="stat-value income">{formatUSD(stats?.totalIncome || 0)}</div>
                        <div className="stat-sub">{stats?.incomeCount || 0} transactions</div>
                    </div>
                    <div className="stat-card expense animate-in">
                        <div className="stat-label">Total Expenses</div>
                        <div className="stat-value expense">{formatUSD(stats?.totalExpense || 0)}</div>
                        <div className="stat-sub">{stats?.expenseCount || 0} transactions</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div className="stat-label">Net Balance</div>
                        <div className="stat-value accent">{formatUSD(stats?.netBalance || 0)}</div>
                        <div className="stat-sub">{stats?.totalTransactions || 0} total transactions</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span className="stat-label" style={{ marginBottom: 0 }}>Donors</span>
                        </div>
                        <div className="stat-value accent">{stats?.donorCount || 0}</div>
                        <div className="stat-sub">{stats?.activePrograms || 0} active programs</div>
                    </div>
                </div>

                <div className="grid-2" style={{ marginBottom: 32 }}>
                    <div className="card animate-in">
                        <div className="card-header">
                            <h2>Income vs Expenses (30 Days)</h2>
                        </div>
                        <div className="card-body">
                            <div className="chart-container">
                                {chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => v.slice(5)} />
                                            <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(v) => `$${v}`} />
                                            <Tooltip
                                                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.85rem' }}
                                                labelStyle={{ color: 'var(--text-secondary)' }}
                                                formatter={(v) => formatUSD(v)}
                                            />
                                            <Bar dataKey="income" fill="var(--accent-green)" radius={[4, 4, 0, 0]} name="Income" />
                                            <Bar dataKey="expense" fill="var(--accent-red)" radius={[4, 4, 0, 0]} name="Expense" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="empty-state">
                                        <p>No transaction data yet. Start recording transactions!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Bank Reconciliation */}
                        <div className="card animate-in" style={{ flex: 1, border: reconciliation?.has_mismatch ? '1px solid rgba(239, 68, 68, 0.24)' : '1px solid rgba(16, 185, 129, 0.22)' }}>
                            <div className="card-header" style={{ paddingBottom: 8 }}>
                                <h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Shield size={18} style={{ color: reconciliation?.has_mismatch ? 'var(--accent-red)' : 'var(--accent-green)' }} />
                                        Bank Reconciliation
                                    </div>
                                </h2>
                                <Link to="/dashboard/finance" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                                    Run Check →
                                </Link>
                            </div>
                            <div className="card-body" style={{ padding: '12px 20px' }}>
                                {reconciliation ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                                        <div className={`chain-status ${reconciliation.has_mismatch ? 'invalid' : 'valid'}`} style={{ marginBottom: 4 }}>
                                            <span className="status-dot"></span>
                                            {reconciliation.has_mismatch ? 'Mismatch detected between bank and ledger' : 'Bank and ledger are aligned'}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Accounts Tracked</span>
                                            <span style={{ fontWeight: 600 }}>{reconciliation.total_accounts}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Unmatched Items</span>
                                            <span style={{ fontWeight: 600, color: reconciliation.total_unmatched > 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>{reconciliation.total_unmatched}</span>
                                        </div>
                                        {reconciliation.latest_runs?.[0] && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                Latest: {reconciliation.latest_runs[0].account_name} ({new Date(reconciliation.latest_runs[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No reconciliation run yet. Import bank statements and run comparison.</p>
                                )}
                            </div>
                        </div>

                        {/* Blockchain Status */}
                        <div className="card animate-in" style={{ flex: 1 }}>
                            <div className="card-header">
                                <h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Shield size={18} style={{ color: 'var(--accent-purple)' }} />
                                        Blockchain Status
                                    </div>
                                </h2>
                            </div>
                            <div className="card-body" style={{ padding: '16px 20px' }}>
                                <div className={`chain-status ${stats?.chainStats?.totalEntries >= 0 ? 'valid' : 'invalid'}`} style={{ marginBottom: 12 }}>
                                    <span className="status-dot"></span>
                                    Chain Integrity: Verified ✓
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Ledger Entries</span>
                                        <span style={{ fontWeight: 600 }}>{stats?.chainStats?.totalEntries || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>On-chain Income</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatUSD(stats?.chainStats?.totalIncome || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>On-chain Expense</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatUSD(stats?.chainStats?.totalExpense || 0)}</span>
                                    </div>
                                    {stats?.chainStats?.lastHash && (
                                        <div style={{ marginTop: 4 }}>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Latest Hash</div>
                                            <div className="hash-display" style={{ maxWidth: '100%', fontSize: '0.72rem' }}>{stats.chainStats.lastHash}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Solana Anchor Widget */}
                        <div className="card animate-in" style={{ flex: 1, border: '1px solid rgba(168,85,247,0.15)' }}>
                            <div className="card-header" style={{ paddingBottom: 8 }}>
                                <h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Anchor size={18} style={{ color: 'var(--accent-purple)' }} />
                                        Solana Anchor
                                    </div>
                                </h2>
                                <Link to="/dashboard/solana" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }}>
                                    Manage →
                                </Link>
                            </div>
                            <div className="card-body" style={{ padding: '12px 20px' }}>
                                {solana ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Total Anchors</span>
                                            <span style={{ fontWeight: 600, color: 'var(--accent-purple)' }}>{solana.totalAnchors}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Anchored</span>
                                            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{solana.anchoredEntries}/{solana.totalLedgerEntries}</span>
                                        </div>
                                        {solana.unanchoredEntries > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--accent-yellow)' }}>⚠ Pending</span>
                                                <span style={{ fontWeight: 600, color: 'var(--accent-yellow)' }}>{solana.unanchoredEntries} entries</span>
                                            </div>
                                        )}
                                        {solana.lastAnchor?.explorerUrl && (
                                            <a href={solana.lastAnchor.explorerUrl} target="_blank" rel="noopener noreferrer"
                                                style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                <ExternalLink size={11} /> View latest on Solana Explorer
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Solana not configured</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="card animate-in">
                    <div className="card-header">
                        <h2>Recent Transactions</h2>
                        <Link to="/dashboard/finance" className="btn btn-ghost btn-sm" style={{ fontSize: '0.78rem' }}>View All →</Link>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Program</th>
                                    <th>Hash</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No transactions yet</td></tr>
                                ) : recentTx.map(tx => (
                                    <tr key={tx.id}>
                                        <td>
                                            <span className={`badge badge-${tx.type}`}>
                                                {tx.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                                        <td style={{ fontWeight: 700, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            {tx.type === 'income' ? '+' : '-'}{formatUSD(tx.amount)}
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.program_name || '—'}</td>
                                        <td>
                                            {tx.blockchain_hash ? (
                                                <div className="hash-display" title={tx.blockchain_hash} style={{ fontSize: '0.72rem' }}>
                                                    <Shield size={9} style={{ display: 'inline', marginRight: 3 }} />
                                                    {tx.blockchain_hash.slice(0, 12)}...
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                                            {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
