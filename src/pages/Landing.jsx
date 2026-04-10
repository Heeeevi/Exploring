import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, CircleDot, Sparkles } from 'lucide-react';

const TOKENS = [
    { id: 'cashflow', label: 'DONATION FLOW', kind: 'pill', x: 12, y: 54, rotate: -1, depth: 1.1 },
    { id: 'yield', label: 'HASH PROOF', kind: 'pill', x: 32, y: 55, rotate: 1, depth: 1.3 },
    { id: 'borefi', label: 'MERKLE ROOT', kind: 'pill-tilt', x: 63, y: 52, rotate: -58, depth: 1.8 },
    { id: 'sme', label: 'PUBLIC LEDGER', kind: 'pill', x: 84, y: 61, rotate: 0, depth: 1.2 },
    { id: 'asterisk', label: '*', kind: 'disc', x: 74, y: 62, rotate: 0, depth: 2.1 },
    { id: 'down', label: '↓', kind: 'disc', x: 92, y: 54, rotate: 0, depth: 1.9 },
    { id: 'dot-a', label: '', kind: 'dot', x: 93, y: 18, rotate: 0, depth: 1.1 },
    { id: 'dot-b', label: '', kind: 'dot-half', x: 98, y: 7, rotate: 0, depth: 0.9 }
];

