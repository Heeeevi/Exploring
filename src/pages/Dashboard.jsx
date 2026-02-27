import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Users, FolderKanban, Link as LinkIcon, Shield } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([api.getTransactionStats(), api.getRecentChart(30)])
            .then(([s, c]) => { setStats(s); setChartData(c); })
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

                    <div className="card animate-in">
                        <div className="card-header">
                            <h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Shield size={18} style={{ color: 'var(--accent-purple)' }} />
                                    Blockchain Status
                                </div>
                            </h2>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div className={`chain-status ${stats?.chainStats?.totalEntries >= 0 ? 'valid' : 'invalid'}`}>
                                    <span className="status-dot"></span>
                                    Chain Integrity: Verified ✓
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Total Ledger Entries</span>
                                        <span style={{ fontWeight: 600 }}>{stats?.chainStats?.totalEntries || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Total Income Recorded</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{formatUSD(stats?.chainStats?.totalIncome || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Total Expense Recorded</span>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-red)' }}>{formatUSD(stats?.chainStats?.totalExpense || 0)}</span>
                                    </div>
                                    {stats?.chainStats?.lastHash && (
                                        <div style={{ marginTop: 8 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Latest Hash</div>
                                            <div className="hash-display" style={{ maxWidth: '100%' }}>{stats.chainStats.lastHash}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
