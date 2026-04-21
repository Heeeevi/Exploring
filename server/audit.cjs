const crypto = require('crypto');
const db = require('./db.cjs');

const AUDIT_GENESIS_HASH = 'AUDIT_GENESIS_0000000000000000000000000000000000000000000000000000';

function toSafeJson(value) {
    try {
        return JSON.stringify(value ?? null);
    } catch (_) {
        return JSON.stringify({ serializationError: true });
    }
}

function getLastAuditHash() {
    const row = db.prepare('SELECT event_hash FROM audit_events ORDER BY id DESC LIMIT 1').get();
    return row ? row.event_hash : AUDIT_GENESIS_HASH;
}

function computeAuditHash(payloadObj, prevHash) {
    const payload = toSafeJson(payloadObj);
    return crypto.createHash('sha256').update(`${prevHash}:${payload}`).digest('hex');
}

function appendAuditEvent({ actorId, actorName, action, entityType, entityId, details, before = null, after = null, meta = null }) {
    const occurredAt = new Date().toISOString();
    const detailsText = typeof details === 'string' ? details : toSafeJson(details);

    // Keep existing dashboard-visible activity log table.
    db.prepare('INSERT INTO activity_log (user_id, user_name, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)')
        .run(actorId || null, actorName || 'system', action, entityType || null, entityId || null, detailsText);

    // Append immutable audit chain event.
    const prevHash = getLastAuditHash();
    const payloadObj = {
        actorId: actorId || null,
        actorName: actorName || 'system',
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        details: detailsText,
        before,
        after,
        meta,
        occurredAt,
    };

    const eventHash = computeAuditHash(payloadObj, prevHash);

    db.prepare(`
        INSERT INTO audit_events (actor_id, actor_name, action, entity_type, entity_id, payload_json, prev_hash, event_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        actorId || null,
        actorName || 'system',
        action,
        entityType || null,
        entityId || null,
        toSafeJson(payloadObj),
        prevHash,
        eventHash,
        occurredAt
    );

    return { eventHash, prevHash, occurredAt };
}

function verifyAuditChain() {
    const rows = db.prepare('SELECT id, payload_json, prev_hash, event_hash, created_at FROM audit_events ORDER BY id ASC').all();

    if (rows.length === 0) {
        return { valid: true, totalEvents: 0, message: 'No audit events yet' };
    }

    let expectedPrevHash = AUDIT_GENESIS_HASH;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (row.prev_hash !== expectedPrevHash) {
            return {
                valid: false,
                totalEvents: rows.length,
                brokenAt: row.id,
                message: `Audit chain broken at event ${row.id}: prev_hash mismatch`,
            };
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(row.payload_json);
        } catch (_) {
            return {
                valid: false,
                totalEvents: rows.length,
                brokenAt: row.id,
                message: `Audit payload is corrupted at event ${row.id}`,
            };
        }

        const recomputed = computeAuditHash(parsedPayload, row.prev_hash);
        if (recomputed !== row.event_hash) {
            return {
                valid: false,
                totalEvents: rows.length,
                brokenAt: row.id,
                message: `Audit hash mismatch at event ${row.id}`,
            };
        }

        expectedPrevHash = row.event_hash;
    }

    return {
        valid: true,
        totalEvents: rows.length,
        firstHash: rows[0].event_hash,
        lastHash: rows[rows.length - 1].event_hash,
        lastTimestamp: rows[rows.length - 1].created_at,
        message: `Audit chain intact: ${rows.length} events verified`,
    };
}

module.exports = {
    appendAuditEvent,
    verifyAuditChain,
    AUDIT_GENESIS_HASH,
};
