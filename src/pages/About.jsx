import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, TrendingUp, ShieldCheck, CircleAlert, ArrowUpRight, Shield } from 'lucide-react';
import { useTheme } from '../useTheme.js';

function useInView(options = { threshold: 0.2 }) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return undefined;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        observer.observe(node);
        return () => observer.disconnect();
    }, [options]);

    return [ref, isVisible];
}

export default function About() {
    const { theme, toggleTheme } = useTheme();
    const [businessModelRef, businessModelVisible] = useInView({ threshold: 0.24 });

    const phases = [
        {
            phase: 'Phase 1 — 0 to 6 months',
            title: 'Free access for NGOs and zakat organizations',
            body: 'Goal: build adoption, generate verified transaction history, and establish trust in the system.',
            level: 28,
            tag: 'Adoption',
            kpi: 'KPI: Onboarding baseline'
        },
        {
            phase: 'Phase 2 — 6 to 18 months',
            title: 'SaaS subscription for higher-volume organizations',
            body: 'Estimated range: Rp500.000 – Rp2.000.000 per month, based on transaction volume and feature tier.',
            level: 62,
            tag: 'SaaS',
            kpi: 'KPI: Recurring revenue fit'
        },
        {
            phase: 'Phase 3 — 18 months onward',
            title: 'API and infrastructure licensing',
            body: 'For platforms requiring built-in verification: crowdfunding platforms, corporate CSR systems, and government reporting tools.',
            level: 92,
            tag: 'Infrastructure',
            kpi: 'KPI: Ecosystem integration'
        }
    ];

    const chartBottom = 150;
    const chartPoints = phases.map((item, index) => ({
        x: 56 + (index * 154),
        y: chartBottom - item.level
    }));
    const linePath = `M ${chartPoints.map((point) => `${point.x} ${point.y}`).join(' L ')}`;
    const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartBottom} L ${chartPoints[0].x} ${chartBottom} Z`;

    return (
        <div className="landing-page landing-clean about-page">
            <div className="fronsciers-nav-wrapper">
                <nav className="fronsciers-nav">
                    <Link to="/" className="landing-v2-brand" style={{display: 'flex', alignItems: 'center', marginLeft: 16, fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', textDecoration: 'none'}}>
                        <img src="/FNP Logo.png" alt="FundNProof logo" style={{width:30, height:30, objectFit:'contain', marginRight: 8, background: 'var(--bg-card)', borderRadius: 10, padding: 3, border: '1px solid var(--border-color)'}} />
                        FUNDNPROOF
                    </Link>
                    <div className="landing-v2-actions" style={{display: 'flex', gap: 16, alignItems: 'center', marginRight: 16}}>
                        <Link to="/" className="btn btn-ghost btn-sm text-muted-foreground">Home</Link>
                        <Link to="/public" className="btn btn-ghost btn-sm text-muted-foreground">Public Ledger</Link>
                        <button type="button" className="btn btn-ghost btn-sm theme-toggle text-muted-foreground" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                        <Link to="/login" className="btn btn-secondary btn-sm" style={{borderRadius: 9999}}>Sign In</Link>
                    </div>
                </nav>
            </div>

            <main className="landing-clean-main">
                <section className="landing-clean-hero about-hero-minimal fade-up">
                    <div className="landing-clean-kicker">
                        <span className="uppercase-kicker tracking-widest text-muted-foreground">Trust infrastructure for public money in Indonesia</span>
                    </div>
                    <h1 className="tracking-tight" style={{fontSize: '3.5rem', fontWeight: 600, marginTop: 16, marginBottom: 16}}>FundNProof</h1>
                    <p className="text-muted-foreground leading-relaxed" style={{fontSize: '1.125rem'}}>
                        Every year, more than Rp40 trillion in donations, zakat, and social funds flow through systems that people cannot independently verify.
                        FundNProof answers "Where did my money actually go?" with verifiable proof, not promises.
                    </p>
                </section>

                <section className="landing-clean-section about-plain-section fade-up delay-100">
                    <div className="landing-clean-heading">
                        <CircleAlert size={18} />
                        <h2>Problem and Opportunity</h2>
                    </div>
                    <div className="about-simple-grid">
                        <div>
                            <p>
                                Trust in public fund management is fragile. Transparency is often claimed, but hard to verify independently.
                            </p>
                            <ul>
                                <li>Donors struggle to trace actual fund usage</li>
                                <li>Static reports are difficult to audit quickly</li>
                                <li>Manual checks increase operational burden</li>
                            </ul>
                        </div>
                        <div>
                            <p>
                                Indonesia has both urgency and scale: large annual donation flows, many organizations, and high demand for trusted reporting.
                            </p>
                            <ul>
                                <li>Rp40+ trillion annual social fund flow</li>
                                <li>700+ registered zakat organizations</li>
                                <li>Massive potential for transparent infrastructure</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <div className="h-px w-full" style={{background: 'var(--border-color)', margin: '4rem 0'}} role="separator" aria-orientation="horizontal"></div>

                <section className="fronsciers-features-bg fade-up delay-200">
                    <div style={{padding: '6rem 2rem', maxWidth: '80rem', margin: '0 auto'}}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '3rem', alignItems: 'flex-start'}}>
                            <div style={{maxWidth: 600}}>
                                <h2 className="tracking-tight" style={{fontSize: '2.5rem', fontWeight: 600, marginBottom: 16}}>How FundNProof Works</h2>
                                <p style={{fontSize: '1.25rem', opacity: 0.8, lineHeight: 1.6}}>
                                    FundNProof combines ERP-level usability, cryptographic integrity, and Solana anchoring so every transaction is recorded,
                                    tamper-evident, and publicly verifiable.
                                </p>
                            </div>
                            
                            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%'}}>
                                <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                    <div style={{fontSize: '2.5rem'}}>⚡️</div>
                                    <div style={{flex: 1}}>
                                        <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Familiar Dashboard</h3>
                                        <p style={{opacity: 0.8}}>Transactions are recorded in a familiar operational dashboard without needing crypto knowledge.</p>
                                        <div style={{height: 1, background: 'rgba(255,255,255,0.2)', marginTop: 24}}></div>
                                    </div>
                                </div>
                                <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                    <div style={{fontSize: '2.5rem'}}>🔒</div>
                                    <div style={{flex: 1}}>
                                        <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Cryptographic Proof</h3>
                                        <p style={{opacity: 0.8}}>Each record is hashed and linked, making silent edits detectable.</p>
                                        <div style={{height: 1, background: 'rgba(255,255,255,0.2)', marginTop: 24}}></div>
                                    </div>
                                </div>
                                <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                    <div style={{fontSize: '2.5rem'}}>🌍</div>
                                    <div style={{flex: 1}}>
                                        <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Public Verification</h3>
                                        <p style={{opacity: 0.8}}>Batches are anchored to Solana. Public verification can be done without trusting internal claims.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section
                    ref={businessModelRef}
                    className={`landing-clean-section about-business-model fade-up delay-300 ${businessModelVisible ? 'is-visible' : ''}`}
                >
                    <div className="landing-clean-heading">
                        <TrendingUp size={18} />
                        <h2>Business Model</h2>
                    </div>
                    <p className="about-business-model-intro">
                        FundNProof follows a phased adoption approach to lower entry barriers first, then scale via recurring software and infrastructure layers.
                    </p>

                    <div className="about-business-model-chart" aria-label="Business model phase growth chart">
                        <div className="about-business-model-line-wrap">
                            <svg viewBox="0 0 420 180" className="about-business-model-linechart" role="img" aria-label="KPI growth line chart from phase 1 to phase 3">
                                <defs>
                                    <linearGradient id="kpiLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#38bdf8" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                    <linearGradient id="kpiAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.30)" />
                                        <stop offset="100%" stopColor="rgba(56, 189, 248, 0.02)" />
                                    </linearGradient>
                                </defs>

                                <line x1="30" y1="150" x2="390" y2="150" className="about-kpi-axis-line" />
                                <line x1="30" y1="120" x2="390" y2="120" className="about-kpi-grid-line" />
                                <line x1="30" y1="90" x2="390" y2="90" className="about-kpi-grid-line" />
                                <line x1="30" y1="60" x2="390" y2="60" className="about-kpi-grid-line" />

                                <path d={areaPath} className="about-kpi-area" />
                                <path d={linePath} className="about-kpi-line" />

                                {chartPoints.map((point, index) => (
                                    <g key={`node-${phases[index].phase}`} style={{ '--node-delay': `${index * 280 + 560}ms` }}>
                                        <circle cx={point.x} cy={point.y} r="10" className="about-kpi-node-ring" />
                                        <circle cx={point.x} cy={point.y} r="4.5" className="about-kpi-node" />
                                    </g>
                                ))}
                            </svg>

                            <div className="about-business-model-targets">
                                {phases.map((item, index) => (
                                    <div
                                        key={`target-${item.phase}`}
                                        className="about-business-model-target"
                                        style={{ '--target-delay': `${index * 180 + 620}ms` }}
                                    >
                                        <strong>{item.level}%</strong>
                                        <span>{item.kpi}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="about-business-model-list">
                        {phases.map((item, index) => (
                            <div
                                key={item.phase}
                                className="about-business-model-phase"
                                style={{ transitionDelay: `${index * 120}ms` }}
                            >
                                <div className="about-business-model-phase-head">
                                    <span className="about-business-model-tag">{item.phase}</span>
                                    <strong>{item.tag}</strong>
                                </div>
                                <p><strong>{item.title}</strong></p>
                                <p>{item.body}</p>
                            </div>
                        ))}
                    </div>

                    <p className="about-business-model-note">
                        This phased model lowers entry barriers while building a compounding data and trust layer over time.
                    </p>
                </section>

                <section className="about-closing fade-up delay-400">
                    <h3>One-line pitch</h3>
                    <p>FundNProof: turning "Where did my money go?" from a question into something anyone can verify.</p>
                    <div className="landing-clean-ctas">
                        <Link to="/public" className="btn btn-primary btn-sm">Try Public Ledger</Link>
                        <Link to="/" className="btn btn-secondary btn-sm">Back to Home <ArrowUpRight size={14} /></Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
