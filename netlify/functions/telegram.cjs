/**
 * FundNProof — Telegram verification bot function
 * Routes:
 *   GET  /status
 *   POST /verify
 *   POST /webhook
 */
const { supabase, hasSupabaseConfig } = require('./lib/supabase.cjs');
const blockchain = require('./lib/blockchain.cjs');
const { jsonResponse, handleOptions, parsePath } = require('./lib/helpers.cjs');

let solanaAnchor = null;
function getSolana() {
    if (!solanaAnchor) {
        try {
            solanaAnchor = require('./lib/solana-anchor.cjs');
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

    let localAnchor = null;
    if (hasSupabaseConfig && supabase) {
        const { data } = await supabase
            .from('chain_anchors')
            .select('block_start, block_end')
            .eq('anchor_tx_hash', signature)
            .single();
        localAnchor = data || null;
    }

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
        if (!hasSupabaseConfig || !supabase) {
            return 'Verification backend is not configured yet (Supabase env missing).';
        }
        const txResult = await blockchain.verifyTransaction(parsed.value);
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

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return handleOptions();

    const segments = parsePath(event);
    const method = event.httpMethod;

    try {
        if (method === 'GET' && segments[0] === 'status') {
            return jsonResponse(200, {
                enabled: Boolean(TELEGRAM_BOT_TOKEN),
                hasWebhookSecret: Boolean(TELEGRAM_WEBHOOK_SECRET),
                hasSupabaseConfig,
            });
        }

        if (method === 'POST' && segments[0] === 'verify') {
            const body = event.body ? JSON.parse(event.body) : {};
            const text = await buildReplyForCommand(body?.text || '');
            return jsonResponse(200, { ok: true, text });
        }

        if (method === 'POST' && segments[0] === 'webhook') {
            if (!TELEGRAM_BOT_TOKEN) {
                return jsonResponse(503, { ok: false, error: 'Telegram bot token not configured' });
            }

            if (TELEGRAM_WEBHOOK_SECRET) {
                const provided = event.headers['x-telegram-bot-api-secret-token'] || event.headers['X-Telegram-Bot-Api-Secret-Token'];
                if (!provided || provided !== TELEGRAM_WEBHOOK_SECRET) {
                    return jsonResponse(401, { ok: false, error: 'Invalid Telegram webhook secret' });
                }
            }

            const payload = event.body ? JSON.parse(event.body) : {};
            const msg = payload.message || payload.edited_message;

            if (!msg?.chat?.id) {
                return jsonResponse(200, { ok: true, ignored: true });
            }

            const chatId = msg.chat.id;
            const incomingText = msg.text || '';
            const reply = await buildReplyForCommand(incomingText);

            await sendTelegramMessage(chatId, reply);
            return jsonResponse(200, { ok: true });
        }

        return jsonResponse(404, { error: 'Not found' });
    } catch (err) {
        console.error('Telegram function error:', err);
        return jsonResponse(500, { error: err.message });
    }
};
