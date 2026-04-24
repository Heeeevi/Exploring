import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, DollarSign, Users, FolderKanban, Globe, LogOut, Shield, BookOpen, Anchor, Activity, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '../i18n.jsx';
import { useTheme } from '../useTheme.js';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const { t, locale, setLocale } = useI18n();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="dashboard-layout">
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap' }}>{t('siteName')}</span>
                    </div>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }} 
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        className="collapse-toggle-btn"
                    >
                        {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-title">Main</div>
                    <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} className="icon" />
                        <span>{t('sidebar.dashboard')}</span>
                    </NavLink>
                    <NavLink to="/dashboard/finance" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <DollarSign size={20} className="icon" />
                        <span>{t('sidebar.finance')}</span>
                    </NavLink>
                    <NavLink to="/dashboard/donors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Users size={20} className="icon" />
                        <span>{t('sidebar.donors')}</span>
                    </NavLink>
                    <NavLink to="/dashboard/programs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <FolderKanban size={20} className="icon" />
                        <span>{t('sidebar.programs')}</span>
                    </NavLink>
                    <NavLink to="/dashboard/guide" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <BookOpen size={20} className="icon" />
                        <span>{t('sidebar.guide')}</span>
                    </NavLink>

                    <div className="sidebar-section-title">Transparency</div>
                    <NavLink to="/dashboard/solana" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Anchor size={20} className="icon" />
                        <span>Solana Anchor</span>
                    </NavLink>
                    <NavLink to="/dashboard/activity" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <Activity size={20} className="icon" />
                        <span>Activity Log</span>
                    </NavLink>
                    <a href="/public" target="_blank" className="sidebar-link">
                        <Globe size={20} className="icon" />
                        <span>Public Ledger</span>
                    </a>
                    <a href="/public/verify" target="_blank" className="sidebar-link">
                        <Shield size={20} className="icon" />
                        <span>Verify Transaction</span>
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
                    <div style={{ padding: '0 12px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Language</label>
                        <select value={locale} onChange={(e) => setLocale(e.target.value)} style={{ background: 'transparent', color: 'inherit', border: '1px solid var(--border-color)', borderRadius: 6, padding: '6px 8px' }}>
                            <option value="en">English</option>
                            <option value="id">Indonesia</option>
                        </select>
                        <button onClick={toggleTheme} className="theme-toggle" style={{ marginLeft: 'auto' }}>
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                    </div>
                    <button onClick={handleLogout} className="sidebar-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--text-secondary)' }}>
                        <LogOut size={20} className="icon" style={{ flexShrink: 0 }} />
                        <span>{t('sidebar.signOut')}</span>
                    </button>
                </div>
            </aside>
            <main className="main-content">
                <button
                    type="button"
                    className="dashboard-theme-fab"
                    onClick={toggleTheme}
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <Outlet />
            </main>
        </div>
    );
}
