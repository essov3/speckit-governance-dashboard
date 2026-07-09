import { Artifact } from '../discovery/discover-artifacts.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export interface SourceValue<T> {
  value: T;
  source: {
    path: string;
    section?: string;
    lineStart?: number;
    lineEnd?: number;
    excerpt?: string;
  };
  confidence: 'high' | 'medium' | 'low';
  role:
    | 'canonical-state'
    | 'specification'
    | 'planning'
    | 'task-claim'
    | 'checklist'
    | 'supporting-evidence'
    | 'contract'
    | 'derived';
  diagnostics: Diagnostic[];
}

export interface FeatureFragment {
  featureNumber: number;
  featureSlug: string;
  title?: string;
  phase?: string;
  lifecycle?: string;
  description?: string;
  active?: boolean;
  dependencies?: string[];
  userStories?: string[];
  functionalRequirements?: string[];
  acceptanceScenarios?: string[];
  edgeCases?: string[];
  assumptions?: string[];
  clarifications?: string[];
  unresolvedAmbiguities?: string[];
}

export interface TaskFragment {
  taskId: string;
  featureNumber?: number;
  label: string;
  checked: boolean;
  phase?: string;
  parallel: boolean;
  dependencies?: string[];
  referencedFiles?: string[];
  line: number;
}

export interface ChecklistFragment {
  name: string;
  featureNumber?: number;
  items: {
    checked: boolean;
    text: string;
    taskId?: string;
    line: number;
  }[];
  lineStart: number;
  lineEnd: number;
}

export interface GateFragment {
  gateId: string; // P0, P1, P2, P3, P4
  title: string;
  status: string; // OPEN, CLOSED, BLOCKED, PENDING
  requiredChildren?: number[];
  verifiedChildren?: number[];
  missingChildren?: number[];
  requiredDecisions?: string[];
  blockingEvidence?: string[];
  openBlockers?: string[];
  description?: string;
  lineStart?: number;
}

export interface DecisionFragment {
  decisionId: string; // D1, D2, D3, D4
  featureNumber?: number;
  title: string;
  owner?: string;
  deadline?: string;
  status: string; // PENDING, RESOLVED, DEFAULTED, ACCEPTED, REJECTED
  currentDecision?: string;
  defaultOutcome?: string;
  consequence?: string;
  blockingImpact?: string;
  lineStart?: number;
}

export interface CoverageFragment {
  capability: string;
  state: string; // VERIFIED_COMPLETE, MISSING_EVIDENCE, IN_PROGRESS, etc.
  responsibleChild?: string;
  gate?: string;
  clientContractStatus?: string;
  adminConsoleStatus?: string;
  evidenceLinks?: string[];
  frReferences?: string[];
  hasFR018Evidence?: boolean;
  lineStart?: number;
}

export interface EvidenceFragment {
  filePath: string;
  featureNumber?: number;
  evidenceType:
    | 'test-report'
    | 'ci-evidence'
    | 'openapi-evidence'
    | 'product-doctor-evidence'
    | 'approval-evidence'
    | 'review-evidence'
    | 'screenshot'
    | 'generated-report'
    | 'unknown';
  commands?: string[];
  exitCodes?: number[];
  testCounts?: { passed: number; failed: number; total: number };
  commitShas?: string[];
  reviewer?: string;
  approver?: string;
  approvalDate?: string;
  rollbackForwardFixNotes?: string;
  residualRisks?: string;
  productDoctorNotes?: string;
  openApiNotes?: string;
  warnings?: string[];
}

export interface ContractFragment {
  filePath: string;
  featureNumber?: number;
  contractType:
    | 'openapi'
    | 'rest-contract'
    | 'event-contract'
    | 'message-contract'
    | 'ui-route-contract'
    | 'schema-contract'
    | 'unknown';
  endpoints?: string[];
  events?: string[];
  schemas?: string[];
  referencedFrIds?: string[];
  referencedTaskIds?: string[];
  referencedEvidence?: string[];
}

export interface ActivityFragment {
  event: string;
  featureNumber?: number;
  gateId?: string;
  decisionId?: string;
  commitSha?: string;
  date?: string;
  notes?: string;
  lineStart?: number;
}

export interface RiskFragment {
  severity: 'info' | 'warning' | 'error';
  message: string;
  type: string;
  featureNumber?: number;
  lineStart?: number;
}

export interface ParsedFragment {
  adapterId: string;
  artifactPath: string;
  entities: {
    features?: FeatureFragment[];
    tasks?: TaskFragment[];
    checklists?: ChecklistFragment[];
    gates?: GateFragment[];
    decisions?: DecisionFragment[];
    coverageRows?: CoverageFragment[];
    evidenceItems?: EvidenceFragment[];
    contracts?: ContractFragment[];
    activities?: ActivityFragment[];
    risks?: RiskFragment[];
  };
  diagnostics: Diagnostic[];
}

export interface Adapter {
  id: string;
  name: string;
  canParse(artifact: Artifact): boolean;
  parse(input: {
    artifact: Artifact;
    content: string;
    projectRoot: string;
    artifactIndex: Artifact[];
  }): ParsedFragment;
}
