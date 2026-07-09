export type DiagnosticCategory =
  | 'discovery'
  | 'parsing'
  | 'lifecycle'
  | 'gate'
  | 'decision'
  | 'coverage'
  | 'evidence'
  | 'contract'
  | 'snapshot'
  | 'staleness'
  | 'read-only';

export type DiagnosticSeverity = 'info' | 'warning' | 'error';

export interface SourceLocation {
  path: string;
  lineStart?: number;
  lineEnd?: number;
  excerpt?: string;
}

export interface Diagnostic {
  id: string; // Unique error code, e.g., 'ERR_MISSING_SPEC', 'ERR_CLOSED_GATE_MISSING_CHILDREN'
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  source?: SourceLocation;
  relatedSources?: SourceLocation[];
  suggestedAction?: string;
}

export function createDiagnostic(params: {
  id: string;
  severity: DiagnosticSeverity;
  category: DiagnosticCategory;
  message: string;
  source?: SourceLocation;
  relatedSources?: SourceLocation[];
  suggestedAction?: string;
}): Diagnostic {
  return {
    id: params.id,
    severity: params.severity,
    category: params.category,
    message: params.message,
    source: params.source,
    relatedSources: params.relatedSources,
    suggestedAction: params.suggestedAction,
  };
}
