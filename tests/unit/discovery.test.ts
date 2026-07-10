import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { discoverArtifacts } from '../../src/core/discovery/discover-artifacts.ts';
import { classifyArtifact } from '../../src/core/discovery/artifact-role-classifier.ts';
import { resolveProjectRoot } from '../../src/core/paths/resolve-project-root.ts';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

// Create test fixtures
function setupFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // 1. Vanilla basic
  const vanillaDir = path.join(FIXTURES_DIR, 'vanilla-speckit-basic');
  fs.mkdirSync(path.join(vanillaDir, '.specify/memory'), { recursive: true });
  fs.mkdirSync(path.join(vanillaDir, 'specs/001-login'), { recursive: true });
  
  fs.writeFileSync(path.join(vanillaDir, '.specify/feature.json'), JSON.stringify({ number: 1, slug: 'login' }));
  fs.writeFileSync(path.join(vanillaDir, '.specify/memory/constitution.md'), '- [ ] Constitution check');
  fs.writeFileSync(path.join(vanillaDir, 'specs/001-login/spec.md'), '# Login Spec');
  fs.writeFileSync(path.join(vanillaDir, 'specs/001-login/plan.md'), '# Plan');
  fs.writeFileSync(path.join(vanillaDir, 'specs/001-login/tasks.md'), '- [ ] T001 Task 1\n- [x] T002 Task 2 [P]');

  // 2. Generic governance style
  const governanceDir = path.join(FIXTURES_DIR, 'governance-style-readiness');
  fs.mkdirSync(path.join(governanceDir, 'specs/069-production-readiness-program'), { recursive: true });
  fs.mkdirSync(path.join(governanceDir, 'specs/087-core'), { recursive: true });
  fs.mkdirSync(path.join(governanceDir, 'specs/090-notification/contracts'), { recursive: true });
  fs.mkdirSync(path.join(governanceDir, 'specs/090-notification/evidence'), { recursive: true });

  fs.writeFileSync(
    path.join(governanceDir, 'specs/069-production-readiness-program/delivery-ledger.md'),
    '# Ledger\n## P0 Gate (CLOSED)\n- [x] 087-core\n## P1 Gate (OPEN)\n- [ ] 090-notification'
  );
  fs.writeFileSync(
    path.join(governanceDir, 'specs/069-production-readiness-program/product-coverage-matrix.md'),
    '| Capability | State | Responsible Child | Gate | client |\n|---|---|---|---|---|\n| Send notify | IN_PROGRESS | 090 | P1 | - |'
  );
  fs.writeFileSync(path.join(governanceDir, 'specs/090-notification/contracts/openapi.yaml'), 'openapi: 3.0.0');
  fs.writeFileSync(path.join(governanceDir, 'specs/090-notification/evidence/test-run.txt'), 'Tests passed');
  fs.writeFileSync(path.join(governanceDir, 'specs/087-core/phase-exit.md'), '# Phase Exit 087\nReviewer: Demo Reviewer\nApprover: Demo Approver');
}

describe('SpecKit Artifact Discovery & Paths', () => {
  beforeAll(() => {
    setupFixtures();
  });

  it('should resolve project roots correctly based on priority', () => {
    // CLI parameter wins
    const cliResolved = resolveProjectRoot(path.join(FIXTURES_DIR, 'vanilla-speckit-basic'));
    expect(cliResolved).toContain('vanilla-speckit-basic');

    // Env variable wins if no CLI param
    process.env.SPECKIT_PROJECT_ROOT = path.join(FIXTURES_DIR, 'governance-style-readiness');
    const envResolved = resolveProjectRoot(undefined);
    expect(envResolved).toContain('governance-style-readiness');
    delete process.env.SPECKIT_PROJECT_ROOT;
  });

  it('should discover vanilla Speckit files', async () => {
    const root = path.join(FIXTURES_DIR, 'vanilla-speckit-basic');
    const artifacts = await discoverArtifacts({ projectRoot: root });

    const roles = artifacts.map(a => a.role);
    expect(roles).toContain('active-feature-pointer');
    expect(roles).toContain('constitution-source');
    expect(roles).toContain('spec-source');
    expect(roles).toContain('plan-source');
    expect(roles).toContain('task-source');
  });

  it('should discover governance files, contracts and evidence', async () => {
    const root = path.join(FIXTURES_DIR, 'governance-style-readiness');
    const artifacts = await discoverArtifacts({ projectRoot: root });

    const roles = artifacts.map(a => a.role);
    expect(roles).toContain('delivery-ledger');
    expect(roles).toContain('coverage-matrix');
    expect(roles).toContain('contract');
    expect(roles).toContain('evidence');
    expect(roles).toContain('phase-exit-source');
  });

  it('should classify roles correctly', () => {
    expect(classifyArtifact('specs/001-login/spec.md').role).toBe('spec-source');
    expect(classifyArtifact('specs/001-login/plan.md').role).toBe('plan-source');
    expect(classifyArtifact('specs/001-login/tasks.md').role).toBe('task-source');
    expect(classifyArtifact('specs/069/delivery-ledger.md').role).toBe('delivery-ledger');
    expect(classifyArtifact('specs/090-notif/contracts/api.json').role).toBe('contract');
    expect(classifyArtifact('specs/090-notif/evidence/run.txt').role).toBe('evidence');
    expect(classifyArtifact('specs/090-notif/checklists/design.md').role).toBe('checklist-source');
  });
});
