/**
 * Bank Connectors — Provider Registry
 * 
 * Currently supports manual CSV/JSON statement import only.
 * Planned: Open Banking API integration (Brick/Finantier) for
 * automated bank feed from Indonesian banks (BCA, BRI, Mandiri, etc.)
 */

function listSupportedProviders() {
    return [
        {
            key: 'manual',
            name: 'Manual Import (CSV/JSON)',
            description: 'Import bank statement data via CSV or JSON paste. Export from your internet banking portal.',
            supportsAutoSync: false,
        },
    ];
}

module.exports = {
    listSupportedProviders,
};
