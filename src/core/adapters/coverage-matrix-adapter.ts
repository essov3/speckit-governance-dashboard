import { Adapter, ParsedFragment, CoverageFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { parseMarkdownTables } from '../parsing/markdown-tables.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class CoverageMatrixAdapter implements Adapter {
  id = 'coverage-matrix';
  name = 'Coverage Matrix Adapter';

  canParse(artifact: Artifact): boolean {
    const filename = artifact.relativePath.toLowerCase();
    return (
      artifact.role === 'coverage-matrix' ||
      filename.includes('coverage-matrix') ||
      filename.includes('coverage_matrix')
    );
  }

  parse(input: {
    artifact: Artifact;
    content: string;
    projectRoot: string;
    artifactIndex: Artifact[];
  }): ParsedFragment {
    const { artifact, content } = input;
    const diagnostics: Diagnostic[] = [];
    const entities: ParsedFragment['entities'] = {};

    const coverageRows: CoverageFragment[] = [];

    // Parse all tables in the document
    const tables = parseMarkdownTables(content, artifact.relativePath, 1);

    for (const table of tables) {
      // Look for columns
      const capIdx = table.headers.findIndex(h => /capabilit/i.test(h));
      const stateIdx = table.headers.findIndex(h => /status|state|verdict/i.test(h));
      const childIdx = table.headers.findIndex(h => /responsible|child|feature|owner/i.test(h));
      const gateIdx = table.headers.findIndex(h => /gate|phase/i.test(h));
      const clientIdx = table.headers.findIndex(h => /client|contract/i.test(h));
      const adminIdx = table.headers.findIndex(h => /admin|console/i.test(h));
      const evidenceIdx = table.headers.findIndex(h => /evidence|verification|proof/i.test(h));
      const frIdx = table.headers.findIndex(h => /fr|requirement|reference/i.test(h));

      // Make sure we have at least a capability column to proceed
      if (capIdx === -1) continue;

      for (const row of table.rows) {
        const capability = row.cells[capIdx];
        if (!capability || capability === '---' || capability.startsWith(':')) {
          continue; // Skip separator line if misparsed
        }

        const state = stateIdx !== -1 ? row.cells[stateIdx] : 'UNKNOWN';
        const responsibleChild = childIdx !== -1 ? row.cells[childIdx] : undefined;
        const gate = gateIdx !== -1 ? row.cells[gateIdx] : undefined;
        const clientContractStatus = clientIdx !== -1 ? row.cells[clientIdx] : undefined;
        const adminConsoleStatus = adminIdx !== -1 ? row.cells[adminIdx] : undefined;
        
        const evidenceCell = evidenceIdx !== -1 ? row.cells[evidenceIdx] : '';
        const frCell = frIdx !== -1 ? row.cells[frIdx] : '';

        // Extract evidence links and FR references from their respective cells
        const evidenceLinksAndIds = extractLinksAndIds(evidenceCell);
        const evidenceLinks = evidenceLinksAndIds.filePaths.concat(evidenceLinksAndIds.urls);

        const frLinksAndIds = extractLinksAndIds(frCell + ' ' + capability);
        const frReferences = frLinksAndIds.frIds;

        // Check if FR-018 is present
        const isFR018 = frReferences.includes('FR-018') || frReferences.includes('FR018') || capability.includes('FR-018');
        const hasFR018Evidence = isFR018 && evidenceLinks.length > 0;

        coverageRows.push({
          capability,
          state,
          responsibleChild,
          gate,
          clientContractStatus,
          adminConsoleStatus,
          evidenceLinks,
          frReferences,
          hasFR018Evidence,
          lineStart: row.line
        });
      }
    }

    if (coverageRows.length > 0) {
      entities.coverageRows = coverageRows;
    }

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
