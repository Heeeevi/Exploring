import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Plus, X, Globe, Mail } from 'lucide-react';

function formatUSD(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function Donors() {
    const [donors, setDonors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', organization: '', country: '' });
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        setLoading(true);
        api.getDonors().then(setDonors).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createDonor(form);
            setShowModal(false);
            setForm({ name: '', email: '', organization: '', country: '' });
            load();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Donors</h1>
                    <p>Manage donor profiles and track contributions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Add Donor
                </button>
            </div>
            <div className="page-body">
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Organization</th>
                                    <th>Email</th>
                                    <th>Country</th>
                                    <th>Total Donated</th>
                                    <th>Transactions</th>
                                    <th>Since</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading...</td></tr>
                                ) : donors.length === 0 ? (
                                    <tr><td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="icon">👥</div>
                                            <h3>No donors yet</h3>
                                            <p>Add your first donor to start tracking contributions.</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    donors.map(d => (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: 8,
                                                        background: 'var(--gradient-chain)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', fontWeight: 700
                                                    }}>
                                                        {d.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {d.name}
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{d.organization || '—'}</td>
                                            <td>
                                                {d.email ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                                        <Mail size={12} /> {d.email}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                {d.country ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}>
                                                        <Globe size={12} /> {d.country}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>{formatUSD(d.total_donated)}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{d.transaction_count}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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
                            <h2>Add Donor</h2>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Donor name" required />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="donor@email.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Country</label>
                                        <input className="form-input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="e.g. United States" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Organization</label>
                                    <input className="form-input" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Donor's organization" />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Adding...' : 'Add Donor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
