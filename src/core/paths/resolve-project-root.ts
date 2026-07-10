import * as fs from 'fs';
import * as path from 'path';
import { toAbsolutePath } from './normalize-path.ts';

export interface DashboardConfig {
  projectRoot?: string;
  adapter?: 'auto' | 'vanilla' | 'governance';
  output?: string;
  strict?: boolean;
  includeUnknown?: boolean;
  sourcePatterns?: {
    include?: string[];
    exclude?: string[];
  };
}

// These fields are forbidden to ensure that the config doesn't store governance state
const FORBIDDEN_CONFIG_FIELDS = [
  'gate', 'gates', 'lifecycle', 'readiness', 'status', 'statuses', 
  'decision', 'decisions', 'approval', 'approvals', 'taskOverride', 
  'taskOverrides', 'coverageOverride', 'coverageOverrides', 'P0', 'P1', 'P2', 'P3', 'P4'
];

/**
 * Validates a configuration object and throws if forbidden state fields are present.
 */
export function validateConfig(config: any): DashboardConfig {
  if (!config || typeof config !== 'object') {
    return {};
  }
  
  const keys = Object.keys(config);
  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    const isForbidden = FORBIDDEN_CONFIG_FIELDS.some(forbidden => 
      lowerKey.includes(forbidden.toLowerCase())
    );
    if (isForbidden) {
      throw new Error(`Config must not contain lifecycle/readiness state. Markdown remains the source of truth.`);
    }
  }

  return config as DashboardConfig;
}

/**
 * Reads and validates the config file if it exists.
 */
export function loadConfig(configPath?: string): DashboardConfig {
  const resolvedPath = configPath || path.resolve(process.cwd(), 'speckit-dashboard.config.json');
  if (fs.existsSync(resolvedPath)) {
    try {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const parsed = JSON.parse(content);
      return validateConfig(parsed);
    } catch (err: any) {
      if (err.message.includes('Markdown remains the source of truth')) {
        throw err;
      }
      // If it's just a JSON parsing or file reading error, warn or return empty
      return {};
    }
  }
  return {};
}

/**
 * Resolves the absolute project root according to the priority:
 * 1. CLI argument
 * 2. Env variable
 * 3. Config file
 * 4. Current working directory fallback
 */
export function resolveProjectRoot(cliPath?: string): string {
  // 1. CLI wins
  if (cliPath) {
    const resolved = toAbsolutePath(cliPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Project root path does not exist: ${resolved}`);
    }
    return resolved;
  }

  // 2. Env var wins
  if (process.env.SPECKIT_PROJECT_ROOT) {
    const resolved = toAbsolutePath(process.env.SPECKIT_PROJECT_ROOT);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Project root path specified in SPECKIT_PROJECT_ROOT does not exist: ${resolved}`);
    }
    return resolved;
  }

  // 3. Config file wins
  const config = loadConfig();
  if (config.projectRoot) {
    const resolved = toAbsolutePath(config.projectRoot);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Project root path specified in config file does not exist: ${resolved}`);
    }
    return resolved;
  }

  // 4. Fallback to CWD
  return toAbsolutePath(process.cwd());
}
