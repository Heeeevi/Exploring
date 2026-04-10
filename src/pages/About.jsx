import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Sparkles, ShieldCheck, CircleAlert, ArrowUpRight } from 'lucide-react';
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
            <nav className="landing-clean-nav">
                <div className="landing-logo">
                    <img src="/FNP Logo.png" alt="FundNProof logo" className="logo-icon" />
                    <span>FundNProof</span>
                </div>
                <div className="landing-clean-actions">
                    <Link to="/" className="btn btn-ghost btn-sm">Home</Link>
                    <Link to="/public" className="btn btn-ghost btn-sm">Public Ledger</Link>
                    <button type="button" className="btn btn-ghost btn-sm theme-toggle" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                </div>
            </nav>

            <main className="landing-clean-main">
                <section className="landing-clean-hero about-hero-minimal">
                    <div className="landing-clean-kicker">
                        <span>Trust infrastructure for public money in Indonesia</span>
                    </div>
                    <h1>FundNProof</h1>
                    <p>
                        Every year, more than Rp40 trillion in donations, zakat, and social funds flow through systems that people cannot independently verify.
                        FundNProof answers "Where did my money actually go?" with verifiable proof, not promises.
                    </p>
                </section>

                <section className="landing-clean-section about-plain-section">
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

                <section className="landing-clean-section about-plain-section">
                    <div className="landing-clean-heading">
                        <ShieldCheck size={18} />
                        <h2>How FundNProof Works</h2>
                    </div>
                    <p>
                        FundNProof combines ERP-level usability, cryptographic integrity, and Solana anchoring so every transaction is recorded,
                        tamper-evident, and publicly verifiable.
                    </p>
                    <ol className="about-flow-list">
                        <li>Transactions are recorded in a familiar operational dashboard.</li>
                        <li>Each record is hashed and linked, making silent edits detectable.</li>
                        <li>Batches are anchored to Solana through Merkle proofs.</li>
                        <li>Public verification can be done without trusting internal claims.</li>
                    </ol>
                    <div className="about-inline-note">
                        Off-chain for usability, on-chain for proof. This is the core trust model.
                    </div>
                </section>

                <section
                    ref={businessModelRef}
                    className={`landing-clean-section about-business-model ${businessModelVisible ? 'is-visible' : ''}`}
                >
                    <div className="landing-clean-heading">
                        <Sparkles size={18} />
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

                <section className="about-closing">
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
