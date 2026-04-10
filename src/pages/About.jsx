import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, Sparkles, ShieldCheck, CircleAlert, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../useTheme.js';

export default function About() {
    const { theme, toggleTheme } = useTheme();

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
                <section className="landing-clean-hero card">
                    <div className="landing-clean-kicker">
                        <span>Trust infrastructure for public money in Indonesia</span>
                    </div>
                    <h1>FundNProof</h1>
                    <p>
                        Every year, more than Rp40 trillion in donations, zakat, and social funds flow through systems that people cannot independently verify.
                        FundNProof answers "Where did my money actually go?" with verifiable proof, not promises.
                    </p>
                </section>

                <section className="landing-clean-section">
                    <div className="landing-clean-heading">
                        <CircleAlert size={18} />
                        <h2>The Problem</h2>
                    </div>
                    <p>
                        Trust in public fund management is fragile. Today, transparency is often claimed, but not proven.
                    </p>
                    <div className="landing-clean-grid two">
                        <article className="card landing-clean-item">
                            <h3>Core pain points</h3>
                            <ul>
                                <li>Donors cannot clearly see how money is used</li>
                                <li>Organizations rely on static reports that are hard to verify</li>
                                <li>Communities depend on trust instead of proof</li>
                                <li>Data can be modified without easy detection</li>
                            </ul>
                        </article>
                        <article className="card landing-clean-item">
                            <h3>Real impact</h3>
                            <ul>
                                <li>Lower donor trust and retention</li>
                                <li>Reduced funding potential</li>
                                <li>More friction in fundraising and reporting</li>
                                <li>Higher audit burden</li>
                            </ul>
                        </article>
                    </div>
                </section>

                <section className="landing-clean-section">
                    <div className="landing-clean-heading">
                        <ShieldCheck size={18} />
                        <h2>The Solution</h2>
                    </div>
                    <p>
                        FundNProof combines ERP-level usability, cryptographic integrity, and Solana anchoring so every transaction is recorded,
                        tamper-evident, and publicly verifiable.
                    </p>
                    <div className="landing-clean-grid two">
                        <article className="card landing-clean-item">
                            <h3>What FundNProof combines</h3>
                            <ul>
                                <li>Financial management for funds, donors, and programs</li>
                                <li>Hash-linked records for tamper-evident integrity</li>
                                <li>On-chain Merkle anchoring on Solana</li>
                            </ul>
                        </article>
                        <article className="card landing-clean-item">
                            <h3>Two-layer trust model</h3>
                            <ul>
                                <li>Off-chain: familiar workflow and operational speed</li>
                                <li>On-chain: immutable proof and independent verification</li>
                                <li>Anyone can verify without trusting internal reports</li>
                            </ul>
                        </article>
                    </div>
                </section>

                <section className="landing-clean-section">
                    <div className="landing-clean-heading">
                        <CheckCircle2 size={18} />
                        <h2>First Use Case: Donation Transparency</h2>
                    </div>
                    <ol className="landing-clean-steps">
                        <li>Donation transaction is stored in the system.</li>
                        <li>Record is hashed and linked to previous entries.</li>
                        <li>Batch is anchored on-chain via Merkle proof.</li>
                        <li>Anyone can verify via app or directly on Solana.</li>
                    </ol>
                </section>

                <section className="landing-clean-section">
                    <div className="landing-clean-heading">
                        <Sparkles size={18} />
                        <h2>Why Indonesia</h2>
                    </div>
                    <div className="card landing-clean-item">
                        <ul>
                            <li>Rp40+ trillion in zakat, infaq, and sadaqah flows annually</li>
                            <li>700+ registered zakat organizations nationwide</li>
                            <li>Tens of millions of active donors</li>
                            <li>No mainstream solution combining ERP usability with verifiable on-chain proof</li>
                        </ul>
                    </div>
                </section>

                <section className="landing-clean-section">
                    <div className="landing-clean-heading">
                        <ShieldCheck size={18} />
                        <h2>How We Address Key Challenges</h2>
                    </div>
                    <div className="landing-clean-grid two">
                        <article className="card landing-clean-item">
                            <h3>Adoption</h3>
                            <p>Familiar dashboard interface. No blockchain expertise required for day-to-day operation.</p>
                        </article>
                        <article className="card landing-clean-item">
                            <h3>Trust</h3>
                            <p>Public ledger and open verification reduce dependency on internal reporting.</p>
                        </article>
                        <article className="card landing-clean-item">
                            <h3>Data Integrity</h3>
                            <p>Hash chaining, audit logs, and role-based controls reduce manipulation risk.</p>
                        </article>
                        <article className="card landing-clean-item">
                            <h3>Cost & Regulation</h3>
                            <p>Phased model lowers entry barriers; platform focuses on verification and reporting transparency.</p>
                        </article>
                    </div>
                </section>

                <section className="card landing-clean-item about-closing">
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
