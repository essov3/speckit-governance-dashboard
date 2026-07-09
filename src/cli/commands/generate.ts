import * as path from 'path';
import { resolveProjectRoot, loadConfig } from '../../core/paths/resolve-project-root.ts';
import { buildSnapshot } from '../../core/snapshot/build-snapshot.ts';
import { writeSnapshot } from '../../core/snapshot/write-snapshot.ts';
import { startReadOnlyGuard, assertNoMutation } from '../../core/validate/read-only-protection.ts';

export interface GenerateCommandOptions {
  projectRoot?: string;
  out?: string;
  deterministic?: boolean;
  adapter?: 'vanilla' | 'auto' | 'oarb';
  includeUnknown?: boolean;
  pretty?: boolean;
  quiet?: boolean;
}

export async function runGenerate(options: GenerateCommandOptions): Promise<void> {
  const quiet = !!options.quiet;

  if (!quiet) {
    console.log('SpecKit Governance Dashboard - Generating Snapshot...');
  }

  // 1. Resolve project root
  let projectRoot: string;
  try {
    projectRoot = resolveProjectRoot(options.projectRoot);
  } catch (err: any) {
    console.error(`Error resolving project root: ${err.message}`);
    process.exit(2);
  }

  if (!quiet) {
    console.log(`Target project root: ${projectRoot}`);
  }

  // 2. Start read-only guard
  const guard = await startReadOnlyGuard(projectRoot);

  // 3. Load config
  const config = loadConfig();
  const strict = options.pretty ? false : (config.strict || false); // fallback

  // 4. Build snapshot
  let snapshot;
  try {
    snapshot = await buildSnapshot({
      projectRoot,
      deterministic: !!options.deterministic,
      strict,
      adapterMode: options.adapter,
      includeUnknown: !!options.includeUnknown,
      cliCommand: `generate ${process.argv.slice(3).join(' ')}`
    });
  } catch (err: any) {
    console.error(`Error generating snapshot: ${err.message}`);
    process.exit(4);
  }

  // 5. Assert no mutation
  try {
    await assertNoMutation(guard, projectRoot);
  } catch (err: any) {
    console.error(`READ-ONLY PROTECTION FAILURE: ${err.message}`);
    process.exit(1);
  }

  // 6. Write snapshot
  const writeResult = writeSnapshot(
    snapshot,
    projectRoot,
    options.out,
    config.output
  );

  if (writeResult.warning && !quiet) {
    console.warn('\n' + writeResult.warning + '\n');
  }

  if (!quiet) {
    console.log(`Snapshot written successfully to: ${writeResult.outputPath}`);
    console.log('\n--- Generation Summary ---');
    console.log(`Project type: ${snapshot.project.detectedType}`);
    console.log(`Features found: ${snapshot.executive.featureSummary.total} (${snapshot.executive.featureSummary.verified} verified, ${snapshot.executive.featureSummary.implemented} implemented)`);
    console.log(`Gates parsed: ${snapshot.gates.length}`);
    console.log(`Decisions found: ${snapshot.decisions.length}`);
    console.log(`Diagnostics: ${snapshot.diagnostics.length} (${snapshot.validation.errors.length} errors, ${snapshot.validation.warnings.length} warnings)`);
    console.log('--------------------------');
  }
}
