import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, CircleDot, Sparkles } from 'lucide-react';

const TOKENS = [
    { id: 'cashflow', label: 'DONATION FLOW', kind: 'pill', x: 14, y: 32, rotate: 0, depth: 1.1 },
    { id: 'yield', label: 'HASH PROOF', kind: 'pill', x: 35, y: 32, rotate: 0, depth: 1.3 },
    { id: 'borefi', label: 'MERKLE ROOT', kind: 'pill', x: 56, y: 32, rotate: 0, depth: 1.5 },
    { id: 'sme', label: 'PUBLIC LEDGER', kind: 'pill', x: 77, y: 32, rotate: 0, depth: 1.2 },
    { id: 'asterisk', label: '*', kind: 'disc', x: 86, y: 32, rotate: 0, depth: 2.0 },
    { id: 'down', label: '↓', kind: 'disc', x: 94, y: 32, rotate: 0, depth: 1.8 },
    { id: 'dot-a', label: '', kind: 'dot', x: 93, y: 15, rotate: 0, depth: 1.1 },
    { id: 'dot-b', label: '', kind: 'dot-half', x: 98, y: 8, rotate: 0, depth: 0.9 }
];

export default function Landing() {
    const arenaRef = useRef(null);
    const titleRef = useRef(null);
    const descriptionRef = useRef(null);
    const ctaRef = useRef(null);
    const [tokens, setTokens] = useState(() => TOKENS);
    const [arenaSize, setArenaSize] = useState({ width: 0, height: 0 });
    const [pointer, setPointer] = useState({ x: 0, y: 0, inside: false });
    const [protectedZones, setProtectedZones] = useState([]);
    const [titleTop, setTitleTop] = useState(null);
    const [draggingTokenId, setDraggingTokenId] = useState(null);

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
        if (draggingTokenId) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            inside: true
        });
    };

    const handleTokenPointerDown = (event, tokenId) => {
        event.preventDefault();
        event.stopPropagation();

        const rect = arenaRef.current?.getBoundingClientRect();
        if (!rect) return;

        setPointer({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            inside: true
        });
        setDraggingTokenId(tokenId);
    };

    useEffect(() => {
        if (!draggingTokenId) return;

        const handleWindowMove = (event) => {
            const rect = arenaRef.current?.getBoundingClientRect();
            if (!rect) return;

            const rawX = event.clientX - rect.left;
            const rawY = event.clientY - rect.top;
            const upperBound = titleTop ? Math.max(86, titleTop - 72) : rect.height * 0.42;
            const margin = 24;

            const clampX = Math.min(rect.width - margin, Math.max(margin, rawX));
            const clampY = Math.min(upperBound, Math.max(margin, rawY));

            setPointer({ x: clampX, y: clampY, inside: true });

            setTokens((prev) => prev.map((token) => {
                if (token.id !== draggingTokenId) return token;

                const nextX = (clampX / rect.width) * 100;
                const nextY = (clampY / rect.height) * 100;
                const rotationDelta = ((clampX / rect.width) - 0.5) * 18 + ((clampY / rect.height) - 0.5) * 10;

                return {
                    ...token,
                    x: nextX,
                    y: nextY,
                    rotate: token.rotate + rotationDelta * 0.02
                };
            }));
        };

        const handleWindowUp = () => setDraggingTokenId(null);

        window.addEventListener('pointermove', handleWindowMove);
        window.addEventListener('pointerup', handleWindowUp);
        window.addEventListener('pointercancel', handleWindowUp);

        return () => {
            window.removeEventListener('pointermove', handleWindowMove);
            window.removeEventListener('pointerup', handleWindowUp);
            window.removeEventListener('pointercancel', handleWindowUp);
        };
    }, [draggingTokenId, titleTop]);

    const tokenStyles = useMemo(() => {
        return tokens.map((token) => {
            if (!arenaSize.width || !arenaSize.height) {
                return {
                    transform: `translate(-50%, -50%) rotate(${token.rotate}deg)`
                };
            }

            if (token.id === draggingTokenId) {
                return {
                    transform: `translate(-50%, -50%) rotate(${token.rotate}deg)`,
                    zIndex: 12,
                    cursor: 'grabbing'
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
                transform: `translate(-50%, -50%) translate(${finalTx}px, ${finalTy}px) rotate(${finalRotation}deg)`,
                cursor: 'grab'
            };
        });
    }, [arenaSize.height, arenaSize.width, pointer.inside, pointer.x, pointer.y, protectedZones, titleTop, tokens, draggingTokenId]);

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
                    {tokens.map((token, index) => (
                        <div
                            key={token.id}
                            className={`physics-body ${draggingTokenId === token.id ? 'is-dragging' : ''}`}
                            style={{ left: `${token.x}%`, top: `${token.y}%`, ...tokenStyles[index] }}
                            onPointerDown={(event) => handleTokenPointerDown(event, token.id)}
                        >
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
