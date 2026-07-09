import { Artifact } from '../discovery/discover-artifacts.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';
import { ValidationContext, ValidationResult } from './validator-types.ts';

/**
 * Compares freshly scanned artifacts on disk against the artifact list in an existing snapshot.
 */
export function validateStaleCache(
  existingSnapshot: any,
  freshArtifacts: Artifact[],
  context: ValidationContext
): ValidationResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  if (!existingSnapshot || !existingSnapshot.artifacts) {
    const diag = createDiagnostic({
      id: 'ERR_NO_EXISTING_SNAPSHOT',
      severity: context.strict ? 'error' : 'warning',
      category: 'staleness',
      message: `No existing snapshot found to compare against.`
    });
    if (context.strict) errors.push(diag);
    else warnings.push(diag);
    return { isValid: errors.length === 0, errors, warnings };
  }

  const snapshotArtifacts = existingSnapshot.artifacts as any[];
  const snapshotArtMap = new Map<string, { hash: string }>();
  for (const art of snapshotArtifacts) {
    snapshotArtMap.set(art.path, { hash: art.hash });
  }

  // 1. Check for modified or new files
  for (const fresh of freshArtifacts) {
    const snap = snapshotArtMap.get(fresh.relativePath);
    if (!snap) {
      // New relevant file exists but not in snapshot
      const diag = createDiagnostic({
        id: 'ERR_STALE_NEW_FILE',
        severity: context.strict ? 'error' : 'warning',
        category: 'staleness',
        message: `New relevant source file exists on disk but is missing from snapshot: "${fresh.relativePath}"`,
        source: { path: fresh.relativePath }
      });
      if (context.strict) errors.push(diag);
      else warnings.push(diag);
    } else if (snap.hash !== fresh.hash) {
      // File hash changed
      const diag = createDiagnostic({
        id: 'ERR_STALE_MODIFIED_FILE',
        severity: context.strict ? 'error' : 'warning',
        category: 'staleness',
        message: `Source file was modified since snapshot was generated: "${fresh.relativePath}"`,
        source: { path: fresh.relativePath }
      });
      if (context.strict) errors.push(diag);
      else warnings.push(diag);
    }
  }

  // 2. Check for missing files (deleted from disk but in snapshot)
  const freshPaths = new Set(freshArtifacts.map(f => f.relativePath));
  for (const snapArt of snapshotArtifacts) {
    if (!freshPaths.has(snapArt.path)) {
      const diag = createDiagnostic({
        id: 'ERR_STALE_MISSING_FILE',
        severity: context.strict ? 'error' : 'warning',
        category: 'staleness',
        message: `Source file recorded in snapshot has been deleted or moved: "${snapArt.path}"`
      });
      if (context.strict) errors.push(diag);
      else warnings.push(diag);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
