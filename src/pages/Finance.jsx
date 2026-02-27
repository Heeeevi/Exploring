import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, ArrowUpRight, ArrowDownRight, X, Shield } from 'lucide-react';

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
    const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: '', donor_id: '', program_id: '', currency: 'USD' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const load = () => {
        setLoading(true);
        Promise.all([api.getTransactions(), api.getDonors(), api.getPrograms()])
            .then(([txData, d, p]) => {
                setTransactions(txData.transactions);
                setTotal(txData.total);
                setDonors(d);
                setPrograms(p);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

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
            setToast({ type: 'success', message: `Transaction recorded! Hash: ${result.blockchain.hash.slice(0, 16)}...` });
            setTimeout(() => setToast(null), 4000);
            load();
        } catch (err) {
            setToast({ type: 'error', message: err.message });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSubmitting(false);
        }
    };

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
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : transactions.length === 0 ? (
                                    <tr><td colSpan={8}>
                                        <div className="empty-state">
                                            <div className="icon">💰</div>
                                            <h3>No transactions yet</h3>
                                            <p>Click "New Transaction" to record your first income or expense.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    transactions.map(tx => (
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

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

            {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
        </>
    );
}
