const demoFeed = require('./mock-feed.cjs');

function parseConfig(configJson) {
    if (!configJson) return {};
    try {
        return JSON.parse(configJson);
    } catch (_) {
        return {};
    }
}

function normalizeDate(dateStr) {
    return String(dateStr || '').slice(0, 10);
}

async function fetchEntriesForAccount(account, { from, to } = {}) {
    const provider = (account.provider || 'manual').toLowerCase();

    if (provider === 'manual') {
        return { entries: [], provider, source: 'manual' };
    }

    if (provider === 'demo-feed') {
        const cfg = parseConfig(account.provider_config_json);
        const entries = await demoFeed.fetchEntries({
            account,
            from: normalizeDate(from),
            to: normalizeDate(to),
            config: cfg,
        });
        return { entries, provider, source: 'demo-feed' };
    }

    throw new Error(`Unsupported bank provider: ${provider}`);
}

function listSupportedProviders() {
    return [
        {
            key: 'manual',
            name: 'Manual Upload',
            description: 'Import JSON/CSV statement manually.',
            supportsAutoSync: false,
        },
        {
            key: 'demo-feed',
            name: 'Demo Feed (Mock)',
            description: 'Simulated live feed for demo/testing without bank credentials.',
            supportsAutoSync: true,
        },
    ];
}

module.exports = {
    fetchEntriesForAccount,
    listSupportedProviders,
};
