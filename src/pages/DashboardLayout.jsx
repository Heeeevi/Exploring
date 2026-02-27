import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, DollarSign, Users, FolderKanban, Globe, LogOut, Shield } from 'lucide-react';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-icon">🔗</div>
                    TransparentERP
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Main</div>
                    <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} className="icon" />
                        Dashboard
                    </NavLink>
                    <NavLink to="/dashboard/finance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <DollarSign size={20} className="icon" />
                        Finance
                    </NavLink>
                    <NavLink to="/dashboard/donors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} className="icon" />
                        Donors
                    </NavLink>
                    <NavLink to="/dashboard/programs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <FolderKanban size={20} className="icon" />
                        Programs
                    </NavLink>

                    <div className="sidebar-section-title">Transparency</div>
                    <a href="/public" target="_blank" className="sidebar-link">
                        <Globe size={20} className="icon" />
                        Public Ledger
                    </a>
                    <a href="/public/verify" target="_blank" className="sidebar-link">
                        <Shield size={20} className="icon" />
                        Verify Transaction
                    </a>
                </nav>
                <div className="sidebar-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '0 12px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--text-secondary)' }}>
                        <LogOut size={20} className="icon" />
                        Sign Out
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
