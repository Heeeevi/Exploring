const express = require('express');
const db = require('../db.cjs');
const blockchain = require('../blockchain.cjs');

const router = express.Router();

let solanaAnchor = null;
function getSolana() {
    if (!solanaAnchor) {
        try {
            solanaAnchor = require('../../solana/anchor-service.cjs');
        } catch (_) {
            return null;
        }
    }
    return solanaAnchor;
}

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_WEBHOOK_SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim();

function isSolanaSignature(value) {
    if (!value) return false;
    if (value.includes('-')) return false;
    return /^[1-9A-HJ-NP-Za-km-z]{43,}$/.test(value);
}

function parseCommandText(raw = '') {
    const text = String(raw || '').trim();
    if (!text) return { command: 'HELP' };

    // Telegram deep-link format often comes as: /start VERIFY_TX <id>
    const normalized = text.startsWith('/start ')
        ? text.replace('/start ', '').trim()
        : text;

    const [commandRaw, ...rest] = normalized.split(/\s+/);
    const command = (commandRaw || '').toUpperCase();
    const value = rest.join(' ').trim();

    if (command === 'VERIFY_TX') return { command: 'VERIFY_TX', value };
    if (command === 'VERIFY_SOLANA') return { command: 'VERIFY_SOLANA', value };
    if (command === 'VERIFY') {
        return { command: isSolanaSignature(value) ? 'VERIFY_SOLANA' : 'VERIFY_TX', value };
    }

    return { command: 'HELP' };
}

function helpText() {
    return [
        'FundNProof Verification Bot',
        '',
        'Commands:',
        'VERIFY <transaction_id_or_signature>',
        'VERIFY_TX <transaction_id>',
        'VERIFY_SOLANA <signature>',
        '',
        'Examples:',
        'VERIFY 5f8a0cf5-7db9-43f6-8b3f-7d5f37f8d2a4',
        'VERIFY_SOLANA 4jv1...'
    ].join('\n');
}

function formatTxVerification(txId, result) {
    if (!result?.found) {
        return [
            'Verification result: NOT FOUND',
            `ID: ${txId}`,
            `Reason: ${result?.message || 'Transaction is not present in local ledger.'}`
        ].join('\n');
    }

    const snapshot = result.dataSnapshot || {};
    const amount = Number(snapshot.amount || 0).toLocaleString('en-US');
    const chainLine = result.chainContext?.isGenesisLinked
        ? 'Genesis linked'
        : 'Linked to previous hash';

    return [
        'Verification result: VERIFIED',
        `ID: ${snapshot.txId || txId}`,
        `Type: ${snapshot.type || '-'}`,
        `Amount: ${snapshot.currency || 'USD'} ${amount}`,
        `Chain: ${chainLine}`,
        `Hash: ${String(result.hash || '').slice(0, 16)}...`
    ].join('\n');
}

async function formatSolanaVerification(signature, result) {
    if (!result?.verified) {
        return [
            'Verification result: NOT VERIFIED ON SOLANA',
            `Signature: ${signature}`,
            `Reason: ${result?.error || 'Signature not found or could not be verified.'}`
        ].join('\n');
    }

    const localAnchor = db.prepare('SELECT * FROM chain_anchors WHERE anchor_tx_hash = ?').get(signature);
    const localLine = localAnchor
        ? `Local anchor match: yes (block ${localAnchor.block_start}-${localAnchor.block_end})`
        : 'Local anchor match: not found';

    return [
        'Verification result: VERIFIED ON SOLANA',
        `Signature: ${signature}`,
        `Network: ${result.network || 'devnet'}`,
        `Slot: ${result.slot || '-'}`,
        localLine,
    ].join('\n');
}

async function buildReplyForCommand(rawText) {
    const parsed = parseCommandText(rawText);
    if (parsed.command === 'HELP') return helpText();
    if (!parsed.value) return helpText();

    if (parsed.command === 'VERIFY_TX') {
        const txResult = blockchain.verifyTransaction(parsed.value);
        return formatTxVerification(parsed.value, txResult);
    }

    const solana = getSolana();
    if (!solana) {
        return 'Solana verification is currently unavailable. Please verify transaction ID first.';
    }

    try {
        const solResult = await solana.verifyAnchor(parsed.value);
        return formatSolanaVerification(parsed.value, solResult);
    } catch (err) {
        return [
            'Verification result: ERROR',
            `Signature: ${parsed.value}`,
            `Reason: ${err.message}`
        ].join('\n');
    }
}

async function sendTelegramMessage(chatId, text) {
    if (!TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
        }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
        throw new Error(data.description || `Telegram API error (${res.status})`);
    }
}

// GET /api/telegram/status
router.get('/status', (req, res) => {
    res.json({
        enabled: Boolean(TELEGRAM_BOT_TOKEN),
        hasWebhookSecret: Boolean(TELEGRAM_WEBHOOK_SECRET),
    });
});

// POST /api/telegram/verify (manual endpoint for testing)
router.post('/verify', async (req, res) => {
    try {
        const text = await buildReplyForCommand(req.body?.text || '');
        res.json({ ok: true, text });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

// POST /api/telegram/webhook (Telegram webhook callback)
router.post('/webhook', async (req, res) => {
    try {
        if (!TELEGRAM_BOT_TOKEN) {
            return res.status(503).json({ ok: false, error: 'Telegram bot token not configured' });
        }

        if (TELEGRAM_WEBHOOK_SECRET) {
            const provided = req.headers['x-telegram-bot-api-secret-token'];
            if (!provided || provided !== TELEGRAM_WEBHOOK_SECRET) {
                return res.status(401).json({ ok: false, error: 'Invalid Telegram webhook secret' });
            }
        }

        const update = req.body || {};
        const msg = update.message || update.edited_message;

        if (!msg?.chat?.id) {
            return res.json({ ok: true, ignored: true });
        }

        const chatId = msg.chat.id;
        const incomingText = msg.text || '';
        const reply = await buildReplyForCommand(incomingText);

        await sendTelegramMessage(chatId, reply);
        return res.json({ ok: true });
    } catch (err) {
        console.error('Telegram webhook error:', err);
        return res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
