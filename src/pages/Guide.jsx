import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { ChevronDown, ChevronRight, CheckCircle, Lightbulb, HelpCircle } from 'lucide-react';
import { useI18n } from '../i18n.jsx';

// We'll use the localized sections from the i18n provider

function GuideSection({ section, isOpen, onToggle }) {
    return (
        <div className="card animate-in" style={{ marginBottom: 16 }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%', padding: '20px 24px', background: 'none', border: 'none',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    fontFamily: 'var(--font-sans)', textAlign: 'left'
                }}
            >
                <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: `${section.color}15`, color: section.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    {section.icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{section.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{section.steps.length} steps</div>
                </div>
                {isOpen ? <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {isOpen && (
                <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-color)' }}>
                    {section.steps.map((step, i) => (
                        <div key={i} style={{ marginTop: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    background: `${section.color}20`, color: section.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, flexShrink: 0
                                }}>
                                    {i + 1}
                                </div>
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.title}</h3>
                            </div>
                            <div style={{
                                fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.8,
                                paddingLeft: 38, whiteSpace: 'pre-line'
                            }}>
                                {step.content.split('\n').map((line, j) => {
                                    // Bold text
                                    const parts = line.split(/\*\*(.*?)\*\*/g);
                                    return (
                                        <div key={j} style={{ marginBottom: line.trim() === '' ? 8 : 2 }}>
                                            {parts.map((part, k) =>
                                                k % 2 === 1
                                                    ? <strong key={k} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part}</strong>
                                                    : <span key={k}>{part}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Guide() {
    const { strings, t } = useI18n();
    const [openSections, setOpenSections] = useState(new Set(['getting-started']));

    const sections = (strings?.guide?.sections) || [];

    const toggleSection = (id) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => setOpenSections(new Set(sections.map(s => s.id)));
    const collapseAll = () => setOpenSections(new Set());

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>{t('guide.title')}</h1>
                    <p>{t('guide.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={expandAll}>{t('guide.expandAll')}</button>
                    <button className="btn btn-ghost btn-sm" onClick={collapseAll}>{t('guide.collapseAll')}</button>
                </div>
            </div>
            <div className="page-body">
                {/* Quick tips */}
                <div style={{
                    display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap'
                }}>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <Lightbulb size={14} style={{ color: '#3b82f6' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#3b82f6' }}>{t('guide.quickTip')}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {t('guide.sections')[0].steps[0].content.split('\n').slice(0,2).join('\n')}
                        </p>
                    </div>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <CheckCircle size={14} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>{t('guide.bestPractice')}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {t('guide.sections')[2].steps[0].content.split('\n').slice(0,2).join('\n')}
                        </p>
                    </div>
                    <div style={{
                        flex: '1 1 200px', padding: '16px 20px', borderRadius: 12,
                        background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <HelpCircle size={14} style={{ color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>{t('guide.important')}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {t('guide.subtitle')}
                        </p>
                    </div>
                </div>

                {/* Sections */}
                {sections.map(section => (
                    <GuideSection
                        key={section.id}
                        section={section}
                        isOpen={openSections.has(section.id)}
                        onToggle={() => toggleSection(section.id)}
                    />
                ))}
            </div>
        </>
    );
}
