import * as fs from 'fs';
import * as path from 'path';
import { resolveProjectRoot, loadConfig } from '../../core/paths/resolve-project-root.ts';
import { buildSnapshot } from '../../core/snapshot/build-snapshot.ts';
import { compareSnapshot } from '../../core/snapshot/compare-snapshot.ts';
import { resolveOutputPath } from '../../core/paths/safe-output-path.ts';
import { startReadOnlyGuard, assertNoMutation } from '../../core/validate/read-only-protection.ts';
import { validateStaleCache } from '../../core/validate/stale-cache-validator.ts';
import { ValidationContext } from '../../core/validate/validator-types.ts';

export interface CheckCommandOptions {
  projectRoot?: string;
  snapshot?: string;
  strict?: boolean;
  deterministic?: boolean;
  adapter?: 'vanilla' | 'auto' | 'governance';
  failOnWarning?: boolean;
}

export async function runCheck(options: CheckCommandOptions): Promise<void> {
  console.log('SpecKit Governance Dashboard - Checking Project Status...');

  // 1. Resolve project root
  let projectRoot: string;
  try {
    projectRoot = resolveProjectRoot(options.projectRoot);
  } catch (err: any) {
    console.error(`Error resolving project root: ${err.message}`);
    process.exit(2);
  }

  console.log(`Target project root: ${projectRoot}`);

  // 2. Start read-only guard
  const guard = await startReadOnlyGuard(projectRoot);

  // 3. Load config and set strictness
  const config = loadConfig();
  const strict = options.strict !== undefined ? options.strict : (config.strict || false);
  const failOnWarning = !!options.failOnWarning;

  // 4. Generate fresh snapshot in memory
  let freshSnapshot;
  try {
    freshSnapshot = await buildSnapshot({
      projectRoot,
      deterministic: true, // Always deterministic for check comparisons
      strict,
      adapterMode: options.adapter,
      includeUnknown: true,
      cliCommand: `check ${process.argv.slice(3).join(' ')}`
    });
  } catch (err: any) {
    console.error(`Error generating fresh snapshot: ${err.message}`);
    process.exit(4);
  }

  // 5. Assert no mutation occurred
  try {
    await assertNoMutation(guard, projectRoot);
  } catch (err: any) {
    console.error(`READ-ONLY PROTECTION FAILURE: ${err.message}`);
    process.exit(1);
  }

  // 6. Find and load existing snapshot if specified or default
  let existingSnapshotPath = options.snapshot;
  if (!existingSnapshotPath) {
    // Attempt default output path
    const resolvedOut = resolveOutputPath({
      projectRoot,
      configOut: config.output
    });
    existingSnapshotPath = resolvedOut.outputPath;
  }

  // 7. Check staleness against existing snapshot file
  if (fs.existsSync(existingSnapshotPath)) {
    console.log(`Comparing against existing snapshot: ${existingSnapshotPath}`);
    
    // Validate stale cache
    try {
      const existingContent = fs.readFileSync(existingSnapshotPath, 'utf8');
      const existingObj = JSON.parse(existingContent);
      
      const context: ValidationContext = {
        projectType: freshSnapshot.project.detectedType,
        strict,
        projectRoot
      };

      const freshArtifacts = freshSnapshot.artifacts.map((a: any) => ({
        relativePath: a.path,
        hash: a.hash
      }));

      const staleValidation = validateStaleCache(existingObj, freshArtifacts as any[], context);

      // Report any staleness issues
      if (staleValidation.errors.length > 0) {
        console.error('\n--- Snapshot Staleness Errors ---');
        for (const err of staleValidation.errors) {
          console.error(`[ERROR] ${err.message}`);
        }
        process.exit(3); // Exit code 3: snapshot stale/different
      }

      if (staleValidation.warnings.length > 0) {
        console.warn('\n--- Snapshot Staleness Warnings ---');
        for (const w of staleValidation.warnings) {
          console.warn(`[WARNING] ${w.message}`);
        }
      }

      // Check byte-identity comparison
      const comparison = compareSnapshot(freshSnapshot, existingSnapshotPath);
      if (!comparison.isIdentical) {
        console.error(`\n[ERROR] Snapshot comparison failed: ${comparison.diffMessage}`);
        process.exit(3); // Exit code 3
      }
    } catch (err: any) {
      console.error(`Error comparing snapshots: ${err.message}`);
      process.exit(3);
    }
  } else {
    console.log('No existing snapshot found to compare against. Validating in-memory state.');
  }

  // 8. Report validation errors and warnings
  const errors = freshSnapshot.validation.errors;
  const warnings = freshSnapshot.validation.warnings;

  if (errors.length > 0) {
    console.error('\n--- Validation Errors (Failed Gates/Rules) ---');
    for (const err of errors) {
      const srcStr = err.source ? ` (${err.source.path}${err.source.lineStart ? `:${err.source.lineStart}` : ''})` : '';
      console.error(`[FAIL] ${err.id}: ${err.message}${srcStr}`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\n--- Validation Warnings ---');
    for (const warn of warnings) {
      const srcStr = warn.source ? ` (${warn.source.path}${warn.source.lineStart ? `:${warn.source.lineStart}` : ''})` : '';
      console.warn(`[WARN] ${warn.id}: ${warn.message}${srcStr}`);
    }
  }

  console.log('\n--- Check Results ---');
  console.log(`Validation Status: ${freshSnapshot.validation.status.toUpperCase()}`);
  console.log(`Errors: ${errors.length}, Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.error('\nProject has validation errors. Failing check.');
    process.exit(1); // Exit code 1: validation failed
  }

  if (failOnWarning && warnings.length > 0) {
    console.error('\nProject has warnings and --fail-on-warning is set. Failing check.');
    process.exit(1);
  }

  console.log('\nAll checks passed successfully.');
  process.exit(0);
}
