/**
 * Aggregates, normalizes, and sorts gates in standard P0-P4 order.
 */
export function normalizeGates(parsedGates, ledgerPath) {
    const gateMap = new Map();
    for (const g of parsedGates) {
        const existing = gateMap.get(g.gateId);
        const merged = {
            gateId: g.gateId,
            title: g.title || existing?.title || `Gate ${g.gateId}`,
            status: g.status || existing?.status || 'OPEN',
            requiredChildren: Array.from(new Set([...(existing?.requiredChildren || []), ...(g.requiredChildren || [])])),
            verifiedChildren: Array.from(new Set([...(existing?.verifiedChildren || []), ...(g.verifiedChildren || [])])),
            missingChildren: Array.from(new Set([...(existing?.missingChildren || []), ...(g.missingChildren || [])])),
            requiredDecisions: Array.from(new Set([...(existing?.requiredDecisions || []), ...(g.requiredDecisions || [])])),
            blockingEvidence: Array.from(new Set([...(existing?.blockingEvidence || []), ...(g.blockingEvidence || [])])),
            openBlockers: Array.from(new Set([...(existing?.openBlockers || []), ...(g.openBlockers || [])])),
            source: {
                path: ledgerPath,
                lineStart: g.lineStart || existing?.source.lineStart
            }
        };
        gateMap.set(g.gateId, merged);
    }
    // Ensure all standard gates P0-P4 are represented
    const standardGates = ['P0', 'P1', 'P2', 'P3', 'P4'];
    for (const gId of standardGates) {
        if (!gateMap.has(gId)) {
            gateMap.set(gId, {
                gateId: gId,
                title: gId === 'P0' ? 'Setup' : gId === 'P1' ? 'Engine Complete' : gId === 'P2' ? 'Product Ready' : gId === 'P3' ? 'Hardening' : 'Release',
                status: gId === 'P0' ? 'CLOSED' : 'OPEN', // P0 default is closed as per guardrails
                requiredChildren: [],
                verifiedChildren: [],
                missingChildren: [],
                requiredDecisions: [],
                blockingEvidence: [],
                openBlockers: [],
                source: { path: ledgerPath }
            });
        }
    }
    const result = Array.from(gateMap.values());
    // Sort gates by P0, P1, P2, P3, P4
    return result.sort((a, b) => a.gateId.localeCompare(b.gateId));
}
