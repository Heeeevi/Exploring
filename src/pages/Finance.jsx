import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, ArrowUpRight, ArrowDownRight, X, Shield, Pencil, Search, Landmark, FileUp, PlayCircle } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function Finance() {
    const [transactions, setTransactions] = useState([]);
    const [donors, setDonors] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(null); // null or tx object
    const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: '', donor_id: '', program_id: '', currency: 'USD' });
    const [editForm, setEditForm] = useState({ description: '', category: '', donor_id: '', program_id: '' });
    const [submitting, setSubmitting] = useState(false);
    const [correcting, setCorrecting] = useState(false);
    const [correctionReason, setCorrectionReason] = useState('');
    const [toast, setToast] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [reconciliation, setReconciliation] = useState(null);
    const [recAccounts, setRecAccounts] = useState([]);
    const [recProviders, setRecProviders] = useState([]);
    const [recLocks, setRecLocks] = useState([]);
    const [recBankName, setRecBankName] = useState('');
    const [recAccountName, setRecAccountName] = useState('Main Operational Account');
    const [recMaskedNumber, setRecMaskedNumber] = useState('***1234');
    const [recProvider, setRecProvider] = useState('manual');
    const [selectedRecAccountId, setSelectedRecAccountId] = useState('');
    const [syncDays, setSyncDays] = useState(7);
    const [syncing, setSyncing] = useState(false);
    const [statementInput, setStatementInput] = useState('');
    const [reconcilePeriod, setReconcilePeriod] = useState(() => {
        const now = new Date();
        const end = now.toISOString().slice(0, 10);
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        return { start: startDate.toISOString().slice(0, 10), end };
    });

    const load = () => {
        setLoading(true);
        const params = [];
        if (filterType) params.push(`type=${filterType}`);
        Promise.all([
            api.getTransactions(params.join('&')),
            api.getDonors(),
            api.getPrograms(),
            api.reconciliationStatus().catch(() => null),
            api.reconciliationAccounts().catch(() => ({ accounts: [] })),
            api.reconciliationProviders().catch(() => ({ providers: [] })),
            api.reconciliationLocks().catch(() => ({ locks: [] })),
        ])
            .then(([txData, d, p, recStatus, recAcc, recProv, recLockResp]) => {
                setTransactions(txData.transactions);
                setTotal(txData.total);
                setDonors(d);
                setPrograms(p);
                setReconciliation(recStatus);
                setRecProviders(recProv.providers || []);
                setRecLocks(recLockResp.locks || []);
                const accounts = recAcc.accounts || [];
                setRecAccounts(accounts);
                if (!selectedRecAccountId && accounts[0]?.id) {
                    setSelectedRecAccountId(accounts[0].id);
                }
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [filterType]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const parseStatementInput = () => {
        const raw = statementInput.trim();
        if (!raw) throw new Error('Paste statement data first');

        // Try JSON first.
        if (raw.startsWith('[') || raw.startsWith('{')) {
            const parsed = JSON.parse(raw);
            const entries = Array.isArray(parsed) ? parsed : parsed.entries;
            if (!Array.isArray(entries) || entries.length === 0) {
                throw new Error('JSON must be an array of entries or { entries: [] }');
            }
            return entries;
        }

        // Fallback CSV parser: entry_date,amount,direction,description,external_ref,running_balance
        const lines = raw.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2) throw new Error('CSV requires header + rows');

        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        const required = ['entry_date', 'amount', 'direction'];
        const missing = required.filter((key) => !headers.includes(key));
        if (missing.length > 0) {
            throw new Error(`CSV missing required columns: ${missing.join(', ')}`);
        }

        const entries = lines.slice(1).map((line) => {
            const cells = line.split(',');
            const get = (name) => {
                const idx = headers.indexOf(name);
                return idx >= 0 ? (cells[idx] || '').trim() : '';
            };
            return {
                entry_date: get('entry_date'),
                amount: Number(get('amount')),
                direction: get('direction'),
                description: get('description') || null,
                external_ref: get('external_ref') || null,
                running_balance: get('running_balance') ? Number(get('running_balance')) : null,
            };
        });

        return entries;
    };

    const handleCreateBankAccount = async () => {
        try {
            if (!recAccountName.trim()) throw new Error('Account label is required');
            const created = await api.reconciliationCreateAccount({
                name: recAccountName.trim(),
                bank_name: recBankName.trim() || null,
                account_number_masked: recMaskedNumber.trim() || null,
                currency: 'USD',
                provider: recProvider,
                provider_config: recProvider === 'demo-feed' ? { referencePrefix: 'DEMO' } : null,
            });
            showToast('success', 'Bank account added for factual reconciliation');
            setRecBankName('');
            setRecMaskedNumber('***1234');
            await load();
            if (created?.id) setSelectedRecAccountId(created.id);
        } catch (err) {
            showToast('error', err.message);
        }
    };

    const handleImportStatement = async () => {
        try {
            if (!selectedRecAccountId) throw new Error('Select bank account first');
            const entries = parseStatementInput();
            const result = await api.reconciliationImport({
                bank_account_id: selectedRecAccountId,
                entries,
                source: 'manual_upload',
            });
            showToast('success', `Imported ${result.imported} bank statement entries`);
            setStatementInput('');
            await load();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    const handleRunReconciliation = async () => {
        try {
            if (!selectedRecAccountId) throw new Error('Select bank account first');
            if (!reconcilePeriod.start || !reconcilePeriod.end) throw new Error('Choose reconciliation date range');
            const result = await api.reconciliationRun({
                bank_account_id: selectedRecAccountId,
                period_start: reconcilePeriod.start,
                period_end: reconcilePeriod.end,
            });
            const hasMismatch = Math.abs(result.delta_income) > 0.009 || Math.abs(result.delta_expense) > 0.009 || result.unmatched_count > 0;
            if (hasMismatch) {
                showToast('error', `Mismatch detected: ${result.unmatched_count} unmatched items`);
            } else {
                showToast('success', 'Ledger and bank statement are aligned for selected period');
            }
            await load();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    const handleSyncFromProvider = async () => {
        try {
            if (!selectedRecAccountId) throw new Error('Select bank account first');
            setSyncing(true);
            const result = await api.reconciliationSync({
                bank_account_id: selectedRecAccountId,
                days: Number(syncDays || 7),
            });
            showToast('success', `Synced ${result.imported} entries from ${result.provider}`);
            await load();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const result = await api.createTransaction({
                ...form,
                amount: parseFloat(form.amount),
            });
            setShowModal(false);
            setForm({ type: 'income', amount: '', description: '', category: '', donor_id: '', program_id: '', currency: 'USD' });
            showToast('success', `Transaction recorded! Hash: ${result.blockchain.hash.slice(0, 16)}...`);
            load();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (tx) => {
        setEditModal(tx);
        setCorrectionReason('');
        setEditForm({
            description: tx.description,
            category: tx.category || '',
            donor_id: tx.donor_id || '',
            program_id: tx.program_id || '',
        });
    };

    const handleCreateCorrection = async () => {
        try {
            if (!editModal?.id) throw new Error('No transaction selected');
            if (!correctionReason.trim()) throw new Error('Correction reason is required');
            setCorrecting(true);
            await api.createTransactionCorrection(editModal.id, {
                reason: correctionReason.trim(),
                description: editForm.description,
                category: editForm.category,
                donor_id: editForm.donor_id,
                program_id: editForm.program_id,
            });
            setEditModal(null);
            showToast('success', 'Correction entry created and linked to immutable ledger');
            await load();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setCorrecting(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.updateTransaction(editModal.id, editForm);
            setEditModal(null);
            showToast('success', 'Transaction updated (amount & type remain immutable on-chain)');
            load();
        } catch (err) {
            if (String(err.message || '').toLowerCase().includes('locked reconciled period')) {
                showToast('error', 'Period already reconciled and locked. Use correction entry flow.');
            } else {
                showToast('error', err.message);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = searchTerm
        ? transactions.filter(tx =>
            tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.program_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : transactions;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Finance</h1>
                    <p>Record and track all income & expenses</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Transaction
                </button>
            </div>
            <div className="page-body">
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                        <Search size={16} style={{ color: 'var(--text-muted)' }} />
                        <input placeholder="Search transactions..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className={`btn btn-sm ${filterType === '' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilterType('')}>All</button>
                        <button className={`btn btn-sm ${filterType === 'income' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setFilterType('income')}>Income</button>
                        <button className={`btn btn-sm ${filterType === 'expense' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setFilterType('expense')}>Expenses</button>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-header">
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Landmark size={16} /> Factual Bank Reconciliation
                        </h2>
                    </div>
                    <div className="card-body" style={{ display: 'grid', gap: 16 }}>
                        <div className={`chain-status ${reconciliation?.has_mismatch ? 'invalid' : 'valid'}`} style={{ marginBottom: 0 }}>
                            <span className="status-dot"></span>
                            {reconciliation
                                ? (reconciliation.has_mismatch
                                    ? `Mismatch found (${reconciliation.total_unmatched} unmatched item(s))`
                                    : 'No mismatch in latest reconciliation run')
                                : 'No reconciliation run yet'}
                        </div>

                        <div className="grid-2" style={{ marginBottom: 0, alignItems: 'start' }}>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <div className="form-group" style={{ marginBottom: 4 }}>
                                    <label className="form-label">Reconciliation Account</label>
                                    <select className="form-select" value={selectedRecAccountId} onChange={(e) => setSelectedRecAccountId(e.target.value)}>
                                        <option value="">Select account...</option>
                                        {recAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name} {acc.bank_name ? `(${acc.bank_name})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Period Start</label>
                                        <input className="form-input" type="date" value={reconcilePeriod.start} onChange={(e) => setReconcilePeriod((prev) => ({ ...prev, start: e.target.value }))} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Period End</label>
                                        <input className="form-input" type="date" value={reconcilePeriod.end} onChange={(e) => setReconcilePeriod((prev) => ({ ...prev, end: e.target.value }))} />
                                    </div>
                                </div>

                                <button type="button" className="btn btn-primary btn-sm" onClick={handleRunReconciliation}>
                                    <PlayCircle size={14} /> Run Reconciliation
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: 10 }}>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Bank Account Label</label>
                                        <input className="form-input" value={recAccountName} onChange={(e) => setRecAccountName(e.target.value)} placeholder="Main Operational Account" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Bank Name</label>
                                        <input className="form-input" value={recBankName} onChange={(e) => setRecBankName(e.target.value)} placeholder="BCA / BRI / Mandiri" />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Account Number (Masked)</label>
                                        <input className="form-input" value={recMaskedNumber} onChange={(e) => setRecMaskedNumber(e.target.value)} placeholder="***1234" />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 4 }}>
                                        <label className="form-label">Provider</label>
                                        <select className="form-select" value={recProvider} onChange={(e) => setRecProvider(e.target.value)}>
                                            {(recProviders.length ? recProviders : [{ key: 'manual', name: 'Manual Upload' }, { key: 'demo-feed', name: 'Demo Feed (Mock)' }]).map((p) => (
                                                <option key={p.key} value={p.key}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 4, display: 'flex', alignItems: 'end' }}>
                                        <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateBankAccount}>Save Account</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Statement Import (JSON array or CSV)</label>
                            <textarea
                                className="form-textarea"
                                style={{ minHeight: 120, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                                value={statementInput}
                                onChange={(e) => setStatementInput(e.target.value)}
                                placeholder={'JSON: [{"entry_date":"2026-04-15","amount":1500,"direction":"credit","description":"Donor transfer","external_ref":"TRX-001"}]\n\nCSV: entry_date,amount,direction,description,external_ref,running_balance'}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Required fields: entry_date, amount, direction(credit/debit)
                                </span>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleImportStatement}>
                                        <FileUp size={14} /> Import Statement
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={90}
                                        value={syncDays}
                                        onChange={(e) => setSyncDays(e.target.value)}
                                        className="form-input"
                                        style={{ width: 84, padding: '6px 8px' }}
                                        title="Sync days"
                                    />
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleSyncFromProvider} disabled={syncing}>
                                        {syncing ? 'Syncing...' : 'Auto Sync'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {recLocks.length > 0 && (
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>Active Reconciliation Locks</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {recLocks.slice(0, 3).map((lock) => (
                                        <div key={lock.id} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                            #{lock.id}: {lock.period_start} - {lock.period_end}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2>All Transactions ({total})</h2>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                    <th>Category</th>
                                    <th>Program</th>
                                    <th>Donor</th>
                                    <th>Blockchain Hash</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={9}>
                                        <div className="empty-state">
                                            <div className="icon">Transactions</div>
                                            <h3>No transactions found</h3>
                                            <p>{searchTerm ? 'Try a different search term.' : 'Click "New Transaction" to record your first income or expense.'}</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    filtered.map(tx => (
                                        <tr key={tx.id}>
                                            <td>
                                                <span className={`badge badge-${tx.type}`}>
                                                    {tx.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</td>
                                            <td style={{ fontWeight: 700, color: tx.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                                {tx.type === 'income' ? '+' : '-'}{formatUSD(tx.amount)}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{tx.category || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.program_name || '—'}</td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{tx.donor_name || '—'}</td>
                                            <td>
                                                {tx.blockchain_hash ? (
                                                    <div className="hash-display" title={tx.blockchain_hash}>
                                                        <Shield size={10} style={{ display: 'inline', marginRight: 4 }} />
                                                        {tx.blockchain_hash.slice(0, 16)}...
                                                    </div>
                                                ) : '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                                                {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)} title="Edit metadata" style={{ padding: '4px 8px' }}>
                                                    <Pencil size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Transaction</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button type="button" className={`btn btn-sm ${form.type === 'income' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setForm({ ...form, type: 'income' })}>
                                            <ArrowUpRight size={14} /> Income
                                        </button>
                                        <button type="button" className={`btn btn-sm ${form.type === 'expense' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setForm({ ...form, type: 'expense' })}>
                                            <ArrowDownRight size={14} /> Expense
                                        </button>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Amount (USD)</label>
                                        <input className="form-input" type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="10000" required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Donation, Supplies" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What is this transaction for?" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Link to Donor</label>
                                        <select className="form-select" value={form.donor_id} onChange={e => setForm({ ...form, donor_id: e.target.value })}>
                                            <option value="">— None —</option>
                                            {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Link to Program</label>
                                        <select className="form-select" value={form.program_id} onChange={e => setForm({ ...form, program_id: e.target.value })}>
                                            <option value="">— None —</option>
                                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                    {submitting ? 'Recording...' : <>
                                        <Shield size={14} /> Record & Hash
                                    </>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={() => setEditModal(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Transaction</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div style={{
                                    padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: '0.82rem',
                                    background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: 'var(--text-secondary)'
                                }}>
                                    <Shield size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                                    Amount ({formatUSD(editModal.amount)}) and type ({editModal.type}) are <strong>immutable</strong> — they're sealed on the blockchain.
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <input className="form-input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Link to Donor</label>
                                        <select className="form-select" value={editForm.donor_id} onChange={e => setEditForm({ ...editForm, donor_id: e.target.value })}>
                                            <option value="">— None —</option>
                                            {donors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Link to Program</label>
                                        <select className="form-select" value={editForm.program_id} onChange={e => setEditForm({ ...editForm, program_id: e.target.value })}>
                                            <option value="">— None —</option>
                                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Correction Reason (for locked period flow)</label>
                                    <input
                                        className="form-input"
                                        value={correctionReason}
                                        onChange={e => setCorrectionReason(e.target.value)}
                                        placeholder="Example: Wrong category mapping from bank statement"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCreateCorrection} disabled={correcting}>
                                    {correcting ? 'Creating...' : 'Create Correction Entry'}
                                </button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
        </>
    );
}
