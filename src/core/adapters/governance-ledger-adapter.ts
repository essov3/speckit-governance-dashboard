import { Adapter, ParsedFragment, GateFragment, ActivityFragment, RiskFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { parseMarkdownSections, flattenSections } from '../parsing/markdown-sections.ts';
import { parseMarkdownTables } from '../parsing/markdown-tables.ts';
import { parseMarkdownChecklist } from '../parsing/markdown-checklists.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class GovernanceLedgerAdapter implements Adapter {
  id = 'governance-ledger';
  name = 'Governance Ledger Adapter';

  canParse(artifact: Artifact): boolean {
    const filename = artifact.relativePath.toLowerCase();
    return (
      artifact.role === 'delivery-ledger' ||
      filename.includes('delivery-ledger') ||
      filename.includes('delivery_ledger')
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

    const sections = parseMarkdownSections(content);
    const flatSections = flattenSections(sections);
    
    const gates: GateFragment[] = [];
    const activities: ActivityFragment[] = [];
    const risks: RiskFragment[] = [];

    // Parse gates from sections and text
    // E.g., Heading matches: ## P1: Engine Complete (OPEN) or ## Phase 1 — SaaS Engine Completion
    const gateHeadingRegex = /^(?:##?\s*)?(?:Phase\s*([0-4])|P([0-4]))\s*[:\-—]?\s*([^(\n]+)(?:\(([^)]+)\))?/i;
    
    for (const sec of flatSections) {
      const match = sec.title.match(gateHeadingRegex);
      if (match) {
        const num = match[1] || match[2];
        const gateId = `P${num}`;
        const gateTitle = match[3].trim();
        let gateStatus = (match[4] || 'OPEN').trim().toUpperCase();

        // Scan body for status declaration (e.g. **Gate P1 status**: OPEN.)
        const bodyStatusMatch = sec.content.match(/Gate\s+P[0-4]\s*(?:\*\*?|status|\s)*\s*:\s*\*\*?([a-zA-Z]+)\*\*?/i);
        if (bodyStatusMatch) {
          gateStatus = bodyStatusMatch[1].trim().toUpperCase();
        }

        const requiredChildren: number[] = [];
        const verifiedChildren: number[] = [];
        const missingChildren: number[] = [];
        const openBlockers: string[] = [];

        // Parse checklists inside this gate section to find required child features
        const checklistItems = parseMarkdownChecklist(sec.content, sec.lineStart);
        for (const item of checklistItems) {
          // Check if item contains a feature number (3-digit or standard)
          const featMatch = item.text.match(/\b(\d{3})\b/);
          if (featMatch) {
            const featNum = parseInt(featMatch[1], 10);
            requiredChildren.push(featNum);
            if (item.checked) {
              verifiedChildren.push(featNum);
            } else {
              missingChildren.push(featNum);
              openBlockers.push(`Feature ${featMatch[1]} is not verified`);
            }
          } else {
            // General checklist item as blocker if unchecked
            if (!item.checked) {
              openBlockers.push(item.text);
            }
          }
        }

        // Parse tables in this gate section to find features
        const tables = parseMarkdownTables(sec.content, artifact.relativePath, sec.lineStart);
        for (const table of tables) {
          // Identify columns like Feature, Status, Verification
          const featureColIdx = table.headers.findIndex(h => /number|num|feature|id|child/i.test(h));
          const statusColIdx = table.headers.findIndex(h => /status|state/i.test(h));
          const reviewColIdx = table.headers.findIndex(h => /review|approval|approver/i.test(h));

          const numberColIdx = table.headers.findIndex(h => /number|num|id/i.test(h));
          const searchColIdx = numberColIdx !== -1 ? numberColIdx : featureColIdx;

          if (searchColIdx !== -1) {
            for (const row of table.rows) {
              const featText = row.cells[searchColIdx];
              const featMatch = featText.match(/\b(\d+)\b/);
              if (featMatch) {
                const featNum = parseInt(featMatch[1], 10);
                if (!requiredChildren.includes(featNum)) {
                  requiredChildren.push(featNum);
                }

                const statusText = statusColIdx !== -1 ? row.cells[statusColIdx].toUpperCase() : '';
                const rowText = row.cells.join(' ').toLowerCase();
                const isVerified = statusText.includes('VERIFIED') || 
                                   statusText.includes('CLOSED') || 
                                   statusText.includes('DONE') || 
                                   statusText.includes('COMPLETE') ||
                                   statusText.includes('IMPLEMENTED') ||
                                   (rowText.includes('verified') && !rowText.includes('not verified') && !rowText.includes('pending'));
                
                if (isVerified) {
                  if (!verifiedChildren.includes(featNum)) {
                    verifiedChildren.push(featNum);
                  }
                  // Remove from missing if present
                  const idx = missingChildren.indexOf(featNum);
                  if (idx !== -1) missingChildren.splice(idx, 1);
                } else {
                  if (!missingChildren.includes(featNum)) {
                    missingChildren.push(featNum);
                  }
                  const blockMessage = `Feature ${featMatch[1]} status: ${statusText || 'OPEN'}`;
                  if (!openBlockers.includes(blockMessage)) {
                    openBlockers.push(blockMessage);
                  }
                }

                // Add activity logs if review events exist
                if (reviewColIdx !== -1 && row.cells[reviewColIdx]) {
                  const revText = row.cells[reviewColIdx];
                  if (revText && revText !== '-' && revText.toLowerCase() !== 'tbd') {
                    activities.push({
                      event: 'Ledger Approval Recorded',
                      featureNumber: featNum,
                      gateId,
                      notes: `Feature ${featMatch[1]} reviewed: ${revText}`,
                      lineStart: row.line
                    });
                  }
                }
              } else {
                // Feature is TBD (e.g. entitlement-concurrency-and-quota)
                const codename = row.cells[0];
                const statusText = statusColIdx !== -1 ? row.cells[statusColIdx] : 'DRAFT';
                if (
                  codename && 
                  codename !== '---' && 
                  !statusText.toUpperCase().includes('VERIFIED') && 
                  !statusText.toUpperCase().includes('IMPLEMENTED') && 
                  !statusText.toUpperCase().includes('DEFERRED')
                ) {
                  openBlockers.push(`${codename} is not verified (status: ${statusText})`);
                }
              }
            }
          }
        }

        gates.push({
          gateId,
          title: gateTitle,
          status: gateStatus,
          requiredChildren: Array.from(new Set(requiredChildren)),
          verifiedChildren: Array.from(new Set(verifiedChildren)),
          missingChildren: Array.from(new Set(missingChildren)),
          openBlockers,
          lineStart: sec.lineStart
        });
      }

      // Check for program lifecycle status declaration
      // E.g., "Program Lifecycle: COMPLETE" or "Readiness Status: COMPLETE"
      const statusMatch = sec.content.match(/(?:Program\s+Lifecycle|Readiness\s+Status|Lifecycle\s+State)\s*:\s*([^\n\r]+)/i);
      if (statusMatch) {
        const val = statusMatch[1].trim();
        activities.push({
          event: 'Lifecycle State Declared',
          notes: val,
          lineStart: sec.lineStart
        });
      }

      // Check for blockers explicitly mentioned
      if (sec.title.toLowerCase().includes('blocker') || sec.title.toLowerCase().includes('risk')) {
        const bullets = sec.content
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.startsWith('-') || line.startsWith('*'))
          .map(line => line.substring(1).trim());

        for (const b of bullets) {
          risks.push({
            severity: 'error',
            message: b,
            type: 'blocker',
            lineStart: sec.lineStart
          });
        }
      }
    }

    // Sort gates in standard P0 - P4 order
    gates.sort((a, b) => a.gateId.localeCompare(b.gateId));

    if (gates.length > 0) entities.gates = gates;
    if (activities.length > 0) entities.activities = activities;
    if (risks.length > 0) entities.risks = risks;

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
