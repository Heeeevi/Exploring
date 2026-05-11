import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
    Shield, AlertTriangle, CheckCircle, XCircle, Activity,
    Edit3, TrendingUp, Users, Anchor, Zap, Hash,
    RefreshCw, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';

const ICONS = {
    suspicious_edits: Edit3,
    abnormal_cashflow: TrendingUp,
    donor_mismatch: Users,
    delayed_anchoring: Anchor,
    rapid_fire: Zap,
    round_number_bias: Hash,
};

const SEV_COLORS = {
    ok: { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.15)', text: 'var(--accent-green)', icon: CheckCircle },
    low: { bg: 'rgba(59, 130, 246, 0.06)', border: 'rgba(59, 130, 246, 0.15)', text: 'var(--text-accent)', icon: Activity },
    medium: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', icon: AlertTriangle },
    high: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', text: 'var(--accent-red)', icon: XCircle },
};

function TrustScoreRing({ score, level }) {
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 90 ? 'var(--accent-green)' : score >= 70 ? '#f59e0b' : 'var(--accent-red)';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={70} cy={70} r={radius} fill="none" stroke="var(--border-color)" strokeWidth={8} />
                <circle
                    cx={70} cy={70} r={radius} fill="none" stroke={color} strokeWidth={8}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <text
                    x={70} y={70} textAnchor="middle" dominantBaseline="central"
                    fill={color} fontSize="2rem" fontWeight={800}
                    style={{ transform: 'rotate(90deg)', transformOrigin: '70px 70px' }}
                >
                    {score}
                </text>
            </svg>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {level}
            </div>
        </div>
    );
}

function AnomalyCard({ anomaly }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = ICONS[anomaly.id] || Activity;
    const sev = SEV_COLORS[anomaly.severity] || SEV_COLORS.ok;
    const SevIcon = sev.icon;

    return (
        <div style={{
            background: sev.bg, border: `1px solid ${sev.border}`, borderRadius: 12,
            padding: '16px 20px', transition: 'all 0.2s'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${sev.border}`, flexShrink: 0
                }}>
                    <Icon size={18} style={{ color: sev.text }} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{anomaly.title}</span>
                        <span style={{
                            fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                            background: sev.border, color: sev.text, textTransform: 'uppercase'
                        }}>
                            {anomaly.severity}
                        </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {anomaly.description}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: sev.text }}>{anomaly.count}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>flagged</div>
                    </div>
                    {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
            </div>

            {expanded && (
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${sev.border}` }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                        <strong>Recommendation:</strong> {anomaly.recommendation}
                    </div>
                    {anomaly.details && anomaly.details.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {anomaly.details.map((d, i) => (
                                <div key={i} style={{
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'var(--bg-primary)', fontSize: '0.78rem',
                                    fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                                    lineHeight: 1.5
                                }}>
                                    {Object.entries(d).map(([k, v]) => (
                                        <div key={k}>
                                            <span style={{ color: 'var(--text-muted)' }}>{k.replace(/_/g, ' ')}: </span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                {typeof v === 'number' ? v.toLocaleString() : String(v)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TrustMonitor() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.getAnomalies();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const sevCounts = data ? {
        high: data.anomalies.filter(a => a.severity === 'high').length,
        medium: data.anomalies.filter(a => a.severity === 'medium').length,
        low: data.anomalies.filter(a => a.severity === 'low').length,
        ok: data.anomalies.filter(a => a.severity === 'ok').length,
    } : {};

    return (
        <div className="page-container fade-up" style={{ maxWidth: 900 }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.5rem', fontWeight: 800 }}>
                        <Shield size={24} style={{ color: 'var(--accent-purple)' }} />
                        Trust Monitor
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                        Active anomaly detection — rule-based statistical analysis on your financial data.
                    </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spinning' : ''} /> {loading ? 'Scanning...' : 'Re-scan'}
                </button>
            </div>

            {error && (
                <div style={{ padding: 16, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 10, color: 'var(--accent-red)', fontSize: '0.9rem', marginBottom: 24 }}>
                    {error}
                </div>
            )}

            {loading && !data && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} className="spinning" style={{ marginBottom: 16 }} />
                    <p>Running anomaly detection...</p>
                    <p style={{ fontSize: '0.8rem' }}>Analyzing transactions, edits, anchoring status, and patterns.</p>
                </div>
            )}

            {data && (
                <>
                    {/* Trust Score + Summary */}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
                        <div className="card" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                            <TrustScoreRing score={data.trust_score} level={data.trust_level} />
                        </div>
                        <div style={{ flex: 1, minWidth: 250, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
                                <span style={{ fontSize: '0.85rem', flex: 1 }}>Checks Passed</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-green)' }}>{sevCounts.ok}</span>
                            </div>
                            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-accent)' }} />
                                <span style={{ fontSize: '0.85rem', flex: 1 }}>Low Severity</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-accent)' }}>{sevCounts.low}</span>
                            </div>
                            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                <span style={{ fontSize: '0.85rem', flex: 1 }}>Medium Severity</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f59e0b' }}>{sevCounts.medium}</span>
                            </div>
                            <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
                                <span style={{ fontSize: '0.85rem', flex: 1 }}>High Severity</span>
                                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-red)' }}>{sevCounts.high}</span>
                            </div>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div style={{
                        padding: '14px 18px', borderRadius: 10, marginBottom: 24,
                        background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.12)',
                        fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5
                    }}>
                        <strong style={{ color: 'var(--accent-purple)' }}>How it works:</strong> This monitor runs 6 rule-based statistical checks against your transaction data to detect anomalies — suspicious edits, abnormal cashflow, donor record mismatches, delayed Solana anchoring, rapid-fire entries, and round-number bias. No external AI services are used.
                    </div>

                    {/* Anomaly Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {data.anomalies
                            .sort((a, b) => b.score - a.score)
                            .map(anomaly => (
                                <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                            ))}
                    </div>

                    {/* Timestamp */}
                    <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Last scanned: {new Date(data.computed_at).toLocaleString()} · {data.total_checks} checks performed · {data.note}
                    </div>
                </>
            )}
        </div>
    );
}
