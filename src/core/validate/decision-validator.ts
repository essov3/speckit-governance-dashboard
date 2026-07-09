import { Decision } from '../normalize/decision-normalizer.ts';
import { Gate } from '../normalize/gate-normalizer.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';
import { ValidationContext, ValidationResult } from './validator-types.ts';

export function validateDecisions(
  decisions: Decision[],
  gates: Gate[],
  context: ValidationContext
): ValidationResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  const terminalStatuses = ['RESOLVED', 'ACCEPTED', 'REJECTED', 'DEFAULTED', 'CLOSED', 'COMPLETE'];

  for (const d of decisions) {
    const isPending = d.status === 'PENDING';

    // Warning: Decision has deadline but no status
    if (d.deadline && !d.status) {
      warnings.push(
        createDiagnostic({
          id: 'WARN_DECISION_DEADLINE_WITHOUT_STATUS',
          severity: 'warning',
          category: 'decision',
          message: `Decision ${d.decisionId} has a deadline (${d.deadline}) but lacks a clear status.`,
          source: d.source
        })
      );
    }

    // Error: A decision is treated as resolved but its decision record still says PENDING.
    // How do we detect it's "treated as resolved"?
    // If a gate requiring this decision is CLOSED, then the decision is treated as resolved.
    if (isPending) {
      // Find if any closed/complete gate requires this decision
      for (const g of gates) {
        const isGateClosed = g.status === 'CLOSED' || g.status === 'COMPLETE' || g.status === 'VERIFIED';
        if (isGateClosed && g.requiredDecisions?.includes(d.decisionId)) {
          errors.push(
            createDiagnostic({
              id: 'ERR_PENDING_DECISION_IN_CLOSED_GATE',
              severity: 'error',
              category: 'decision',
              message: `Gate ${g.gateId} is CLOSED, but decision ${d.decisionId} required by this gate is still PENDING.`,
              source: d.source,
              relatedSources: [g.source]
            })
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
