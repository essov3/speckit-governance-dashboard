import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';
import { toAbsolutePath, toRelativePath } from '../paths/normalize-path.ts';
import { classifyArtifact, ArtifactRole } from './artifact-role-classifier.ts';
import { hashFileContent } from '../hashing/hash-file.ts';
import { Diagnostic } from '../diagnostics/warnings.ts';

export interface Artifact {
  absolutePath: string;
  relativePath: string;
  role: ArtifactRole;
  featureNumber?: number;
  featureSlug?: string;
  extension: string;
  hash: string;
  sizeBytes: number;
  parser?: string;
  warnings: Diagnostic[];
}

export interface DiscoveryOptions {
  projectRoot: string;
  includeUnknown?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
}

/**
 * Discovers and classifies all SpecKit artifacts in a given project root.
 */
export async function discoverArtifacts(options: DiscoveryOptions): Promise<Artifact[]> {
  const projectRootAbs = toAbsolutePath(options.projectRoot);
  
  // Default directories to search: specs/** and .specify/**
  const defaultIncludes = [
    'specs/**/*',
    '.specify/**/*'
  ];

  // Default exclusions
  const defaultExcludes = [
    '**/node_modules/**',
    '**/vendor/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/.dashboard-cache/**'
  ];

  const includes = options.includePatterns && options.includePatterns.length > 0
    ? options.includePatterns
    : defaultIncludes;

  const excludes = options.excludePatterns && options.excludePatterns.length > 0
    ? [...defaultExcludes, ...options.excludePatterns]
    : defaultExcludes;

  // Perform glob search
  // fast-glob requires forward slashes even on Windows
  const searchRoot = projectRootAbs.replace(/\\/g, '/');
  
  const files = await glob(includes, {
    cwd: searchRoot,
    ignore: excludes,
    absolute: true,
    onlyFiles: true
  });

  const artifacts: Artifact[] = [];

  for (const absoluteFile of files) {
    const relativePath = toRelativePath(absoluteFile, projectRootAbs);
    const classification = classifyArtifact(relativePath);

    if (classification.role === 'unknown' && options.includeUnknown === false) {
      continue;
    }

    let sizeBytes = 0;
    try {
      const stats = fs.statSync(absoluteFile);
      sizeBytes = stats.size;
    } catch (e) {
      // Ignored, fallback to 0
    }

    const hash = hashFileContent(absoluteFile);
    const extension = path.extname(absoluteFile);

    artifacts.push({
      absolutePath: absoluteFile,
      relativePath,
      role: classification.role,
      featureNumber: classification.featureNumber,
      featureSlug: classification.featureSlug,
      extension,
      hash,
      sizeBytes,
      warnings: classification.warnings
    });
  }

  // Sort artifacts by relative path to ensure determinism
  artifacts.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return artifacts;
}
