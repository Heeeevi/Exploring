import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Shield, Search, CheckCircle, XCircle, Link as LinkIcon, ArrowLeft, ExternalLink, Anchor } from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../useTheme';

// Detect if input looks like a Solana signature (base58, 43+ chars, no dashes like UUIDs)
function isSolanaSignature(str) {
    // UUIDs have dashes, Solana sigs don't. Solana sigs are 86-88 base58 chars.
    // Also detect partial/truncated sigs (>40 base58 chars, no dashes)
    if (str.includes('-')) return false;
    return /^[1-9A-HJ-NP-Za-km-z]{43,}$/.test(str);
}

export default function Verify() {
    const { txId: urlTxId } = useParams();
    const [txId, setTxId] = useState(urlTxId || '');
    const [result, setResult] = useState(null);
    const [solanaResult, setSolanaResult] = useState(null);
    const [chainResult, setChainResult] = useState(null);
    const [anchorStatus, setAnchorStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chainLoading, setChainLoading] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        if (urlTxId) {
            setTxId(urlTxId);
            handleVerify(urlTxId);
        }
        setChainLoading(true);
        Promise.all([
            api.publicVerifyChain(),
            api.solanaStatus().catch(() => null),
        ]).then(([chain, sol]) => {
            setChainResult(chain);
            setAnchorStatus(sol);
        }).finally(() => setChainLoading(false));
    }, [urlTxId]);

    const handleVerify = async (id) => {
        const verifyId = (id || txId).trim();
        if (!verifyId) return;
        setLoading(true);
        setResult(null);
        setSolanaResult(null);

        try {
            if (isSolanaSignature(verifyId)) {
                // Solana signature verification
                const data = await api.solanaVerify(verifyId);
                setSolanaResult(data);
            } else {
                // Local transaction ID verification
                const data = await api.publicVerifyTx(verifyId);
                setResult(data);
            }
        } catch (err) {
            if (isSolanaSignature(verifyId)) {
                setSolanaResult({ verified: false, error: err.message });
            } else {
                setResult({ found: false, message: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="public-layout">
            <nav className="public-nav">
                <div className="landing-logo">
                    <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" />
                    <span>FundNProof</span>
                    <span className="badge badge-chain" style={{ marginLeft: 8 }}>Verification</span>
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
                        Enter a <strong>Transaction ID</strong> (UUID) to verify in the local ledger, or a <strong>Solana TX Signature</strong> to verify on-chain.
                    </p>

                    <div className="verify-input-group">
                        <input
                            className="form-input"
                            value={txId}
                            onChange={e => setTxId(e.target.value)}
                            placeholder="Transaction ID (UUID) or Solana TX Signature"
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                        />
                        <button className="btn btn-primary" onClick={() => handleVerify()} disabled={loading}>
                            {loading ? 'Verifying...' : <><Search size={16} /> Verify</>}
                        </button>
                    </div>

                    {/* Detection hint */}
                    {txId.trim().length > 0 && (
                        <div style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isSolanaSignature(txId.trim()) ? (
                                <>
                                    <Anchor size={12} style={{ color: 'var(--accent-purple)' }} /> Detected: <strong style={{ color: 'var(--accent-purple)' }}>Solana TX Signature</strong> — will verify on Solana devnet
                                    {txId.trim().length < 80 && (
                                        <span style={{ color: 'var(--accent-yellow)', marginLeft: 8 }}>⚠️ Looks truncated ({txId.trim().length} chars, need 86-88). Paste the full signature!</span>
                                    )}
                                </>
                            ) : (
                                <><LinkIcon size={12} style={{ color: 'var(--accent-cyan)' }} /> Detected: <strong style={{ color: 'var(--accent-cyan)' }}>Transaction ID</strong> — will verify in local ledger</>
                            )}
                        </div>
                    )}

                    {/* Solana verification result */}
                    {solanaResult && (
                        <div className="verify-result" style={{ marginTop: 32 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
                                padding: '14px 20px', borderRadius: 10,
                                background: solanaResult.verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                border: `1px solid ${solanaResult.verified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                            }}>
                                {solanaResult.verified ? (
                                    <>
                                        <CheckCircle size={20} style={{ color: 'var(--accent-green)' }} />
                                        <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                                            ✓ Transaction Found on Solana Blockchain
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={20} style={{ color: 'var(--accent-red)' }} />
                                        <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>
                                            ✗ {solanaResult.error || 'Transaction Not Found on Solana'}
                                        </span>
                                    </>
                                )}
                            </div>

                            {solanaResult.verified && (
                                <>
                                    <div style={{ marginBottom: 20, padding: 16, background: 'rgba(139, 92, 246, 0.05)', borderRadius: 10, border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                                        <h4 style={{ fontSize: '0.85rem', color: 'var(--accent-purple)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <Anchor size={14} /> Solana On-Chain Proof
                                        </h4>
                                        <div className="result-item">
                                            <span className="result-label">TX Signature</span>
                                            <span className="result-value" style={{ color: 'var(--accent-purple)', fontWeight: 600 }}>{solanaResult.signature}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Network</span>
                                            <span className="result-value">{solanaResult.network}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Block Time</span>
                                            <span className="result-value" style={{ fontFamily: 'var(--font-sans)' }}>{solanaResult.blockTime ? new Date(solanaResult.blockTime).toLocaleString() : '—'}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Slot</span>
                                            <span className="result-value">{solanaResult.slot?.toLocaleString()}</span>
                                        </div>
                                        <div className="result-item">
                                            <span className="result-label">Fee</span>
                                            <span className="result-value">{solanaResult.fee ? `${solanaResult.fee / 1e9} SOL` : '—'}</span>
                                        </div>
                                        {solanaResult.memoData && (
                                            <div style={{ marginTop: 12 }}>
                                                <span className="result-label" style={{ display: 'block', marginBottom: 6 }}>Memo Data (on-chain)</span>
                                                <pre style={{ background: 'var(--bg-primary)', padding: 12, borderRadius: 8, fontSize: '0.78rem', color: 'var(--accent-cyan)', overflow: 'auto', margin: 0 }}>
                                                    {JSON.stringify(solanaResult.memoData, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>

                                    {/* Local verification cross-check */}
                                    {solanaResult.localVerification && (
                                        <div style={{ padding: 16, borderRadius: 10, background: solanaResult.localVerification.merkleRootMatch ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${solanaResult.localVerification.merkleRootMatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}` }}>
                                            <h4 style={{ fontSize: '0.85rem', color: solanaResult.localVerification.merkleRootMatch ? 'var(--accent-green)' : 'var(--accent-red)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {solanaResult.localVerification.merkleRootMatch ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                Local vs On-Chain Cross-Verification
                                            </h4>
                                            <div className="result-item">
                                                <span className="result-label">Merkle Root Match</span>
                                                <span className="result-value" style={{ fontWeight: 700, color: solanaResult.localVerification.merkleRootMatch ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                    {solanaResult.localVerification.merkleRootMatch ? '✓ Matches — Data is intact' : '✗ MISMATCH — Data may have been tampered!'}
                                                </span>
                                            </div>
                                            <div className="result-item">
                                                <span className="result-label">Stored Merkle Root</span>
                                                <span className="result-value" style={{ color: 'var(--accent-purple)' }}>{solanaResult.localVerification.storedMerkleRoot}</span>
                                            </div>
                                            <div className="result-item">
                                                <span className="result-label">Recomputed Merkle Root</span>
                                                <span className="result-value" style={{ color: 'var(--accent-purple)' }}>{solanaResult.localVerification.recomputedMerkleRoot}</span>
                                            </div>
                                            <div className="result-item">
                                                <span className="result-label">Entries Verified</span>
                                                <span className="result-value">{solanaResult.localVerification.entryCount} entries (block {solanaResult.localVerification.blockRange})</span>
                                            </div>
                                        </div>
                                    )}

                                    <a
                                        href={solanaResult.explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16 }}
                                    >
                                        <ExternalLink size={14} /> View on Solana Explorer
                                    </a>
                                </>
                            )}
                        </div>
                    )}

                    {/* Local transaction verification result */}
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

                {/* Solana Anchors */}
                {anchorStatus && anchorStatus.totalAnchors > 0 && (
                    <div className="card animate-in" style={{ maxWidth: 700, margin: '32px auto' }}>
                        <div className="card-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Anchor size={18} style={{ color: 'var(--accent-purple)' }} />
                                Solana Blockchain Anchors
                            </h2>
                        </div>
                        <div className="card-body">
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                These transactions anchor the local ledger's Merkle Root to Solana devnet. Click a signature to verify it on-chain.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {anchorStatus.anchors.map((a) => (
                                    <div key={a.id} style={{
                                        padding: '12px 16px', borderRadius: 8,
                                        background: 'rgba(139, 92, 246, 0.04)',
                                        border: '1px solid rgba(139, 92, 246, 0.12)',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        flexWrap: 'wrap', gap: 8,
                                    }}>
                                        <div style={{ flex: 1, minWidth: 200 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Anchor #{a.id} · {a.entryCount} entries · Block {a.blockRange}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                                                Merkle: {a.merkleRoot}
                                            </div>
                                        </div>
                                        {a.signature && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                                                onClick={() => {
                                                    // Find the full signature from the status endpoint
                                                    const fullSig = anchorStatus.lastAnchor?.signature;
                                                    if (fullSig) {
                                                        setTxId(fullSig);
                                                        handleVerify(fullSig);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                            >
                                                <Search size={12} /> Verify on Solana
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
