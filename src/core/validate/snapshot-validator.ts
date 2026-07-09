import { ProjectStatusSnapshotSchema } from '../snapshot/snapshot-schema.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';
import { ValidationContext, ValidationResult } from './validator-types.ts';

/**
 * Validates a snapshot object against the Zod schema.
 */
export function validateSnapshot(
  snapshot: any,
  context: ValidationContext
): ValidationResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  const parsed = ProjectStatusSnapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path.join('.');
      errors.push(
        createDiagnostic({
          id: 'ERR_SNAPSHOT_SCHEMA_VIOLATION',
          severity: 'error',
          category: 'snapshot',
          message: `Snapshot schema violation at "${field}": ${issue.message}`
        })
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
