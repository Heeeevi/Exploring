import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Shield, Search, CheckCircle, XCircle, Link as LinkIcon, ArrowLeft } from 'lucide-react';

export default function Verify() {
    const { txId: urlTxId } = useParams();
    const [txId, setTxId] = useState(urlTxId || '');
    const [result, setResult] = useState(null);
    const [chainResult, setChainResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chainLoading, setChainLoading] = useState(false);

    useEffect(() => {
        // Auto-verify if txId in URL
        if (urlTxId) {
            setTxId(urlTxId);
            handleVerify(urlTxId);
        }
        // Also verify chain on load
        setChainLoading(true);
        api.publicVerifyChain().then(setChainResult).finally(() => setChainLoading(false));
    }, [urlTxId]);

    const handleVerify = async (id) => {
        const verifyId = id || txId;
        if (!verifyId.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const data = await api.publicVerifyTx(verifyId.trim());
            setResult(data);
        } catch (err) {
            setResult({ found: false, message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="public-layout">
            <nav className="public-nav">
                <div className="landing-logo">
                    <div className="logo-icon">🔗</div>
                    <span>TransparentERP</span>
                    <span className="badge badge-chain" style={{ marginLeft: 8 }}>Verification</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/public" className="btn btn-secondary btn-sm">
                        <ArrowLeft size={14} /> Back to Ledger
                    </Link>
                </div>
            </nav>

            <div className="public-body">
                <div className="verify-box animate-in">
                    <Shield size={48} style={{ color: 'var(--accent-purple)', marginBottom: 16 }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Verify a Transaction</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Enter a transaction ID to independently verify its existence and integrity in the immutable ledger.
                    </p>

                    <div className="verify-input-group">
                        <input
                            className="form-input"
                            value={txId}
                            onChange={e => setTxId(e.target.value)}
                            placeholder="Enter transaction ID (UUID)"
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                        />
                        <button className="btn btn-primary" onClick={() => handleVerify()} disabled={loading}>
                            {loading ? 'Verifying...' : <><Search size={16} /> Verify</>}
                        </button>
                    </div>

                    {result && (
                        <div className="verify-result" style={{ marginTop: 32 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                                padding: '14px 20px', borderRadius: 10,
                                background: result.found ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: `1px solid ${result.found ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                            }}>
                                {result.found ? (
                                    <>
                                        <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />
                                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                                            ✓ Transaction Found & Verified in Ledger
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={20} style={{ color: 'var(--accent-red)' }} />
                                        <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>
                                            ✗ Transaction Not Found
                                        </span>
                                    </>
                                )}
                            </div>

                            {result.found && (
                                <>
                                    <div className="result-item">
                                        <span className="result-label">Transaction ID</span>
                                        <span className="result-value">{result.dataSnapshot?.txId}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Type</span>
                                        <span className="result-value">
                                            <span className={`badge badge-${result.dataSnapshot?.type}`}>{result.dataSnapshot?.type}</span>
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Amount</span>
                                        <span className="result-value" style={{ fontWeight: 700, color: result.dataSnapshot?.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            ${result.dataSnapshot?.amount?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Description</span>
                                        <span className="result-value" style={{ fontFamily: 'var(--font-sans)' }}>{result.dataSnapshot?.description}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">Recorded At</span>
                                        <span className="result-value" style={{ fontFamily: 'var(--font-sans)' }}>
                                            {new Date(result.timestamp).toLocaleString()}
                                        </span>
                                    </div>

                                    <div style={{ marginTop: 20, padding: 16, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <LinkIcon size={14} /> Cryptographic Proof
                                        </h4>
                                        <div className="result-item">
                                            <span className="result-label">Hash (SHA-256)</span>
                                            <span className="result-value" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{result.hash}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Previous Hash</span>
                                            <span className="result-value">{result.prevHash}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Chain Link</span>
                                            <span className="result-value" style={{ fontFamily: 'var(--font-sans)' }}>
                                                {result.chainContext?.isGenesisLinked ? '🏁 Genesis Block' : '🔗 Linked to previous'}
                                                {result.chainContext?.hasNext ? ' → Has successor' : ' ← Chain tip'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Chain Integrity */}
                <div className="card animate-in" style={{ maxWidth: 700, margin: '32px auto' }}>
                    <div className="card-header">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Shield size={18} />
                            Full Chain Integrity Check
                        </h2>
                    </div>
                    <div className="card-body">
                        {chainLoading ? (
                            <p style={{ color: 'var(--text-muted)' }}>Verifying chain integrity...</p>
                        ) : chainResult ? (
                            <div>
                                <div className={`chain-status ${chainResult.valid ? 'valid' : 'invalid'}`} style={{ marginBottom: 16 }}>
                                    <span className="status-dot"></span>
                                    {chainResult.valid ? '✓ Chain Integrity Verified — All hashes match' : `✗ Chain BROKEN at entry ${chainResult.brokenAt}`}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <p><strong>Total Entries:</strong> {chainResult.totalEntries}</p>
                                    {chainResult.firstHash && <p style={{ marginTop: 8 }}><strong>First Hash:</strong> <span className="hash-display">{chainResult.firstHash}</span></p>}
                                    {chainResult.lastHash && <p style={{ marginTop: 8 }}><strong>Last Hash:</strong> <span className="hash-display">{chainResult.lastHash}</span></p>}
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)' }}>Unable to verify chain</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
