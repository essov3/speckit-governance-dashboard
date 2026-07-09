import { describe, it, expect } from 'vitest';
import { validateLifecycle } from '../../src/core/validate/lifecycle-validator.ts';
import { validateGates } from '../../src/core/validate/gate-validator.ts';
import { validateDecisions } from '../../src/core/validate/decision-validator.ts';
import { validateCoverage } from '../../src/core/validate/coverage-validator.ts';
import { validateContracts } from '../../src/core/validate/contract-validator.ts';
import { validateStaleCache } from '../../src/core/validate/stale-cache-validator.ts';
import { Feature } from '../../src/core/normalize/feature-normalizer.ts';
import { Gate } from '../../src/core/normalize/gate-normalizer.ts';
import { Decision } from '../../src/core/normalize/decision-normalizer.ts';
import { CoverageRow } from '../../src/core/normalize/coverage-normalizer.ts';
import { Task } from '../../src/core/normalize/task-normalizer.ts';
import { ValidationContext } from '../../src/core/validate/validator-types.ts';

describe('Governance Validators', () => {
  const defaultCtx: ValidationContext = {
    projectType: 'oarb-governance',
    strict: false,
    projectRoot: '/mock'
  };

  it('should flag a verified feature without approval evidence as an error', () => {
    const features: Feature[] = [
      {
        number: 90,
        slug: 'notification',
        title: 'Notification',
        lifecycle: 'Verified',
        active: false,
        dependencies: [],
        specExists: true,
        planExists: true,
        tasksExists: true,
        checklistExists: false,
        phaseExitExists: true,
        contractsCount: 0,
        evidenceCount: 0,
        taskCompletionPct: 100,
        approvalStatus: 'PENDING', // Lack of approval
        reviewStatus: 'REVIEWED',
        nextAction: '...',
        evidenceHealthScore: 80,
        userStories: [],
        functionalRequirements: [],
        acceptanceScenarios: [],
        edgeCases: [],
        assumptions: [],
        clarifications: [],
        unresolvedAmbiguities: [],
        sourceLinks: [{ path: 'specs/090/spec.md', role: 'spec-source' }]
      }
    ];

    const res = validateLifecycle(features, defaultCtx);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].id).toBe('ERR_VERIFIED_WITHOUT_APPROVAL');
  });

  it('should flag a closed gate with unverified children as an error', () => {
    const gates: Gate[] = [
      {
        gateId: 'P1',
        title: 'Engine Complete',
        status: 'CLOSED', // Gate closed
        requiredChildren: [87, 90],
        verifiedChildren: [87], // 90 is missing from verified
        missingChildren: [90],
        requiredDecisions: [],
        blockingEvidence: [],
        openBlockers: [],
        source: { path: 'delivery-ledger.md' }
      }
    ];

    const features: Feature[] = [
      { number: 87, slug: 'core', title: 'Core', lifecycle: 'Verified', active: false, dependencies: [], specExists: true, planExists: true, tasksExists: true, checklistExists: false, phaseExitExists: true, contractsCount: 0, evidenceCount: 0, taskCompletionPct: 100, approvalStatus: 'APPROVED', reviewStatus: 'REVIEWED', nextAction: '...', evidenceHealthScore: 100, userStories: [], functionalRequirements: [], acceptanceScenarios: [], edgeCases: [], assumptions: [], clarifications: [], unresolvedAmbiguities: [], sourceLinks: [] },
      { number: 90, slug: 'notify', title: 'Notify', lifecycle: 'Implemented', active: false, dependencies: [], specExists: true, planExists: true, tasksExists: true, checklistExists: false, phaseExitExists: false, contractsCount: 0, evidenceCount: 0, taskCompletionPct: 100, approvalStatus: 'PENDING', reviewStatus: 'PENDING', nextAction: '...', evidenceHealthScore: 0, userStories: [], functionalRequirements: [], acceptanceScenarios: [], edgeCases: [], assumptions: [], clarifications: [], unresolvedAmbiguities: [], sourceLinks: [] }
    ];

    const res = validateGates(gates, features, false, defaultCtx);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].id).toBe('ERR_CLOSED_GATE_UNVERIFIED_CHILDREN');
  });

  it('should flag pending decisions in closed gates as errors', () => {
    const decisions: Decision[] = [
      {
        decisionId: 'D1',
        title: 'Architecture Decision',
        status: 'PENDING', // Decision is pending
        source: { path: 'specs/decisions/D1.md' }
      }
    ];

    const gates: Gate[] = [
      {
        gateId: 'P1',
        title: 'Engine Complete',
        status: 'CLOSED', // Gate closed
        requiredChildren: [],
        verifiedChildren: [],
        missingChildren: [],
        requiredDecisions: ['D1'], // Requires D1
        blockingEvidence: [],
        openBlockers: [],
        source: { path: 'ledger.md' }
      }
    ];

    const res = validateDecisions(decisions, gates, defaultCtx);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].id).toBe('ERR_PENDING_DECISION_IN_CLOSED_GATE');
  });

  it('should flag a verified coverage row lacking evidence links as an error', () => {
    const rows: CoverageRow[] = [
      {
        capability: 'Send SMS notifications',
        state: 'VERIFIED_COMPLETE', // Complete
        evidenceLinks: [], // Missing evidence links
        frReferences: [],
        hasFR018Evidence: false,
        source: { path: 'coverage.md' }
      }
    ];

    const res = validateCoverage(rows, [], defaultCtx);
    expect(res.isValid).toBe(false);
    expect(res.errors[0].id).toBe('ERR_COMPLETE_COVERAGE_WITHOUT_EVIDENCE');
  });

  it('should warn if an API contract exists but is not referenced by tasks', () => {
    const contracts = [
      { filePath: 'specs/090/contracts/api.yaml', contractType: 'openapi' as const }
    ];
    const tasks: Task[] = []; // No tasks

    const res = validateContracts(contracts, tasks, defaultCtx);
    expect(res.isValid).toBe(true);
    expect(res.warnings[0].id).toBe('WARN_UNREFERENCED_CONTRACT');
  });

  it('should detect stale files in snapshots', () => {
    const snapshot = {
      artifacts: [
        { path: 'specs/001/spec.md', hash: 'sha256:old-hash' }
      ]
    };
    
    const fresh = [
      { relativePath: 'specs/001/spec.md', hash: 'sha256:new-hash' } // Modified
    ];

    const res = validateStaleCache(snapshot, fresh as any[], defaultCtx);
    expect(res.isValid).toBe(true); // Warnings are valid unless strict
    expect(res.warnings[0].id).toBe('ERR_STALE_MODIFIED_FILE');
  });
});
