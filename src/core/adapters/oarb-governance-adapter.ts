import { Adapter, ParsedFragment, GateFragment, ActivityFragment, RiskFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { parseMarkdownSections, flattenSections } from '../parsing/markdown-sections.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';

export class OArbGovernanceAdapter implements Adapter {
  id = 'oarb-governance';
  name = 'OAR B Governance Adapter';

  canParse(artifact: Artifact): boolean {
    const lowercasePath = artifact.relativePath.toLowerCase();
    // Auto-activate for the OAR B production readiness program directory or ledger
    return (
      lowercasePath.includes('069-production-readiness') ||
      lowercasePath.includes('oar-b') ||
      lowercasePath.includes('oarb')
    );
  }

  parse(input: {
    artifact: Artifact;
    content: string;
    projectRoot: string;
    artifactIndex: Artifact[];
  }): ParsedFragment {
    const { artifact, content, artifactIndex } = input;
    const diagnostics: Diagnostic[] = [];
    const entities: ParsedFragment['entities'] = {};

    const gates: GateFragment[] = [];
    const activities: ActivityFragment[] = [];
    const risks: RiskFragment[] = [];

    // Parse the file sections
    const sections = parseMarkdownSections(content);
    const flatSections = flattenSections(sections);

    const lowercaseFilename = pathBasename(artifact.relativePath).toLowerCase();

    if (lowercaseFilename.includes('delivery-ledger') || lowercaseFilename.includes('delivery_ledger')) {
      // 1. OAR B Ledger Parsing
      const isEngineComplete = (content.includes('ENGINE_COMPLETE') || /readiness\s*:\s*ENGINE_COMPLETE/i.test(content)) && 
                                !content.includes('ENGINE_COMPLETE is not declared') && 
                                !content.includes('ENGINE_COMPLETE not declared');
      const isProductReady = content.includes('PRODUCT_READY') || /readiness\s*:\s*PRODUCT_READY/i.test(content);
      
      // Look for gate statuses in the content
      const p0Closed = /P0\s*[:\-]?\s*CLOSED/i.test(content);
      const p1Open = /P1\s*[:\-]?\s*OPEN/i.test(content);

      // Verify P1 children: 087, 088, 089
      const has087 = /\b087\b/.test(content);
      const has088 = /\b088\b/.test(content);
      const has089 = /\b089\b/.test(content);
      const has090 = /\b090\b/.test(content);

      // Guardrails checking
      
      // Guardrail 1: P0 is CLOSED unless contradicted
      if (!p0Closed && !content.includes('P0: OPEN')) {
        // Assume CLOSED, but if explicitly open:
        diagnostics.push(
          createDiagnostic({
            id: 'WARN_OARB_P0_CONTRADICTION',
            severity: 'warning',
            category: 'gate',
            message: `OAR B Guardrail: P0 is expected to be CLOSED. Verify delivery ledger.`,
            source: { path: artifact.relativePath }
          })
        );
      }

      // Guardrail 2: P1 is OPEN unless contradicted
      if (content.includes('P1: CLOSED') || content.includes('P1: COMPLETE')) {
        diagnostics.push(
          createDiagnostic({
            id: 'WARN_OARB_P1_CONTRADICTION',
            severity: 'warning',
            category: 'gate',
            message: `OAR B Guardrail Contradiction: P1 is marked CLOSED/COMPLETE, but blockers may remain.`,
            source: { path: artifact.relativePath }
          })
        );
      }

      // Guardrail 3: ENGINE_COMPLETE is not declared unless contradicted
      if (isEngineComplete) {
        diagnostics.push(
          createDiagnostic({
            id: 'WARN_OARB_ENGINE_COMPLETE_CONTRADICTION',
            severity: 'warning',
            category: 'lifecycle',
            message: `OAR B Guardrail: ENGINE_COMPLETE has been declared. Check if all P1 blockers are resolved.`,
            source: { path: artifact.relativePath }
          })
        );
      }

      // Guardrail 4: Verified P1 children include 087, 088, 089
      if (!has087 || !has088 || !has089) {
        diagnostics.push(
          createDiagnostic({
            id: 'WARN_OARB_MISSING_P1_CHILDREN',
            severity: 'warning',
            category: 'lifecycle',
            message: `OAR B Guardrail: Missing expected P1 child features (087, 088, 089) in ledger.`,
            source: { path: artifact.relativePath }
          })
        );
      }

      // Guardrail 5: Feature 090 is not verified unless ledger and phase-exit prove it
      const has090PhaseExit = artifactIndex.some(art => 
        art.role === 'phase-exit-source' && art.featureNumber === 90
      );
      const is090VerifiedInLedger = /090\s*-\s*client-notification-plumbing\s*\|\s*VERIFIED/i.test(content) || 
                                    /090\s*\|\s*VERIFIED/i.test(content);

      if (is090VerifiedInLedger && !has090PhaseExit) {
        diagnostics.push(
          createDiagnostic({
            id: 'WARN_OARB_090_VERIFIED_WITHOUT_PHASE_EXIT',
            severity: 'warning',
            category: 'lifecycle',
            message: `OAR B Guardrail: Feature 090 is marked Verified in ledger but lacks specs/090-client-notification-plumbing/phase-exit.md.`,
            source: { path: artifact.relativePath }
          })
        );
      }

      activities.push({
        event: 'OAR B Readiness Checked',
        notes: `Checked gate guardrails. P0 CLOSED: ${p0Closed || !content.includes('P0: OPEN')}, P1 OPEN: ${p1Open || !content.includes('P1: CLOSED')}, ENGINE_COMPLETE: ${isEngineComplete}`,
        lineStart: 1
      });
    }

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

function pathBasename(p: string): string {
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}
