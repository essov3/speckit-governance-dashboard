import * as fs from 'fs';
import * as path from 'path';
import { resolveProjectRoot } from '../../core/paths/resolve-project-root.ts';
import { discoverArtifacts } from '../../core/discovery/discover-artifacts.ts';
import { startReadOnlyGuard, assertNoMutation } from '../../core/validate/read-only-protection.ts';

export interface DoctorCommandOptions {
  projectRoot?: string;
}

export async function runDoctor(options: DoctorCommandOptions): Promise<void> {
  console.log('SpecKit Governance Dashboard - Running Doctor Diagnostics...');

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

  // 3. Scan directory
  const artifacts = await discoverArtifacts({
    projectRoot,
    includeUnknown: true
  });

  console.log(`\nDiscovered ${artifacts.length} total artifacts.`);

  const roles = new Map<string, number>();
  for (const art of artifacts) {
    roles.set(art.role, (roles.get(art.role) || 0) + 1);
  }

  console.log('\nDiscovered Roles Breakdown:');
  for (const [role, count] of roles.entries()) {
    console.log(`- ${role}: ${count} file(s)`);
  }

  // 4. Check for recommended SpecKit files
  console.log('\nChecking Recommended Files:');
  const recommended = [
    { path: '.specify/memory/constitution.md', name: 'Constitution checklist' },
    { path: '.specify/feature.json', name: 'Active feature pointer' }
  ];

  for (const rec of recommended) {
    const exists = fs.existsSync(path.resolve(projectRoot, rec.path));
    console.log(`[${exists ? 'YES' : 'NO'}] ${rec.name} (${rec.path})`);
  }

  // 5. Assert no mutation
  let mutationError = false;
  try {
    await assertNoMutation(guard, projectRoot);
  } catch (err: any) {
    mutationError = true;
    console.error(`\n[ALERT] Read-only violation! Target project was mutated: ${err.message}`);
  }

  console.log(`\nProject mutated during doctor command: ${mutationError ? 'YES (CRITICAL ERROR)' : 'NO (PASSED)'}`);

  // 6. Project health verdict
  const looksLikeSpecKit = artifacts.length > 0 && (roles.has('spec-source') || roles.has('task-source'));
  console.log(`\nVerdict: ${looksLikeSpecKit ? 'Target project looks like a valid SpecKit repository.' : 'Warning: Target project does not have standard specs/ directories or SpecKit artifacts.'}`);

  process.exit(mutationError ? 1 : 0);
}
