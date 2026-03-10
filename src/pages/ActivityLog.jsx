import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Activity, Filter, ArrowUpRight, ArrowDownRight, Pencil, Trash2, Anchor, UserPlus, FolderPlus, Clock } from 'lucide-react';

const ACTION_ICONS = {
    create: { icon: <ArrowUpRight size={14} />, color: 'var(--accent-green)', label: 'Created' },
    update: { icon: <Pencil size={14} />, color: 'var(--accent-cyan)', label: 'Updated' },
    delete: { icon: <Trash2 size={14} />, color: 'var(--accent-red)', label: 'Deleted' },
    anchor: { icon: <Anchor size={14} />, color: 'var(--accent-purple)', label: 'Anchored' },
};

const ENTITY_LABELS = {
    transaction: '💰 Transaction',
    donor: '👤 Donor',
    program: '📋 Program',
    anchor: '⚓ Solana Anchor',
};

export default function ActivityLog() {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filterEntity, setFilterEntity] = useState('');

    useEffect(() => {
        api.getActivityStats().then(setStats).catch(() => { });
    }, []);

    useEffect(() => {
        setLoading(true);
        api.getActivities(page, 30, filterEntity)
            .then(data => {
                setActivities(data.activities);
                setTotal(data.total);
            })
            .finally(() => setLoading(false));
    }, [page, filterEntity]);

    const totalPages = Math.ceil(total / 30);

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Activity Log</h1>
                    <p>Complete audit trail of all system actions</p>
                </div>
            </div>
            <div className="page-body">
                {/* Stats */}
                {stats && (
                    <div className="stats-grid" style={{ marginBottom: 24 }}>
                        <div className="stat-card animate-in">
                            <div className="stat-label">Today</div>
                            <div className="stat-value accent">{stats.today}</div>
                            <div className="stat-sub">actions</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-label">This Week</div>
                            <div className="stat-value accent">{stats.thisWeek}</div>
                            <div className="stat-sub">actions</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-label">This Month</div>
                            <div className="stat-value accent">{stats.thisMonth}</div>
                            <div className="stat-sub">actions</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-label">Total</div>
                            <div className="stat-value accent">{stats.total}</div>
                            <div className="stat-sub">all time</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                    <button className={`btn btn-sm ${filterEntity === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterEntity(''); setPage(1); }}>All</button>
                    <button className={`btn btn-sm ${filterEntity === 'transaction' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterEntity('transaction'); setPage(1); }}>Transactions</button>
                    <button className={`btn btn-sm ${filterEntity === 'donor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterEntity('donor'); setPage(1); }}>Donors</button>
                    <button className={`btn btn-sm ${filterEntity === 'program' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterEntity('program'); setPage(1); }}>Programs</button>
                    <button className={`btn btn-sm ${filterEntity === 'anchor' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterEntity('anchor'); setPage(1); }}>Anchors</button>
                </div>

                {/* Activity Timeline */}
                <div className="card">
                    <div className="card-header">
                        <h2>
                            <Activity size={18} style={{ marginRight: 8, display: 'inline', verticalAlign: -3 }} />
                            Activity Timeline ({total})
                        </h2>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                        ) : activities.length === 0 ? (
                            <div className="empty-state" style={{ padding: 40 }}>
                                <div className="icon">📝</div>
                                <h3>No activity yet</h3>
                                <p>Actions like creating transactions, editing donors, and anchoring to Solana will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {activities.map((a, i) => {
                                    const actionInfo = ACTION_ICONS[a.action] || ACTION_ICONS.create;
                                    const entityLabel = ENTITY_LABELS[a.entity_type] || a.entity_type;
                                    return (
                                        <div key={a.id} style={{
                                            display: 'flex', gap: 14, padding: '14px 20px',
                                            borderBottom: i < activities.length - 1 ? '1px solid var(--border-color)' : 'none',
                                            alignItems: 'flex-start',
                                        }}>
                                            <div style={{
                                                width: 32, height: 32, borderRadius: 8,
                                                background: `${actionInfo.color}15`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: actionInfo.color, flexShrink: 0, marginTop: 2,
                                            }}>
                                                {actionInfo.icon}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.user_name || 'System'}</span>
                                                    <span style={{
                                                        fontSize: '0.72rem', padding: '1px 8px', borderRadius: 4,
                                                        background: `${actionInfo.color}15`, color: actionInfo.color, fontWeight: 600,
                                                    }}>
                                                        {actionInfo.label}
                                                    </span>
                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{entityLabel}</span>
                                                </div>
                                                {a.details && (
                                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                        {a.details}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Clock size={11} />
                                                {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="pagination" style={{ marginTop: 20 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                        <span className="page-info" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                    </div>
                )}
            </div>
        </>
    );
}
