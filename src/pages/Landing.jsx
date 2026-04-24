import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sun, Moon } from 'lucide-react';

export default function Landing({ toggleTheme }) {
    const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

    useEffect(() => {
        const obs = new MutationObserver(() => {
            setTheme(document.documentElement.getAttribute('data-theme') || 'light');
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);

    // Canvas Rays Effect
    useEffect(() => {
        const canvas = document.getElementById('rays-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const drawRays = () => {
            const width = canvas.width;
            const height = canvas.height;
            const cx = width / 2;
            const cy = height / 2;
            
            ctx.clearRect(0, 0, width, height);
            
            const time = Date.now() * 0.0005;
            const numRays = 24;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(time * 0.1);
            
            for (let i = 0; i < numRays; i++) {
                const angle = (i * Math.PI * 2) / numRays;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                
                // create a subtle gradient for each ray
                const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * width, Math.sin(angle) * width);
                gradient.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                
                ctx.arc(0, 0, width, angle, angle + 0.1);
                ctx.lineTo(0, 0);
                ctx.fill();
            }
            ctx.restore();
            
            animationFrameId = requestAnimationFrame(drawRays);
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            drawRays();
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    const words = ["cheaper.", "trustless.", "immutable.", "verified.", "collaborative.", "global.", "better."];
    const [activeWordIndex, setActiveWordIndex] = useState(0);
    const listRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!listRef.current) return;
            const listItems = listRef.current.children;
            // The sticky element is at top: 40vh, so we want the word closest to 40% of viewport height
            const targetY = window.innerHeight * 0.4;

            let closestIndex = 0;
            let minDistance = Infinity;

            for (let i = 0; i < listItems.length; i++) {
                const rect = listItems[i].getBoundingClientRect();
                const itemCenter = rect.top + rect.height / 2;
                const distance = Math.abs(targetY - itemCenter);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = i;
                }
            }
            setActiveWordIndex(closestIndex);
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [openFaq, setOpenFaq] = useState(null);

    const faqs = [
        {
            q: "Bagaimana cara kerja verifikasi FundNProof?",
            a: "Semua transaksi yang dicatat akan di-hash secara kriptografis dan dikelompokkan ke dalam Merkle Tree. Root hash dari pohon ini kemudian dipublikasikan ke jaringan Solana, memastikan bahwa data historis tidak dapat diubah tanpa terdeteksi."
        },
        {
            q: "Apakah saya harus mengerti Crypto/Blockchain?",
            a: "Tidak. FundNProof dirancang seperti ERP (Enterprise Resource Planning) pada umumnya. Operator Anda hanya perlu melakukan input data seperti biasa, dan sistem kami yang akan menangani kompleksitas blockchain di latar belakang."
        },
        {
            q: "Kenapa menggunakan Solana?",
            a: "Solana menawarkan kombinasi kecepatan (throughput tinggi) dan biaya transaksi yang sangat rendah, sehingga ideal untuk memverifikasi ribuan transaksi mikro (seperti donasi atau operasional harian) tanpa membebani biaya operasional."
        }
    ];

    return (
        <div style={{backgroundColor: 'var(--bg-primary)', minHeight: '100vh', position: 'relative'}}>
            {/* Floating Navbar */}
            <div className="fronsciers-nav-wrapper">
                <nav className="fronsciers-nav">
                    <Link to="/" className="landing-v2-brand" style={{display: 'flex', alignItems: 'center', marginLeft: 16, fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', textDecoration: 'none'}}>
                        <img src="/FNP Logo.png" alt="FundNProof logo" style={{width:30, height:30, objectFit:'contain', marginRight: 8, background: 'var(--bg-card)', borderRadius: 10, padding: 3, border: '1px solid var(--border-color)'}} />
                        FUNDNPROOF
                    </Link>
                    <div className="landing-v2-actions" style={{display: 'flex', gap: 16, alignItems: 'center', marginRight: 16}}>
                        <Link to="/public" className="btn btn-ghost btn-sm text-muted-foreground">Public Ledger</Link>
                        <button type="button" className="btn btn-ghost btn-sm theme-toggle text-muted-foreground" onClick={toggleTheme}>
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                        </button>
                        <Link to="/login" className="btn btn-secondary btn-sm" style={{borderRadius: 9999}}>Sign In</Link>
                    </div>
                </nav>
            </div>

            {/* Hero Section */}
            <section style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', inset: 0, zIndex: 0}}>
                    <canvas id="rays-canvas" style={{width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none'}}></canvas>
                </div>
                
                <div style={{position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '0 20px'}}>
                    <p className="uppercase-kicker text-muted-foreground tracking-widest fade-up" style={{marginBottom: 16}}>
                        Blockchain-Powered Transparency
                    </p>
                    <h1 className="tracking-tight fade-up delay-100" style={{fontSize: '4rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1}}>
                        Open, Verifiable, On-Chain
                    </h1>
                    <p className="text-muted-foreground fade-up delay-200" style={{fontSize: '1.125rem', marginTop: 24, maxWidth: 700, margin: '24px auto 0', lineHeight: 1.6}}>
                        Trust infrastructure for public money in Indonesia. Built for funds, donors, and programs that need transparency people can verify, not just trust.
                    </p>
                    
                    <div className="fade-up delay-300" style={{marginTop: 40, display: 'flex', justifyContent: 'center'}}>
                        <Link to="/public" className="learn-more-btn" style={{textDecoration: 'none'}}>
                            <span className="circle"></span>
                            <ArrowRight className="icon-default" />
                            <ArrowRight className="icon-hover" />
                            <span className="button-text" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '2.5rem'}}>
                                Verify Public Ledger
                            </span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Overview Section */}
            <div style={{maxWidth: 900, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10}}>
                <div className="h-px w-full" style={{background: 'var(--border-color)', marginBottom: '4rem'}}></div>
                <div style={{padding: '3rem 0 6rem'}}>
                    <p className="text-muted-foreground fade-up" style={{fontSize: '1.25rem', textAlign: 'center', lineHeight: 1.6}}>
                        Every year, more than Rp40 trillion in donations, zakat, and social funds flow through systems that people cannot independently verify. FundNProof answers "Where did my money actually go?" with verifiable proof, not promises.
                    </p>
                    <div style={{textAlign: 'center', marginTop: 32}} className="fade-up delay-100">
                        <Link to="/about" style={{color: 'var(--text-accent)', textDecoration: 'none', fontWeight: 500}}>Read the full story and approach →</Link>
                    </div>
                </div>
            </div>

            {/* Features Block */}
            <section className="fronsciers-features-bg fade-up" style={{marginBottom: '2rem', position: 'relative', zIndex: 10}}>
                <div style={{padding: '6rem 2rem', maxWidth: '80rem', margin: '0 auto'}}>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                        <div style={{flex: '1 1 400px', position: 'sticky', top: 120}}>
                            <h2 className="tracking-tight" style={{fontSize: '2.5rem', fontWeight: 600, marginBottom: 16}}>How FundNProof Works</h2>
                            <p style={{fontSize: '1.25rem', opacity: 0.8, lineHeight: 1.6}}>
                                Experience the future of public fund management with our comprehensive platform designed for organizations who demand transparency.
                            </p>
                        </div>
                        
                        <div style={{flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '3rem'}}>
                            <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                <div style={{fontSize: '2.5rem', lineHeight: 1}}>⚡️</div>
                                <div style={{flex: 1}}>
                                    <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Familiar Dashboard</h3>
                                    <p style={{opacity: 0.8}}>Transactions are recorded in a familiar operational dashboard without needing crypto knowledge.</p>
                                    <div style={{height: 1, background: 'rgba(255,255,255,0.2)', marginTop: 24}}></div>
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                <div style={{fontSize: '2.5rem', lineHeight: 1}}>🔒</div>
                                <div style={{flex: 1}}>
                                    <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Cryptographic Proof</h3>
                                    <p style={{opacity: 0.8}}>Each record is hashed and linked, making silent edits detectable.</p>
                                    <div style={{height: 1, background: 'rgba(255,255,255,0.2)', marginTop: 24}}></div>
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '1.5rem', alignItems: 'flex-start'}}>
                                <div style={{fontSize: '2.5rem', lineHeight: 1}}>🌍</div>
                                <div style={{flex: 1}}>
                                    <h3 className="tracking-tight" style={{fontSize: '1.25rem', fontWeight: 600, marginBottom: 8}}>Public Verification</h3>
                                    <p style={{opacity: 0.8}}>Batches are anchored to Solana. Public verification can be done without trusting internal claims.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sticky Scroll Text Section */}
            <div style={{backgroundColor: 'var(--bg-primary)', zIndex: 30, position: 'relative', paddingBottom: '3rem'}}>
                <div style={{width: '100%', paddingTop: '4rem', marginBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem'}}>
                    <h1 style={{textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)', fontSize: '3rem'}} className="tracking-tight md:text-6xl">
                        With FundNProof,
                    </h1>
                </div>
                <main style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                    <section style={{display: 'flex', alignItems: 'flex-start', lineHeight: 1.25, width: '90%', justifyContent: 'center', paddingBottom: '4rem'}}>
                        <h2 className="tracking-tight" style={{fontSize: '2rem', position: 'sticky', top: '40vh', margin: 0, display: 'inline-block', height: 'fit-content', fontWeight: 600}}>
                            <span style={{color: 'var(--text-primary)', marginRight: '0.5rem', whiteSpace: 'nowrap'}}>
                                transparency is&nbsp;
                            </span>
                        </h2>
                        <ul ref={listRef} style={{fontWeight: 600, padding: 0, margin: 0, listStyleType: 'none'}}>
                            {words.map((word, i) => (
                                <li key={i} className="tracking-tight" style={{
                                    fontSize: '2rem', 
                                    fontWeight: 600, 
                                    opacity: activeWordIndex === i ? 1 : 0.2, 
                                    transition: 'opacity 0.3s ease',
                                    color: 'var(--text-primary)',
                                    marginBottom: i === words.length - 1 ? 0 : '1.5rem'
                                }}>
                                    {word}
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>

            {/* Marquee Section */}
            <section style={{margin: '2rem 0 6rem 0', overflow: 'hidden'}} className="fade-up">
                <div className="custom-scroll-text-container">
                    <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                    <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                    <div className="custom-scroll-text">Ready to Verify the Future?&nbsp;</div>
                </div>
            </section>

            {/* FAQ Section */}
            <section style={{paddingBottom: '8rem', maxWidth: '80rem', margin: '0 auto', padding: '0 2rem'}} className="fade-up">
                <div className="h-px w-full" style={{background: 'var(--border-color)', marginBottom: '4rem'}}></div>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '4rem', alignItems: 'flex-start'}}>
                    <div style={{flex: '1 1 400px', position: 'sticky', top: 120}}>
                        <h2 className="tracking-tight" style={{fontSize: '2.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24}}>
                            Got Questions?<br/>We've Got Answers.
                        </h2>
                        <p className="text-muted-foreground" style={{fontSize: '1.125rem', lineHeight: 1.6}}>
                            Find answers to common questions about FundNProof and how our decentralized transparency platform revolutionizes public trust.
                        </p>
                    </div>
                    
                    <div style={{flex: '1 1 500px'}}>
                        {faqs.map((item, i) => (
                            <div key={i} className="fronsciers-faq-group">
                                <button className="fronsciers-faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    <span>{item.q}</span>
                                    <div style={{width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0}}>
                                        <div style={{width: 16, height: 2, background: 'var(--text-primary)'}}></div>
                                        <div style={{width: 2, height: 16, background: 'var(--text-primary)', position: 'absolute', transform: openFaq === i ? 'rotate(90deg)' : 'rotate(0deg)', opacity: openFaq === i ? 0 : 1, transition: 'all 0.3s'}}></div>
                                    </div>
                                </button>
                                <div className={`fronsciers-faq-content ${openFaq === i ? 'is-open' : ''}`}>
                                    <p className="text-muted-foreground" style={{paddingRight: '2rem', lineHeight: 1.6}}>{item.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{paddingBottom: '2rem', marginTop: '4rem'}}>
                <div style={{backgroundColor: 'var(--bg-card)', borderRadius: '1.5rem 1.5rem 0 0', overflow: 'hidden', margin: '0 1rem', padding: '4rem 1.5rem', textAlign: 'center'}}>
                    <div style={{maxWidth: '48rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'}}>
                        <img src="/FNP Logo.png" alt="FundNProof Logo" style={{width: '3rem', height: '3rem', objectFit: 'contain', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: '0.5rem'}} />
                        <h3 className="tracking-tight" style={{fontSize: '1.5rem', fontWeight: 600}}>
                            Start Verifying with FundNProof
                        </h3>
                        <p className="text-muted-foreground" style={{fontSize: '1.125rem'}}>
                            Join the movement towards absolute transparency in public fund management.
                        </p>
                        <div style={{marginTop: '2rem'}}>
                            <Link to="/public" className="btn btn-primary" style={{borderRadius: 9999, padding: '0.75rem 2rem'}}>
                                Buka Public Ledger
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
