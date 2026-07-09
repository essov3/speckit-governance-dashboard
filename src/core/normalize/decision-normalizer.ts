import { DecisionFragment } from '../adapters/adapter-types.ts';

export interface Decision {
  decisionId: string;
  featureNumber?: number;
  title: string;
  owner?: string;
  deadline?: string;
  status: string;
  currentDecision?: string;
  defaultOutcome?: string;
  consequence?: string;
  blockingImpact?: string;
  source: {
    path: string;
    lineStart?: number;
  };
}

/**
 * Normalizes and sorts decisions.
 */
export function normalizeDecisions(
  parsedDecisions: DecisionFragment[],
  pathMap: Map<string, string> // maps decisionId to file path
): Decision[] {
  const normalizedMap = new Map<string, Decision>();

  for (const d of parsedDecisions) {
    const filePath = pathMap.get(d.decisionId) || '';
    
    normalizedMap.set(d.decisionId, {
      decisionId: d.decisionId,
      featureNumber: d.featureNumber,
      title: d.title,
      owner: d.owner,
      deadline: d.deadline,
      status: d.status || 'PENDING',
      currentDecision: d.currentDecision,
      defaultOutcome: d.defaultOutcome,
      consequence: d.consequence,
      blockingImpact: d.blockingImpact,
      source: {
        path: filePath,
        lineStart: d.lineStart || 1
      }
    });
  }

  // Sort by natural ID order (D1, D2, D3, D4)
  return Array.from(normalizedMap.values()).sort((a, b) => {
    const numA = parseInt(a.decisionId.replace(/\D/g, ''), 10);
    const numB = parseInt(b.decisionId.replace(/\D/g, ''), 10);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.decisionId.localeCompare(b.decisionId);
  });
}
