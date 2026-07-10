import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runGenerate } from '../../src/cli/commands/generate.ts';
import { runCheck } from '../../src/cli/commands/check.ts';
import { runDoctor } from '../../src/cli/commands/doctor.ts';
import { resolveOutputPath } from '../../src/core/paths/safe-output-path.ts';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures');

describe('CLI Integration Commands', () => {
  const vanillaRoot = path.join(FIXTURES_DIR, 'vanilla-speckit-basic');
  const governanceRoot = path.join(FIXTURES_DIR, 'governance-style-readiness');

  it('should run generate command against vanilla speckit and output a snapshot file', async () => {
    const outPath = path.join(vanillaRoot, '.dashboard-cache/project-status.json');
    
    // Run generate command
    await runGenerate({
      projectRoot: vanillaRoot,
      out: outPath,
      deterministic: true,
      quiet: true
    });

    expect(fs.existsSync(outPath)).toBe(true);

    const snapshot = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(snapshot.project.detectedType).toBe('vanilla-speckit');
    expect(snapshot.executive.featureSummary.total).toBe(1);
    expect(snapshot.features[0].lifecycle).toBe('Tasks Ready');
  });

  it('should run doctor command against a governance project without crashing', async () => {
    // We override process.exit to prevent the command from ending the test process
    const originalExit = process.exit;
    let exitCode: number | null = null;
    (process as any).exit = (code: number) => {
      exitCode = code;
    };

    try {
      await runDoctor({
        projectRoot: governanceRoot
      });
      
      expect(exitCode === null || exitCode === 0).toBe(true);
    } finally {
      process.exit = originalExit;
    }
  });

  it('should run check command and pass for identical snapshot', async () => {
    const snapPath = path.join(vanillaRoot, '.dashboard-cache/project-status.json');
    
    const originalExit = process.exit;
    let exitCode: number | null = null;
    (process as any).exit = (code: number) => {
      exitCode = code;
    };

    try {
      await runCheck({
        projectRoot: vanillaRoot,
        snapshot: snapPath,
        deterministic: true
      });

      expect(exitCode).toBe(0);
    } finally {
      process.exit = originalExit;
    }
  });
});
