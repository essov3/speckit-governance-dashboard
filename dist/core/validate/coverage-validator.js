import { createDiagnostic } from '../diagnostics/warnings.ts';
export function validateCoverage(coverageRows, contractPaths, context) {
    const errors = [];
    const warnings = [];
    for (const row of coverageRows) {
        const isComplete = row.state.toUpperCase().includes('COMPLETE') ||
            row.state.toUpperCase().includes('VERIFIED') ||
            row.state.toUpperCase().includes('PASSED');
        // Error: A coverage row is VERIFIED_COMPLETE without required evidence link
        if (isComplete && (!row.evidenceLinks || row.evidenceLinks.length === 0)) {
            errors.push(createDiagnostic({
                id: 'ERR_COMPLETE_COVERAGE_WITHOUT_EVIDENCE',
                severity: 'error',
                category: 'coverage',
                message: `Coverage row for "${row.capability}" is marked complete/verified, but lacks evidence links.`,
                source: row.source
            }));
        }
        // OAR B specific: FR-018 coverage evidence check
        const isFR018 = row.frReferences.includes('FR-018') ||
            row.frReferences.includes('FR018') ||
            row.capability.toLowerCase().includes('fr-018');
        if (isFR018 && context.projectType === 'oarb-governance') {
            if (isComplete && !row.hasFR018Evidence) {
                errors.push(createDiagnostic({
                    id: 'ERR_OARB_FR018_WITHOUT_EVIDENCE',
                    severity: 'error',
                    category: 'coverage',
                    message: `OAR B Rule: Capability "${row.capability}" (FR-018) is marked complete but is missing required FR-018 coverage evidence.`,
                    source: row.source
                }));
            }
        }
    }
    // Warning: OpenAPI file exists but no coverage row references it
    for (const contractPath of contractPaths) {
        const isOpenApi = contractPath.toLowerCase().includes('openapi');
        if (isOpenApi) {
            // Check if this path is referenced by any coverage row evidence link or contract cell
            const isReferenced = coverageRows.some(row => row.evidenceLinks.some(link => contractPath.includes(link)) ||
                (row.clientContractStatus && row.clientContractStatus.toLowerCase().includes(pathBasename(contractPath))) ||
                (row.adminConsoleStatus && row.adminConsoleStatus.toLowerCase().includes(pathBasename(contractPath))));
            if (!isReferenced) {
                warnings.push(createDiagnostic({
                    id: 'WARN_UNREFERENCED_OPENAPI_CONTRACT',
                    severity: 'warning',
                    category: 'coverage',
                    message: `OpenAPI contract file exists but is not referenced in the product coverage matrix: "${contractPath}"`,
                    source: { path: contractPath }
                }));
            }
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
function pathBasename(p) {
    const parts = p.split(/[/\\]/);
    return parts[parts.length - 1];
}
