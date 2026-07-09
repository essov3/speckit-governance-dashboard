import * as path from 'path';
import { Diagnostic, createDiagnostic } from '../diagnostics/warnings.ts';

export type ArtifactRole =
  | 'canonical-governance-state'
  | 'spec-source'
  | 'plan-source'
  | 'task-source'
  | 'checklist-source'
  | 'constitution-source'
  | 'active-feature-pointer'
  | 'phase-exit-source'
  | 'decision-record'
  | 'coverage-matrix'
  | 'delivery-ledger'
  | 'contract'
  | 'evidence'
  | 'generated-cache'
  | 'supporting-artifact'
  | 'unknown';

export interface ClassificationResult {
  role: ArtifactRole;
  featureNumber?: number;
  featureSlug?: string;
  warnings: Diagnostic[];
}

/**
 * Classifies an artifact based on its path, filename, and extension.
 */
export function classifyArtifact(relativePath: string): ClassificationResult {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  const filename = path.basename(normalizedPath);
  const lowercaseFilename = filename.toLowerCase();
  const warnings: Diagnostic[] = [];

  // Extract feature number and slug from specs/<num>-<slug>/...
  // Matches: specs/090-client-notification-plumbing/tasks.md, specs/001-user/plan.md, etc.
  let featureNumber: number | undefined;
  let featureSlug: string | undefined;

  const featureRegex = /^specs\/(\d+)-([^/]+)/i;
  const match = normalizedPath.match(featureRegex);
  if (match) {
    featureNumber = parseInt(match[1], 10);
    featureSlug = match[2];
  }

  // 1. Check specific filenames/paths
  if (normalizedPath === '.specify/memory/constitution.md' || lowercaseFilename === 'constitution.md') {
    return { role: 'constitution-source', featureNumber, featureSlug, warnings };
  }
  
  if (normalizedPath === '.specify/feature.json' || lowercaseFilename === 'feature.json') {
    return { role: 'active-feature-pointer', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'delivery-ledger.md' || lowercaseFilename === 'delivery_ledger.md') {
    return { role: 'delivery-ledger', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'product-coverage-matrix.md' || lowercaseFilename === 'coverage-matrix.md') {
    return { role: 'coverage-matrix', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'spec.md') {
    return { role: 'spec-source', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'plan.md') {
    return { role: 'plan-source', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'tasks.md') {
    return { role: 'task-source', featureNumber, featureSlug, warnings };
  }

  if (lowercaseFilename === 'phase-exit.md') {
    return { role: 'phase-exit-source', featureNumber, featureSlug, warnings };
  }

  // 2. Check path subfolders
  const pathParts = normalizedPath.split('/');
  
  // Checklist source specs/*/checklists/*.md
  if (pathParts.includes('checklists') && lowercaseFilename.endsWith('.md')) {
    return { role: 'checklist-source', featureNumber, featureSlug, warnings };
  }

  // Decisions specs/**/decisions/*.md
  if (pathParts.includes('decisions') && lowercaseFilename.endsWith('.md')) {
    return { role: 'decision-record', featureNumber, featureSlug, warnings };
  }

  // Contracts specs/*/contracts/** or specs/*/openapi/**
  if (pathParts.includes('contracts') || pathParts.includes('openapi')) {
    return { role: 'contract', featureNumber, featureSlug, warnings };
  }

  // Evidence specs/*/evidence/** or specs/*/reports/** or specs/*/artifacts/**
  // or specs/*/validation.md, verification.md, review.md, implementation-summary.md, qa.md, release.md
  const evidenceFiles = ['validation.md', 'verification.md', 'review.md', 'implementation-summary.md', 'qa.md', 'release.md'];
  if (
    pathParts.includes('evidence') ||
    pathParts.includes('reports') ||
    pathParts.includes('artifacts') ||
    evidenceFiles.includes(lowercaseFilename)
  ) {
    return { role: 'evidence', featureNumber, featureSlug, warnings };
  }

  // Supporting artifacts
  const supportingFiles = ['research.md', 'data-model.md', 'quickstart.md'];
  if (supportingFiles.includes(lowercaseFilename)) {
    return { role: 'supporting-artifact', featureNumber, featureSlug, warnings };
  }

  // Generated cache
  if (
    lowercaseFilename === 'project-status.json' ||
    lowercaseFilename === 'project-status.pretty.json' ||
    lowercaseFilename === 'artifact-inventory.json' ||
    normalizedPath.includes('.dashboard-cache') ||
    lowercaseFilename.endsWith('.snapshot.json')
  ) {
    return { role: 'generated-cache', featureNumber, featureSlug, warnings };
  }

  // Check if it is some other markdown file in specs/
  if (normalizedPath.startsWith('specs/') && lowercaseFilename.endsWith('.md')) {
    // If it's a markdown file in a feature directory but we don't know it, label it unknown or supporting
    return { role: 'supporting-artifact', featureNumber, featureSlug, warnings };
  }

  // Unknown
  warnings.push(
    createDiagnostic({
      id: 'WARN_UNKNOWN_ARTIFACT',
      severity: 'warning',
      category: 'discovery',
      message: `Unknown artifact discovered: ${relativePath}`,
      source: { path: relativePath }
    })
  );

  return {
    role: 'unknown',
    featureNumber,
    featureSlug,
    warnings
  };
}
