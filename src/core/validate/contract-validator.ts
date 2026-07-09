import { Task } from '../normalize/task-normalizer.ts';
import { ContractFragment } from '../adapters/adapter-types.ts';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';
import { ValidationContext, ValidationResult } from './validator-types.ts';

export function validateContracts(
  contracts: ContractFragment[],
  tasks: Task[],
  context: ValidationContext
): ValidationResult {
  const errors: Diagnostic[] = [];
  const warnings: Diagnostic[] = [];

  for (const contract of contracts) {
    // Check if contract is referenced by any task's referencedFiles
    const isReferenced = tasks.some(t => 
      t.referencedFiles && t.referencedFiles.some(fileRef => 
        contract.filePath.includes(fileRef) || fileRef.includes(contract.filePath)
      )
    );

    // Warning: Contract exists but no task references it.
    if (!isReferenced) {
      warnings.push(
        createDiagnostic({
          id: 'WARN_UNREFERENCED_CONTRACT',
          severity: 'warning',
          category: 'contract',
          message: `Contract file exists but is not referenced by any implementation task in tasks.md: "${contract.filePath}"`,
          source: { path: contract.filePath }
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
