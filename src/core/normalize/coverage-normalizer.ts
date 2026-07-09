import { CoverageFragment } from '../adapters/adapter-types.ts';

export interface CoverageRow {
  capability: string;
  state: string;
  responsibleChild?: string;
  gate?: string;
  clientContractStatus?: string;
  adminConsoleStatus?: string;
  evidenceLinks: string[];
  frReferences: string[];
  hasFR018Evidence: boolean;
  source: {
    path: string;
    lineStart?: number;
  };
}

/**
 * Normalizes and deduplicates product coverage matrix rows.
 */
export function normalizeCoverage(
  parsedCoverage: CoverageFragment[],
  matrixPath: string
): CoverageRow[] {
  const result: CoverageRow[] = [];

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
