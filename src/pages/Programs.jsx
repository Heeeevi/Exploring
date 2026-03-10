import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function Programs() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', budget: '', start_date: '', end_date: '' });
    const [editForm, setEditForm] = useState({ name: '', description: '', budget: '', status: '', start_date: '', end_date: '' });
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    const load = () => {
        setLoading(true);
        api.getPrograms().then(setPrograms).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createProgram({ ...form, budget: parseFloat(form.budget) || 0 });
            setShowModal(false);
            setForm({ name: '', description: '', budget: '', start_date: '', end_date: '' });
            showToast('success', 'Program created');
            load();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (p) => {
        setEditModal(p);
        setEditForm({
            name: p.name,
            description: p.description || '',
            budget: p.budget || '',
            status: p.status || 'active',
            start_date: p.start_date || '',
            end_date: p.end_date || '',
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.updateProgram(editModal.id, { ...editForm, budget: parseFloat(editForm.budget) || 0 });
            setEditModal(null);
            showToast('success', 'Program updated');
            load();
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (p) => {
        if (!confirm(`Delete program "${p.name}"? This cannot be undone.`)) return;
        try {
            await api.deleteProgram(p.id);
            showToast('success', 'Program deleted');
            load();
        } catch (err) {
            showToast('error', err.message);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Programs</h1>
                    <p>Track projects, budgets, and fund allocation</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> New Program
                </button>
            </div>
            <div className="page-body">
                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
                ) : programs.length === 0 ? (
                    <div className="card">
                        <div className="empty-state">
                            <div className="icon">📋</div>
                            <h3>No programs yet</h3>
                            <p>Create your first program to start tracking fund allocation.</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                        {programs.map(p => {
                            const progress = p.budget > 0 ? Math.min((p.actual_spent / p.budget) * 100, 100) : 0;
                            return (
                                <div key={p.id} className="card animate-in" style={{ transition: 'all 0.2s' }}>
                                    <div className="card-body">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1 }}>{p.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span className={`badge badge-${p.status === 'active' ? 'active' : 'completed'}`}>{p.status}</span>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit" style={{ padding: '3px 6px' }}>
                                                    <Pencil size={13} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p)} title="Delete" style={{ padding: '3px 6px', color: 'var(--accent-red)' }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        {p.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{p.description}</p>}

                                        <div style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Budget Utilization</span>
                                                <span style={{ fontWeight: 600 }}>{progress.toFixed(1)}%</span>
                                            </div>
                                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${progress}%`,
                                                    borderRadius: 3,
                                                    background: progress > 90 ? 'var(--accent-red)' : progress > 70 ? 'var(--accent-amber)' : 'var(--accent-green)',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, fontSize: '0.8rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Budget</div>
                                                <div style={{ fontWeight: 700, color: 'var(--text-accent)' }}>{formatUSD(p.budget)}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Spent</div>
                                                <div style={{ fontWeight: 700, color: 'var(--accent-red)' }}>{formatUSD(p.actual_spent)}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Remaining</div>
                                                <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatUSD(Math.max(p.budget - p.actual_spent, 0))}</div>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{p.transaction_count} transactions</span>
                                            {p.start_date && <span>Started {new Date(p.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>New Program</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Program Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Clean Water Initiative" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What does this program do?" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Budget (USD)</label>
                                    <input className="form-input" type="number" step="0.01" min="0" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="50000" />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input className="form-input" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input className="form-input" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Creating...' : 'Create Program'}</button>
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
                            <h2>Edit Program</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Program Name *</label>
                                    <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Budget (USD)</label>
                                        <input className="form-input" type="number" step="0.01" min="0" value={editForm.budget} onChange={e => setEditForm({ ...editForm, budget: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select className="form-select" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                            <option value="active">Active</option>
                                            <option value="completed">Completed</option>
                                            <option value="paused">Paused</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Start Date</label>
                                        <input className="form-input" type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">End Date</label>
                                        <input className="form-input" type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
        </>
    );
}
