function toDate(value) {
    const d = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return null;
    return d;
}

function formatDate(d) {
    return d.toISOString().slice(0, 10);
}

function* dateRange(startDate, endDate) {
    const current = new Date(startDate);
    while (current <= endDate) {
        yield new Date(current);
        current.setUTCDate(current.getUTCDate() + 1);
    }
}

// Deterministic pseudo-random generator from date string.
function hashSeed(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
}

function generateAmount(seed, min, max) {
    const x = (Math.sin(seed) + 1) / 2;
    return Math.round((min + (max - min) * x) * 100) / 100;
}

async function fetchEntries({ account, from, to, config = {} }) {
    const start = toDate(from);
    const end = toDate(to);
    if (!start || !end || end < start) {
        throw new Error('Invalid date range for demo feed');
    }

    const prefix = config.referencePrefix || 'DEMO';
    const entries = [];

    for (const day of dateRange(start, end)) {
        const dateStr = formatDate(day);
        const seedBase = hashSeed(`${account.id}:${dateStr}`);

        // Daily credit simulation.
        const credit = generateAmount(seedBase + 11, 80, 950);
        entries.push({
            entry_date: dateStr,
            amount: credit,
            direction: 'credit',
            description: `Demo inflow ${dateStr}`,
            external_ref: `${prefix}-CR-${dateStr.replace(/-/g, '')}`,
        });

        // Expense every other day.
        if (day.getUTCDate() % 2 === 0) {
            const debit = generateAmount(seedBase + 29, 35, 620);
            entries.push({
                entry_date: dateStr,
                amount: debit,
                direction: 'debit',
                description: `Demo outflow ${dateStr}`,
                external_ref: `${prefix}-DB-${dateStr.replace(/-/g, '')}`,
            });
        }
    }

    return entries;
}

module.exports = { fetchEntries };