export default function Landing() {
    const arenaRef = useRef(null);
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const ctaRef = useRef(null);
    const [arenaSize, setArenaSize] = useState({ width: 0, height: 0 });
    const [pointer, setPointer] = useState({ x: 0, y: 0, inside: false });
    const [protectedZones, setProtectedZones] = useState([]);
    const [titleTop, setTitleTop] = useState(null);

    useEffect(() => {
        const update = () => {
            if (!arenaRef.current) return;
            const arenaRect = arenaRef.current.getBoundingClientRect();
            setArenaSize({ width: arenaRect.width, height: arenaRect.height });

            const refs = [titleRef, descriptionRef, ctaRef];
            const zones = refs
                .map((ref) => ref.current)
                .filter(Boolean)
                .map((node) => {
                    const r = node.getBoundingClientRect();
                    return {
                        left: r.left - arenaRect.left,
                        right: r.right - arenaRect.left,
                        top: r.top - arenaRect.top,
                        bottom: r.bottom - arenaRect.top
                    };
                });

            setProtectedZones(zones);
            if (zones[0]) {
                setTitleTop(zones[0].top);
            }
        };

        update();
        const raf = requestAnimationFrame(update);
        window.addEventListener('resize', update);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', update);
        };
    }, []);

    const handleMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            inside: true
        });
    };

    const tokenStyles = useMemo(() => {
        return TOKENS.map((token) => {
            if (!arenaSize.width || !arenaSize.height) {
                return {
                    transform: `translate(-50%, -50%) rotate(${token.rotate}deg)`
                };
            }

            const px = (token.x / 100) * arenaSize.width;
            const py = (token.y / 100) * arenaSize.height;
            const isInteractive = pointer.inside;
            const dx = px - pointer.x;
            const dy = py - pointer.y;
            const distance = Math.max(Math.hypot(dx, dy), 1);
            const repelRadius = 240;
            const pull = isInteractive ? Math.max(0, 1 - distance / repelRadius) : 0;
            const repelStrength = 28 * token.depth;

            const tx = (dx / distance) * pull * repelStrength;
            const ty = (dy / distance) * pull * repelStrength;

            const driftX = isInteractive ? ((pointer.x / arenaSize.width) - 0.5) * 12 * token.depth : 0;
            const driftY = isInteractive ? ((pointer.y / arenaSize.height) - 0.5) * 8 * token.depth : 0;

            let nextX = px + tx + driftX;
            let nextY = py + ty + driftY;

            protectedZones.forEach((zone) => {
                const pad = 22;
                const box = {
                    left: zone.left - pad,
                    right: zone.right + pad,
                    top: zone.top - pad,
                    bottom: zone.bottom + pad
                };

                if (nextX > box.left && nextX < box.right && nextY > box.top && nextY < box.bottom) {
                    const distLeft = Math.abs(nextX - box.left);
                    const distRight = Math.abs(box.right - nextX);
                    const distTop = Math.abs(nextY - box.top);
                    const distBottom = Math.abs(box.bottom - nextY);
                    const nearest = Math.min(distLeft, distRight, distTop, distBottom);

                    if (nearest === distLeft) nextX = box.left - 8;
                    else if (nearest === distRight) nextX = box.right + 8;
                    else if (nearest === distTop) nextY = box.top - 8;
                    else nextY = box.bottom + 8;
                }
            });

            const margin = 24;
            const upperBound = titleTop ? Math.max(86, titleTop - 72) : arenaSize.height * 0.42;
            nextX = Math.min(arenaSize.width - margin, Math.max(margin, nextX));
            nextY = Math.min(upperBound, Math.max(margin, nextY));

            const finalTx = nextX - px;
            const finalTy = nextY - py;
            const rotationDelta = isInteractive ? (finalTx * 0.02) + (finalTy * 0.015) : 0;
            const finalRotation = token.rotate + rotationDelta;

            return {
                transform: `translate(-50%, -50%) translate(${finalTx}px, ${finalTy}px) rotate(${finalRotation}deg)`
            };
        });
    }, [arenaSize.height, arenaSize.width, pointer.inside, pointer.x, pointer.y, protectedZones, titleTop]);

    return (
        <div className="landing-page landing-v2">
            <nav className="landing-v2-nav">
                <div className="landing-v2-brand">FUNDNPROOF</div>
                <div className="landing-v2-actions">
                    <Link to="/public" className="btn btn-ghost btn-sm">Public Ledger</Link>
                    <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
                </div>
            </nav>

            <section
                ref={arenaRef}
                className="landing-v2-arena"
                onMouseMove={handleMove}
                onMouseLeave={() => setPointer((prev) => ({ ...prev, inside: false }))}
            >
                <div className="landing-v2-kicker">
                    <span>POWERING PUBLIC TRUST</span>
                    <ArrowUpRight size={18} />
                    <span>Where did my money go? Turn it into proof.</span>
                </div>

                <div
                    className={`landing-v2-cursor ${pointer.inside ? 'is-visible' : ''}`}
                    style={{ left: `${pointer.x}px`, top: `${pointer.y}px` }}
                />

                <div className="landing-v2-orbit">
                    {TOKENS.map((token, index) => (
                        <div key={token.id} className="physics-body" style={{ left: `${token.x}%`, top: `${token.y}%`, ...tokenStyles[index] }}>
                            <div className={`v2-token ${token.kind}`}>
                                {token.id === 'dot-a' && <CircleDot size={14} />}
                                {token.id === 'dot-b' && <span className="v2-half-dot" />}
                                {!token.id.startsWith('dot-') && token.label}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="landing-v2-copy">
                    <h1 ref={titleRef} className="landing-v2-title">
                        <span>FUND</span>
                        <span className="landing-v2-title-n">N</span>
                        <span>PROOF</span>
                    </h1>
                    <p ref={descriptionRef}>
                        Trust infrastructure for public money in Indonesia. Built for funds, donors,
                        and programs that need transparency people can verify, not just trust.
                    </p>
                    <p className="landing-v2-about-link">
                        <Link to="/about">Read the full story and approach →</Link>
                    </p>
                </div>

                <div className="landing-v2-ctas" ref={ctaRef}>
                    <Link to="/public" className="btn btn-primary">
                        <Sparkles size={18} /> Verify Public Ledger
                    </Link>
                    <Link to="/login" className="btn btn-primary">
                        <ArrowDown size={18} /> Enter Dashboard
                    </Link>
                </div>
            </section>
        </div>
    );
}
