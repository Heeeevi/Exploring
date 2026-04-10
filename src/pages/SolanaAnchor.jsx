import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { Anchor, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Loader, Wallet, Globe, Hash, Clock, ArrowRight } from 'lucide-react';

function truncate(str, len = 20) {
    if (!str) return '—';
    return str.length > len ? str.slice(0, len) + '...' : str;
}

export default function SolanaAnchor() {
    const [status, setStatus] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [anchoring, setAnchoring] = useState(false);
    const [verifying, setVerifying] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [s, w] = await Promise.all([
                api.solanaStatus(),
                api.solanaWallet().catch(() => null),
            ]);
            setStatus(s);
            setWallet(w);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAnchor = async () => {
        setAnchoring(true);
        setMessage(null);
        try {
            const result = await api.solanaAnchor();
            if (result.success) {
                setMessage({ type: 'success', text: `Anchored to Solana. Tx: ${result.signature?.slice(0, 24)}...` });
            } else if (result.message) {
                setMessage({ type: 'info', text: result.message });
            }
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setAnchoring(false);
        }
    };

    const handleVerify = async (signature) => {
        setVerifying(signature);
        setVerifyResult(null);
        try {
            const result = await api.solanaVerify(signature);
            setVerifyResult(result);
        } catch (err) {
            setVerifyResult({ error: err.message });
        } finally {
            setVerifying(null);
        }
    };

    if (loading) return <div className="page-body"><p style={{ color: 'var(--text-muted)' }}>Loading Solana status...</p></div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Anchor size={26} style={{ color: 'var(--accent-purple)' }} />
                        Solana Anchor
                    </h1>
                    <p>Anchor your local blockchain data to Solana for tamper-proof public verification</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {status?.unanchoredEntries === 0 && !anchoring && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>All entries anchored</span>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleAnchor}
                        disabled={anchoring || (status?.unanchoredEntries === 0)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: status?.unanchoredEntries === 0 ? 0.5 : 1 }}
                        title={status?.unanchoredEntries === 0 ? 'All entries already anchored. Add a new transaction first.' : `Anchor ${status?.unanchoredEntries} entries ke Solana`}
                    >
                        {anchoring ? <Loader size={16} className="spin" /> : <Anchor size={16} />}
                        {anchoring ? 'Anchoring...' : status?.unanchoredEntries === 0 ? 'All Synced' : `Anchor ${status?.unanchoredEntries} Entries`}
                    </button>
                </div>
            </div>

            <div className="page-body">
                {message && (
                    <div className={`alert ${message.type}`} style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        marginBottom: 20,
                        fontSize: '0.9rem',
                        background: message.type === 'success' ? 'rgba(16,185,129,0.1)'
                            : message.type === 'error' ? 'rgba(239,68,68,0.1)'
                                : 'rgba(96,165,250,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'var(--accent-green)'
                            : message.type === 'error' ? 'var(--accent-red)'
                                : 'var(--accent-cyan)'}`,
                        color: message.type === 'success' ? 'var(--accent-green)'
                            : message.type === 'error' ? 'var(--accent-red)'
                                : 'var(--accent-cyan)',
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Stats Row */}
                <div className="stats-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Hash size={16} style={{ color: 'var(--accent-purple)' }} />
                            <span className="stat-label" style={{ marginBottom: 0 }}>Total Anchors</span>
                        </div>
                        <div className="stat-value accent">{status?.totalAnchors || 0}</div>
                        <div className="stat-sub">on-chain proofs</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                            <span className="stat-label" style={{ marginBottom: 0 }}>Anchored Entries</span>
                        </div>
                        <div className="stat-value income">{status?.anchoredEntries || 0}</div>
                        <div className="stat-sub">of {status?.totalLedgerEntries || 0} total</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Clock size={16} style={{ color: 'var(--accent-yellow)' }} />
                            <span className="stat-label" style={{ marginBottom: 0 }}>Pending</span>
                        </div>
                        <div className="stat-value" style={{ color: status?.unanchoredEntries > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)' }}>
                            {status?.unanchoredEntries || 0}
                        </div>
                        <div className="stat-sub">entries awaiting anchor</div>
                    </div>
                    <div className="stat-card animate-in">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Wallet size={16} style={{ color: 'var(--accent-cyan)' }} />
                            <span className="stat-label" style={{ marginBottom: 0 }}>Wallet</span>
                        </div>
                        <div className="stat-value accent" style={{ fontSize: '1.4rem' }}>
                            {wallet ? `${wallet.balance} SOL` : 'Not connected'}
                        </div>
                        <div className="stat-sub">{wallet?.network || 'devnet'}</div>
                    </div>
                </div>

                {/* Wallet Info Card */}
                {wallet && (
                    <div className="card animate-in" style={{ marginBottom: 24 }}>
                        <div className="card-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Wallet size={18} style={{ color: 'var(--accent-cyan)' }} />
                                Solana Wallet
                            </h2>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Public Key</span>
                                    <span className="hash-display" style={{ maxWidth: 420, fontSize: '0.8rem' }}>{wallet.publicKey}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Network</span>
                                    <span style={{ fontWeight: 600 }}>{wallet.network}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Balance</span>
                                    <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{wallet.balance} SOL</span>
                                </div>
                                <div style={{ marginTop: 4 }}>
                                    <a
                                        href={`https://explorer.solana.com/address/${wallet.publicKey}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: 'var(--accent-cyan)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        <Globe size={14} /> View on Solana Explorer <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Last Anchor */}
                {status?.lastAnchor && (
                    <div className="card animate-in" style={{ marginBottom: 24, border: '1px solid var(--accent-purple)', borderColor: 'rgba(168,85,247,0.3)' }}>
                        <div className="card-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Anchor size={18} style={{ color: 'var(--accent-purple)' }} />
                                Latest Anchor
                            </h2>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Merkle Root</span>
                                    <span className="hash-display" style={{ maxWidth: 420, fontSize: '0.8rem' }}>{status.lastAnchor.merkleRoot}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Solana Signature</span>
                                    <span className="hash-display" style={{ maxWidth: 420, fontSize: '0.8rem' }}>{status.lastAnchor.signature}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Entries Anchored</span>
                                    <span style={{ fontWeight: 600 }}>{status.lastAnchor.entryCount} entries (block {status.lastAnchor.blockRange})</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Network</span>
                                    <span style={{ fontWeight: 600 }}>{status.lastAnchor.network}</span>
                                </div>
                                {status.lastAnchor.explorerUrl && (
                                    <a
                                        href={status.lastAnchor.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 8, width: 'fit-content' }}
                                    >
                                        <ExternalLink size={14} /> View on Solana Explorer
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Anchor History */}
                <div className="card animate-in">
                    <div className="card-header">
                        <h2>Anchor History</h2>
                        <button className="btn btn-secondary" onClick={fetchData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.85rem' }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                    <div className="card-body">
                        {status?.anchors && status.anchors.length > 0 ? (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Merkle Root</th>
                                            <th>Solana TX</th>
                                            <th>Entries</th>
                                            <th>Block Range</th>
                                            <th>Network</th>
                                            <th>Timestamp</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {status.anchors.map((a, i) => (
                                            <tr key={a.id}>
                                                <td>{a.id}</td>
                                                <td><code style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>{a.merkleRoot}</code></td>
                                                <td><code style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{a.signature || '—'}</code></td>
                                                <td>{a.entryCount}</td>
                                                <td>{a.blockRange}</td>
                                                <td><span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-purple)' }}>{a.network}</span></td>
                                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.timestamp}</td>
                                                <td>
                                                    {a.signature && !a.signature.includes('...') && (
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                                            onClick={() => handleVerify(a.signature)}
                                                            disabled={verifying === a.signature}
                                                        >
                                                            {verifying === a.signature ? <Loader size={12} className="spin" /> : <CheckCircle size={12} />}
                                                            &nbsp;Verify
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <Anchor size={48} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
                                <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>No Anchors Yet</h3>
                                <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
                                    Click <strong>"Anchor Now"</strong> to anchor your current ledger data to Solana blockchain.
                                    This creates a tamper-proof, publicly verifiable proof of your financial records.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Verify Result Modal */}
                {verifyResult && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }} onClick={() => setVerifyResult(null)}>
                        <div className="card" style={{ maxWidth: 560, width: '90%' }} onClick={e => e.stopPropagation()}>
                            <div className="card-header">
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {verifyResult.error ? <AlertCircle size={18} style={{ color: 'var(--accent-red)' }} /> : <CheckCircle size={18} style={{ color: 'var(--accent-green)' }} />}
                                    Verification Result
                                </h2>
                            </div>
                            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflow: 'auto' }}>
                                {verifyResult.error ? (
                                    <p style={{ color: 'var(--accent-red)' }}>{verifyResult.error}</p>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>On-chain</span>
                                            <span style={{ color: verifyResult.verified ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                                                {verifyResult.verified ? '✓ Found on Solana' : '✗ Not found'}
                                            </span>
                                        </div>
                                        {verifyResult.memoData && (
                                            <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, fontSize: '0.8rem' }}>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                                                    {JSON.stringify(verifyResult.memoData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {verifyResult.localVerification && (
                                            <>
                                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 4 }}>
                                                    <strong style={{ fontSize: '0.85rem' }}>Local Verification</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Merkle Root Match</span>
                                                    <span style={{ color: verifyResult.localVerification.merkleRootMatch ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
                                                        {verifyResult.localVerification.merkleRootMatch ? '✓ Matches' : '✗ Mismatch — DATA TAMPERED'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Entry Count</span>
                                                    <span>{verifyResult.localVerification.entryCount}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>Block Range</span>
                                                    <span>{verifyResult.localVerification.blockRange}</span>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                                <button className="btn btn-secondary" onClick={() => setVerifyResult(null)} style={{ marginTop: 8 }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* How It Works */}
                <div className="card animate-in" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <h2>How Solana Anchoring Works</h2>
                    </div>
                    <div className="card-body">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', padding: '12px 0' }}>
                            {[
                                { icon: 'Record', title: 'Record Transactions', desc: 'Each transaction gets a SHA-256 hash linked to the previous' },
                                { icon: 'Merkle', title: 'Compute Merkle Root', desc: 'All hashes are combined into a single cryptographic root' },
                                { icon: 'Anchor', title: 'Send to Solana', desc: 'Merkle root is stored as a Memo on Solana devnet' },
                                { icon: 'Verify', title: 'Anyone Can Verify', desc: 'Re-compute locally and compare with on-chain data' },
                            ].map((step, i) => (
                                <React.Fragment key={i}>
                                    <div style={{ textAlign: 'center', flex: '1 1 140px', maxWidth: 180 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, color: 'var(--text-secondary)' }}>{step.icon}</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>{step.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{step.desc}</div>
                                    </div>
                                    {i < 3 && <div style={{ display: 'flex', alignItems: 'center' }}><ArrowRight size={20} style={{ color: 'var(--text-muted)', opacity: 0.5 }} /></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
