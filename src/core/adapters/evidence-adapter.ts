import * as path from 'path';
import { Adapter, ParsedFragment, EvidenceFragment } from './adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { extractLinksAndIds } from '../parsing/links.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export class EvidenceAdapter implements Adapter {
  id = 'evidence';
  name = 'Evidence Adapter';

  canParse(artifact: Artifact): boolean {
    return artifact.role === 'evidence';
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
    const lowercasePath = artifact.relativePath.toLowerCase();
    const lowercaseFilename = path.basename(lowercasePath);

    // 1. Classify evidence type
    let evidenceType: EvidenceFragment['evidenceType'] = 'unknown';

    if (lowercaseFilename.includes('test') || lowercasePath.includes('/tests/')) {
      evidenceType = 'test-report';
    } else if (lowercaseFilename.includes('ci') || lowercaseFilename.includes('workflow') || lowercaseFilename.includes('build')) {
      evidenceType = 'ci-evidence';
    } else if (lowercaseFilename.includes('openapi') || lowercaseFilename.includes('api')) {
      evidenceType = 'openapi-evidence';
    } else if (lowercaseFilename.includes('doctor') || lowercaseFilename.includes('product-doctor')) {
      evidenceType = 'product-doctor-evidence';
    } else if (lowercaseFilename.includes('approval') || lowercaseFilename.includes('approve')) {
      evidenceType = 'approval-evidence';
    } else if (lowercaseFilename.includes('review') || lowercaseFilename.includes('exit')) {
      evidenceType = 'review-evidence';
    } else if (['.png', '.jpg', '.jpeg', '.gif'].includes(artifact.extension.toLowerCase())) {
      evidenceType = 'screenshot';
    } else if (lowercasePath.includes('/reports/') || ['.html', '.xml'].includes(artifact.extension.toLowerCase())) {
      evidenceType = 'generated-report';
    }

    // 2. Parse text content if possible
    const commands: string[] = [];
    const exitCodes: number[] = [];
    const commitShas: string[] = [];
    let passedTests = 0;
    let failedTests = 0;
    let totalTests = 0;

    const isBinary = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip'].includes(artifact.extension.toLowerCase());

    if (!isBinary && content) {
      // Extract links & IDs (SHAs, FRs, tasks)
      const linksAndIds = extractLinksAndIds(content);
      commitShas.push(...linksAndIds.commitShas);

      // Extract commands (lines starting with $ or containing standard test scripts)
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('$') || trimmed.startsWith('npm ') || trimmed.startsWith('./')) {
          const cmd = trimmed.replace(/^\$\s*/, '');
          if (cmd && !commands.includes(cmd)) {
            commands.push(cmd);
          }
        }
      }

      // Extract exit codes (e.g. exit 0 or exit code 1)
      const exitRegex = /\bexit\s*(?:code\s*)?(\d+)\b/gi;
      let exitMatch;
      while ((exitMatch = exitRegex.exec(content)) !== null) {
        exitCodes.push(parseInt(exitMatch[1], 10));
      }

      // Extract test counts: passed, failed, total
      const passMatch = content.match(/(\d+)\s*passed/i);
      const failMatch = content.match(/(\d+)\s*failed/i);
      const totalMatch = content.match(/(\d+)\s*total/i);

      if (passMatch) passedTests = parseInt(passMatch[1], 10);
      if (failMatch) failedTests = parseInt(failMatch[1], 10);
      if (totalMatch) totalTests = parseInt(totalMatch[1], 10);
    }

    const testCounts = (totalTests > 0 || passedTests > 0 || failedTests > 0)
      ? { passed: passedTests, failed: failedTests, total: totalTests || (passedTests + failedTests) }
      : undefined;

    const evidence: EvidenceFragment = {
      filePath: artifact.relativePath,
      featureNumber,
      evidenceType,
      commands: commands.length > 0 ? commands : undefined,
      exitCodes: exitCodes.length > 0 ? Array.from(new Set(exitCodes)) : undefined,
      testCounts,
      commitShas: commitShas.length > 0 ? Array.from(new Set(commitShas)) : undefined
    };

    entities.evidenceItems = [evidence];

    return {
      adapterId: this.id,
      artifactPath: artifact.relativePath,
      entities,
      diagnostics
    };
  }
}
