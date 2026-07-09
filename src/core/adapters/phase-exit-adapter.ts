import { Adapter, ParsedFragment, EvidenceFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { parseMarkdownSections, flattenSections } from '../parsing/markdown-sections.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class PhaseExitAdapter implements Adapter {
  id = 'phase-exit';
  name = 'Phase Exit Adapter';

  canParse(artifact: Artifact): boolean {
    return artifact.role === 'phase-exit-source';
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

    const featureNumber = artifact.featureNumber;
    const sections = parseMarkdownSections(content);
    const flatSections = flattenSections(sections);

    let reviewer: string | undefined;
    let approver: string | undefined;
    let approvalDate: string | undefined;
    const commands: string[] = [];
    const exitCodes: number[] = [];
    let passedTests = 0;
    let failedTests = 0;
    let totalTests = 0;
    const commitShas: string[] = [];
    let rollbackForwardFixNotes: string | undefined;
    let residualRisks: string | undefined;
    let productDoctorNotes: string | undefined;
    let openApiNotes: string | undefined;

    // Extract links & IDs (such as SHAs) from the whole document
    const linksAndIds = extractLinksAndIds(content);
    commitShas.push(...linksAndIds.commitShas);

    // Read details section by section
    for (const sec of flatSections) {
      const titleLower = sec.title.toLowerCase();
      const secContent = sec.content;

      // Extract reviewer / approver details
      const reviewerMatch = secContent.match(/(?:reviewer|reviewed\s+by)\s*:\s*([^\n\r]+)/i);
      if (reviewerMatch) {
        reviewer = reviewerMatch[1].trim();
      }

      const approverMatch = secContent.match(/(?:approver|approved\s+by)\s*:\s*([^\n\r]+)/i);
      if (approverMatch) {
        approver = approverMatch[1].trim();
      }

      const dateMatch = secContent.match(/(?:date|approved\s+on)\s*:\s*([^\n\r]+)/i);
      if (dateMatch) {
        approvalDate = dateMatch[1].trim();
      }

      // Extract commands in code blocks (e.g. ```bash ... ```)
      const codeBlockRegex = /```(?:bash|sh)?\r?\n([\s\S]*?)```/g;
      let codeMatch;
      while ((codeMatch = codeBlockRegex.exec(secContent)) !== null) {
        const lines = codeMatch[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          // If it starts with $ or is just a command, save it
          const cleanLine = line.replace(/^\$\s*/, '');
          if (cleanLine && !commands.includes(cleanLine) && !cleanLine.startsWith('#')) {
            commands.push(cleanLine);
          }
        }
      }

      // Extract exit codes (e.g. exit code 0 or exit 0)
      const exitRegex = /\bexit\s*(?:code\s*)?(\d+)\b/gi;
      let exitMatch;
      while ((exitMatch = exitRegex.exec(secContent)) !== null) {
        exitCodes.push(parseInt(exitMatch[1], 10));
      }

      // Extract test counts: passed, failed, total
      const passMatch = secContent.match(/(\d+)\s*passed/i);
      const failMatch = secContent.match(/(\d+)\s*failed/i);
      const totalMatch = secContent.match(/(\d+)\s*total/i);

      if (passMatch) passedTests = parseInt(passMatch[1], 10);
      if (failMatch) failedTests = parseInt(failMatch[1], 10);
      if (totalMatch) totalTests = parseInt(totalMatch[1], 10);

      // Section-specific content mapping
      if (titleLower.includes('rollback') || titleLower.includes('forward-fix')) {
        rollbackForwardFixNotes = secContent.trim();
      } else if (titleLower.includes('residual risk') || titleLower.includes('risk')) {
        residualRisks = secContent.trim();
      } else if (titleLower.includes('doctor') || titleLower.includes('product doctor')) {
        productDoctorNotes = secContent.trim();
      } else if (titleLower.includes('openapi') || titleLower.includes('api')) {
        openApiNotes = secContent.trim();
      }
    }

    const testCounts = (totalTests > 0 || passedTests > 0 || failedTests > 0)
      ? { passed: passedTests, failed: failedTests, total: totalTests || (passedTests + failedTests) }
      : undefined;

    const evidence: EvidenceFragment = {
      filePath: artifact.relativePath,
      featureNumber,
      evidenceType: 'review-evidence', // phase-exit.md is canonical review/approval evidence
      commands,
      exitCodes: Array.from(new Set(exitCodes)),
      testCounts,
      commitShas: Array.from(new Set(commitShas)),
      reviewer,
      approver,
      approvalDate,
      rollbackForwardFixNotes,
      residualRisks,
      productDoctorNotes,
      openApiNotes
    };

    entities.evidenceItems = [evidence];

    // If review/approval was successfully parsed, we can also extract activity
    const activities: ParsedFragment['entities']['activities'] = [];
    if (reviewer) {
      activities.push({
        event: 'Feature Reviewed',
        featureNumber,
        notes: `Reviewed by ${reviewer}`,
        lineStart: 1
      });
    }
    if (approver) {
      activities.push({
        event: 'Feature Approved',
        featureNumber,
        notes: `Approved by ${approver} on ${approvalDate || 'unknown date'}`,
        lineStart: 1
      });
    }
    if (activities.length > 0) {
      entities.activities = activities;
    }

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
