import { Diagnostic } from '../diagnostics/warnings.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

export interface ValidationContext {
  projectType: 'vanilla-speckit' | 'governance-speckit' | 'unknown';
  strict: boolean;
  projectRoot: string;
}
