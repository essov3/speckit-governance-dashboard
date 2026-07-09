import { FeatureFragment, TaskFragment, EvidenceFragment, ContractFragment } from '../adapters/adapter-types.ts';
import { Artifact } from '../discovery/discover-artifacts.ts';
import { normalizeFeatureId } from '../parsing/ids.ts';

export interface Feature {
  number: number;
  slug: string;
  title: string;
  phase?: string;
  lifecycle: string;
  active: boolean;
  dependencies: string[];
  specExists: boolean;
  planExists: boolean;
  tasksExists: boolean;
  checklistExists: boolean;
  phaseExitExists: boolean;
  contractsCount: number;
  evidenceCount: number;
  taskCompletionPct: number;
  approvalStatus: string;
  reviewStatus: string;
  nextAction: string;
  evidenceHealthScore: number;
  userStories: string[];
  functionalRequirements: string[];
  acceptanceScenarios: string[];
  edgeCases: string[];
  assumptions: string[];
  clarifications: string[];
  unresolvedAmbiguities: string[];
  sourceLinks: { path: string; role: string }[];
}

/**
 * Normalizes and aggregates feature data from all artifacts and adapters.
 */
export function normalizeFeatures(params: {
  artifacts: Artifact[];
  parsedFeatures: FeatureFragment[];
  parsedTasks: TaskFragment[];
  parsedEvidence: EvidenceFragment[];
  parsedContracts: ContractFragment[];
  activeFeatureNum?: number;
}): Feature[] {
  const { artifacts, parsedFeatures, parsedTasks, parsedEvidence, parsedContracts, activeFeatureNum } = params;

  // Find all unique feature numbers from artifacts and parsed data
  const featureMap = new Map<number, { slug: string; artifacts: Artifact[] }>();
  
  for (const art of artifacts) {
    if (art.featureNumber !== undefined) {
      const entry = featureMap.get(art.featureNumber) || { slug: art.featureSlug || '', artifacts: [] };
      entry.artifacts.push(art);
      if (art.featureSlug && !entry.slug) {
        entry.slug = art.featureSlug;
      }
      featureMap.set(art.featureNumber, entry);
    }
  }

  // Also include features mentioned in parsed features that aren't in artifacts
  for (const f of parsedFeatures) {
    if (!featureMap.has(f.featureNumber)) {
      featureMap.set(f.featureNumber, { slug: f.featureSlug, artifacts: [] });
    }
  }

  const normalizedFeatures: Feature[] = [];

  for (const [featNum, featData] of featureMap.entries()) {
    const slug = featData.slug;
    const featArtifacts = featData.artifacts;

    // Check which files exist
    const specExists = featArtifacts.some(a => a.role === 'spec-source');
    const planExists = featArtifacts.some(a => a.role === 'plan-source');
    const tasksExists = featArtifacts.some(a => a.role === 'task-source');
    const checklistExists = featArtifacts.some(a => a.role === 'checklist-source');
    const phaseExitExists = featArtifacts.some(a => a.role === 'phase-exit-source');

    // Count contracts and evidence
    const contractsCount = parsedContracts.filter(c => c.featureNumber === featNum).length;
    const evidenceCount = parsedEvidence.filter(e => e.featureNumber === featNum).length;

    // Aggregate text data from all parsed fragments for this feature
    const fragments = parsedFeatures.filter(f => f.featureNumber === featNum);
    const title = fragments.find(f => f.title)?.title || slug || `Feature ${normalizeFeatureId(featNum)}`;
    const phase = fragments.find(f => f.phase)?.phase;
    const dependencies = Array.from(new Set(fragments.flatMap(f => f.dependencies || [])));
    const userStories = fragments.flatMap(f => f.userStories || []);
    const functionalRequirements = fragments.flatMap(f => f.functionalRequirements || []);
    const acceptanceScenarios = fragments.flatMap(f => f.acceptanceScenarios || []);
    const edgeCases = fragments.flatMap(f => f.edgeCases || []);
    const assumptions = fragments.flatMap(f => f.assumptions || []);
    const clarifications = fragments.flatMap(f => f.clarifications || []);
    const unresolvedAmbiguities = fragments.flatMap(f => f.unresolvedAmbiguities || []);

    // Calculate task completion percentage
    const featureTasks = parsedTasks.filter(t => t.featureNumber === featNum);
    const completedTasks = featureTasks.filter(t => t.checked).length;
    const taskCompletionPct = featureTasks.length > 0
      ? Math.round((completedTasks / featureTasks.length) * 100)
      : 0;

    // Determine review and approval status from phase-exit evidence
    const featureEvidence = parsedEvidence.filter(e => e.featureNumber === featNum && e.evidenceType === 'review-evidence');
    const reviewStatus = featureEvidence.some(e => e.reviewer) ? 'REVIEWED' : 'PENDING';
    const approvalStatus = featureEvidence.some(e => e.approver) ? 'APPROVED' : 'PENDING';

    // Determine lifecycle state
    let lifecycle = 'Draft';
    if (specExists) lifecycle = 'Specified';
    if (planExists) lifecycle = 'Planned';
    if (tasksExists) {
      lifecycle = 'Tasks Ready';
      if (featureTasks.length > 0 && completedTasks === featureTasks.length) {
        lifecycle = 'Implemented';
      }
    }
    if (phaseExitExists && reviewStatus === 'REVIEWED') {
      lifecycle = 'Verified';
    }
    if (approvalStatus === 'APPROVED') {
      lifecycle = 'Approved';
    }

    // Evidence Health Score Calculation
    let evidenceHealthScore = 0;
    const exitEvidence = featureEvidence[0];
    if (phaseExitExists) evidenceHealthScore += 15;
    if (exitEvidence) {
      if (exitEvidence.commands && exitEvidence.commands.length > 0) evidenceHealthScore += 15;
      if (exitEvidence.exitCodes && exitEvidence.exitCodes.length > 0) {
        const hasAllZero = exitEvidence.exitCodes.every(c => c === 0);
        if (hasAllZero) evidenceHealthScore += 15;
      }
      if (exitEvidence.testCounts && exitEvidence.testCounts.total > 0) evidenceHealthScore += 15;
      if (exitEvidence.approver) evidenceHealthScore += 15;
      if (exitEvidence.rollbackForwardFixNotes) evidenceHealthScore += 10;
      if (exitEvidence.residualRisks) evidenceHealthScore += 5;
      if (exitEvidence.productDoctorNotes || exitEvidence.openApiNotes) evidenceHealthScore += 10;
    }

    // Derived next action
    let nextAction = 'Create specification (spec.md)';
    if (!specExists) {
      nextAction = 'Create specification';
    } else if (!planExists) {
      nextAction = 'Run planning phase (plan.md)';
    } else if (!tasksExists) {
      nextAction = 'Generate implementation tasks (tasks.md)';
    } else if (taskCompletionPct < 100) {
      nextAction = 'Complete remaining tasks';
    } else if (!phaseExitExists) {
      nextAction = 'Prepare phase-exit evidence (phase-exit.md)';
    } else if (reviewStatus !== 'REVIEWED' || approvalStatus !== 'APPROVED') {
      nextAction = 'Record approval/review evidence in phase-exit';
    } else {
      nextAction = 'None (Feature complete & verified)';
    }

    // Create source links
    const sourceLinks = featArtifacts.map(a => ({
      path: a.relativePath,
      role: a.role
    }));

    normalizedFeatures.push({
      number: featNum,
      slug,
      title,
      phase,
      lifecycle,
      active: activeFeatureNum === featNum,
      dependencies,
      specExists,
      planExists,
      tasksExists,
      checklistExists,
      phaseExitExists,
      contractsCount,
      evidenceCount,
      taskCompletionPct,
      approvalStatus,
      reviewStatus,
      nextAction,
      evidenceHealthScore,
      userStories,
      functionalRequirements,
      acceptanceScenarios,
      edgeCases,
      assumptions,
      clarifications,
      unresolvedAmbiguities,
      sourceLinks
    });
  }

  // Sort feature directories numerically
  return normalizedFeatures.sort((a, b) => a.number - b.number);
}
