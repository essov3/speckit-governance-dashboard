import { EvidenceFragment } from '../adapters/adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';

export interface EvidenceHealth {
  featureNumber: number;
  featureSlug: string;
  phaseExitExists: boolean;
  commandsRecorded: string[];
  exitCodesRecorded: number[];
  testCounts?: { passed: number; failed: number; total: number };
  approvalRecorded: boolean;
  approver?: string;
  reviewer?: string;
  rollbackNotesExists: boolean;
  residualRisksExists: boolean;
  productDoctorNotesExists: boolean;
  openApiNotesExists: boolean;
  linkedEvidenceCount: number;
  missingReferencedEvidence: string[];
  evidenceHealthScore: number;
  source: { path: string };
}

/**
 * Compiles evidence health metrics for each feature based on artifacts and parsed evidence.
 */
export function normalizeEvidenceHealth(params: {
  features: { number: number; slug: string }[];
  parsedEvidence: EvidenceFragment[];
  artifacts: Artifact[];
}): EvidenceHealth[] {
  const { features, parsedEvidence, artifacts } = params;
  const healthList: EvidenceHealth[] = [];

  for (const feat of features) {
    const featNum = feat.number;
    const featSlug = feat.slug;

    // Check if phase-exit exists
    const phaseExitArt = artifacts.find(a => a.featureNumber === featNum && a.role === 'phase-exit-source');
    const phaseExitExists = !!phaseExitArt;
    const phaseExitPath = phaseExitArt?.relativePath || `specs/${featNum}-${featSlug}/phase-exit.md`;

    // Filter evidence related to this feature
    const featEvidence = parsedEvidence.filter(e => e.featureNumber === featNum);
    const reviewEvidence = featEvidence.find(e => e.evidenceType === 'review-evidence');

    // Aggregate values
    const commandsRecorded: string[] = [];
    const exitCodesRecorded: number[] = [];
    let testCounts: EvidenceHealth['testCounts'] | undefined;
    let approvalRecorded = false;
    let approver: string | undefined;
    let reviewer: string | undefined;
    let rollbackNotesExists = false;
    let residualRisksExists = false;
    let productDoctorNotesExists = false;
    let openApiNotesExists = false;

    // Count evidence files in feature directory
    const linkedEvidenceCount = artifacts.filter(a => a.featureNumber === featNum && a.role === 'evidence').length;

    if (reviewEvidence) {
      if (reviewEvidence.commands) commandsRecorded.push(...reviewEvidence.commands);
      if (reviewEvidence.exitCodes) exitCodesRecorded.push(...reviewEvidence.exitCodes);
      if (reviewEvidence.testCounts) testCounts = reviewEvidence.testCounts;
      if (reviewEvidence.approver) {
        approvalRecorded = true;
        approver = reviewEvidence.approver;
      }
      if (reviewEvidence.reviewer) reviewer = reviewEvidence.reviewer;
      if (reviewEvidence.rollbackForwardFixNotes) rollbackNotesExists = true;
      if (reviewEvidence.residualRisks) residualRisksExists = true;
      if (reviewEvidence.productDoctorNotes) productDoctorNotesExists = true;
      if (reviewEvidence.openApiNotes) openApiNotesExists = true;
    }

    // Accumulate other evidence items
    for (const ev of featEvidence) {
      if (ev === reviewEvidence) continue;
      if (ev.commands) commandsRecorded.push(...ev.commands);
      if (ev.exitCodes) exitCodesRecorded.push(...ev.exitCodes);
      if (ev.testCounts && !testCounts) testCounts = ev.testCounts;
    }

    // Missing referenced evidence files
    // Let's look for markdown links or file paths in tasks/phase-exit files that don't exist
    const missingReferencedEvidence: string[] = [];
    // This will be checked in the evidence validator, but we can initialize it here
    
    // Compute score (re-used from feature-normalizer for consistency)
    let evidenceHealthScore = 0;
    if (phaseExitExists) evidenceHealthScore += 15;
    if (commandsRecorded.length > 0) evidenceHealthScore += 15;
    if (exitCodesRecorded.length > 0 && exitCodesRecorded.every(c => c === 0)) evidenceHealthScore += 15;
    if (testCounts && testCounts.total > 0) evidenceHealthScore += 15;
    if (approvalRecorded) evidenceHealthScore += 15;
    if (rollbackNotesExists) evidenceHealthScore += 10;
    if (residualRisksExists) evidenceHealthScore += 5;
    if (productDoctorNotesExists || openApiNotesExists) evidenceHealthScore += 10;

    healthList.push({
      featureNumber: featNum,
      featureSlug: featSlug,
      phaseExitExists,
      commandsRecorded: Array.from(new Set(commandsRecorded)),
      exitCodesRecorded: Array.from(new Set(exitCodesRecorded)),
      testCounts,
      approvalRecorded,
      approver,
      reviewer,
      rollbackNotesExists,
      residualRisksExists,
      productDoctorNotesExists,
      openApiNotesExists,
      linkedEvidenceCount,
      missingReferencedEvidence,
      evidenceHealthScore,
      source: { path: phaseExitPath }
    });
  }

  // Sort by feature number
  return healthList.sort((a, b) => a.featureNumber - b.featureNumber);
}
