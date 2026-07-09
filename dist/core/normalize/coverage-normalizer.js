/**
 * Normalizes and deduplicates product coverage matrix rows.
 */
export function normalizeCoverage(parsedCoverage, matrixPath) {
    const result = [];
    for (const c of parsedCoverage) {
        result.push({
            capability: c.capability,
            state: c.state || 'UNKNOWN',
            responsibleChild: c.responsibleChild,
            gate: c.gate,
            clientContractStatus: c.clientContractStatus,
            adminConsoleStatus: c.adminConsoleStatus,
            evidenceLinks: c.evidenceLinks || [],
            frReferences: c.frReferences || [],
            hasFR018Evidence: !!c.hasFR018Evidence,
            source: {
                path: matrixPath,
                lineStart: c.lineStart
            }
        });
    }
    return result;
}
