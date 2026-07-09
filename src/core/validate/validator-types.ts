import { Diagnostic } from '../diagnostics/warnings.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: Diagnostic[];
  warnings: Diagnostic[];
}

export interface ValidationContext {
  projectType: 'vanilla-speckit' | 'governance-speckit' | 'oarb-governance' | 'unknown';
  strict: boolean;
  projectRoot: string;
}
