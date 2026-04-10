import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, ArrowUpRight, ArrowDownRight, X, Shield, Pencil, Search } from 'lucide-react';

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
    const [toast, setToast] = useState(null);
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const load = () => {
        setLoading(true);
        const params = [];
        if (filterType) params.push(`type=${filterType}`);
        Promise.all([api.getTransactions(params.join('&')), api.getDonors(), api.getPrograms()])
            .then(([txData, d, p]) => {
                setTransactions(txData.transactions);
                setTotal(txData.total);
                setDonors(d);
                setPrograms(p);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [filterType]);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
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
        setEditForm({
            description: tx.description,
            category: tx.category || '',
            donor_id: tx.donor_id || '',
            program_id: tx.program_id || '',
        });
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
            showToast('error', err.message);
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
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
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
