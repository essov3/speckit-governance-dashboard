import { Gate } from '../normalize/gate-normalizer.ts';
import { Feature } from '../normalize/feature-normalizer.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';
import { ValidationContext, ValidationResult } from './validator-types.ts';

export function validateGates(
  gates: Gate[],
  features: Feature[],
  isEngineCompleteDeclared: boolean,
  context: ValidationContext
): ValidationResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  for (const g of gates) {
    const isClosed = g.status === 'CLOSED' || g.status === 'COMPLETE' || g.status === 'VERIFIED';
    
    // Check if gate is closed but has missing or unverified children
    if (isClosed) {
      const unverifiedChildren: number[] = [];
      
      for (const childId of g.requiredChildren) {
        const feat = features.find(f => f.number === childId);
        // A child is missing if the feature directory doesn't exist, or it is not Verified/Approved/Closed
        const isVerified = feat && (feat.lifecycle === 'Verified' || feat.lifecycle === 'Approved');
        if (!isVerified) {
          unverifiedChildren.push(childId);
        }
      }

      if (unverifiedChildren.length > 0) {
        errors.push(
          createDiagnostic({
            id: 'ERR_CLOSED_GATE_UNVERIFIED_CHILDREN',
            severity: 'error',
            category: 'gate',
            message: `Gate ${g.gateId} is marked CLOSED/COMPLETE, but has unverified child features: ${unverifiedChildren.join(', ')}`,
            source: g.source
          })
        );
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
      if (context.strict) errors.push(diag);
      else warnings.push(diag);
    }
  }

  // A declared lifecycle completion cannot coexist with open blockers in the first gate.
  if (context.projectType === 'governance-speckit' && isEngineCompleteDeclared) {
    const p1Gate = gates.find(g => g.gateId === 'P1');
    const p1Blockers = p1Gate ? p1Gate.openBlockers : [];
    
    if (p1Blockers && p1Blockers.length > 0) {
      errors.push(
        createDiagnostic({
          id: 'ERR_LIFECYCLE_COMPLETE_WITH_OPEN_BLOCKERS',
          severity: 'error',
          category: 'gate',
          message: `A lifecycle completion is declared, but P1 blockers remain: ${p1Blockers.join('; ')}`,
          source: p1Gate ? p1Gate.source : { path: '' }
        })
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
