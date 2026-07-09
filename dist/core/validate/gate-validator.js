import { createDiagnostic } from '../diagnostics/warnings.ts';
export function validateGates(gates, features, isEngineCompleteDeclared, context) {
    const errors = [];
    const warnings = [];
    for (const g of gates) {
        const isClosed = g.status === 'CLOSED' || g.status === 'COMPLETE' || g.status === 'VERIFIED';
        // Check if gate is closed but has missing or unverified children
        if (isClosed) {
            const unverifiedChildren = [];
            for (const childId of g.requiredChildren) {
                const feat = features.find(f => f.number === childId);
                // A child is missing if the feature directory doesn't exist, or it is not Verified/Approved/Closed
                const isVerified = feat && (feat.lifecycle === 'Verified' || feat.lifecycle === 'Approved');
                if (!isVerified) {
                    unverifiedChildren.push(childId);
                }
            }
            if (unverifiedChildren.length > 0) {
                errors.push(createDiagnostic({
                    id: 'ERR_CLOSED_GATE_UNVERIFIED_CHILDREN',
                    severity: 'error',
                    category: 'gate',
                    message: `Gate ${g.gateId} is marked CLOSED/COMPLETE, but has unverified child features: ${unverifiedChildren.join(', ')}`,
                    source: g.source
                }));
            }
        }
        // Check for ambiguous closed gate parsing
        // E.g. status contains weird text or status is not OPEN/CLOSED/PENDING/BLOCKED
        const canonicalStatuses = ['OPEN', 'CLOSED', 'PENDING', 'BLOCKED', 'COMPLETE', 'VERIFIED'];
        if (!canonicalStatuses.includes(g.status)) {
            const diag = createDiagnostic({
                id: 'ERR_AMBIGUOUS_GATE_STATUS',
                severity: context.strict ? 'error' : 'warning',
                category: 'gate',
                message: `Gate ${g.gateId} has ambiguous or non-canonical status: "${g.status}"`,
                source: g.source
            });
            if (context.strict)
                errors.push(diag);
            else
                warnings.push(diag);
        }
    }
    // OAR B specific: ENGINE_COMPLETE declared while P1 blockers remain
    if (context.projectType === 'oarb-governance' && isEngineCompleteDeclared) {
        const p1Gate = gates.find(g => g.gateId === 'P1');
        const p1Blockers = p1Gate ? p1Gate.openBlockers : [];
        if (p1Blockers && p1Blockers.length > 0) {
            errors.push(createDiagnostic({
                id: 'ERR_ENGINE_COMPLETE_WITH_P1_BLOCKERS',
                severity: 'error',
                category: 'gate',
                message: `ENGINE_COMPLETE is declared, but P1 blockers remain: ${p1Blockers.join('; ')}`,
                source: p1Gate ? p1Gate.source : { path: '' }
            }));
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
