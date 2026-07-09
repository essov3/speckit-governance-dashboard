import * as path from 'path';
import { Adapter, ParsedFragment, DecisionFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { parseMarkdownSections, flattenSections } from '../parsing/markdown-sections.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class DecisionRecordAdapter implements Adapter {
  id = 'decision-record';
  name = 'Decision Record Adapter';

  canParse(artifact: Artifact): boolean {
    const parts = artifact.relativePath.split('/');
    return (
      artifact.role === 'decision-record' ||
      parts.includes('decisions')
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

    const filename = path.basename(artifact.relativePath);
    
    // Extract decision ID from filename, e.g. D1-some-decision.md -> D1
    let decisionId = 'D-UNKNOWN';
    const idFilenameMatch = filename.match(/^(D\d+|D-\d+)/i);
    if (idFilenameMatch) {
      decisionId = idFilenameMatch[1].replace('-', '').toUpperCase();
    }

    // Main title
    let title = sections[0]?.title || filename.replace('.md', '');
    // If the title starts with Decision D1: ..., clean it up
    const cleanTitleRegex = /^(?:Decision\s+)?(D\d+|D-\d+)\s*[:\-]?\s*(.+)$/i;
    const titleMatch = title.match(cleanTitleRegex);
    if (titleMatch) {
      decisionId = titleMatch[1].replace('-', '').toUpperCase();
      title = titleMatch[2].trim();
    }

    let owner: string | undefined;
    let deadline: string | undefined;
    let status = 'PENDING'; // Default status is PENDING if not specified
    let currentDecision: string | undefined;
    let defaultOutcome: string | undefined;
    let consequence: string | undefined;
    let blockingImpact: string | undefined;

    // 1. Scan metadata list (usually at the top of the file)
    const metaLines = content.split(/\r?\n/).slice(0, 20); // Check first 20 lines
    for (const line of metaLines) {
      const trimmed = line.trim();
      const ownerMatch = trimmed.match(/^(?:Owner|Author)\s*:\s*([^\n\r]+)/i);
      const deadlineMatch = trimmed.match(/^Deadline\s*:\s*([^\n\r]+)/i);
      const statusMatch = trimmed.match(/^Status\s*:\s*([^\n\r]+)/i);
      const defaultMatch = trimmed.match(/^(?:Default Outcome|Default)\s*:\s*([^\n\r]+)/i);
      const impactMatch = trimmed.match(/^(?:Blocking Impact|Impact)\s*:\s*([^\n\r]+)/i);

      if (ownerMatch) owner = ownerMatch[1].trim();
      if (deadlineMatch) deadline = deadlineMatch[1].trim();
      if (statusMatch) {
        status = statusMatch[1].trim().toUpperCase();
      }
      if (defaultMatch) defaultOutcome = defaultMatch[1].trim();
      if (impactMatch) blockingImpact = impactMatch[1].trim();
    }

    // 2. Scan section content
    for (const sec of flatSections) {
      const titleLower = sec.title.toLowerCase();
      const secContent = sec.content.trim();

      if (titleLower.includes('decision') && !titleLower.includes('record')) {
        currentDecision = secContent;
        // Check for inline status declaration in decision content
        const statusMatch = secContent.match(/(?:status|state)\s*:\s*([a-zA-Z]+)/i);
        if (statusMatch) {
          status = statusMatch[1].trim().toUpperCase();
        }
      } else if (titleLower.includes('consequence') || titleLower.includes('implication')) {
        consequence = secContent;
      } else if (titleLower.includes('impact') || titleLower.includes('blocker')) {
        blockingImpact = secContent;
      } else if (titleLower.includes('default')) {
        defaultOutcome = secContent;
      }
    }

    const decision: DecisionFragment = {
      decisionId,
      featureNumber: artifact.featureNumber,
      title,
      owner,
      deadline,
      status,
      currentDecision,
      defaultOutcome,
      consequence,
      blockingImpact,
      lineStart: 1
    };

    entities.decisions = [decision];

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
