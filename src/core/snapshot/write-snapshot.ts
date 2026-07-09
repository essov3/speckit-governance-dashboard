import * as fs from 'fs';
import * as path from 'react'; // wait, node's path module
import * as nodePath from 'path';
import { toDeterministicJson } from './deterministic-json.ts';
import { resolveOutputPath, ResolvedOutput } from '../paths/safe-output-path.ts';

export interface WriteSnapshotResult {
  outputPath: string;
  isInsideTargetProject: boolean;
  warning?: string;
}

/**
 * Writes the snapshot object to the resolved output path.
 * Ensures the target folder exists.
 */
export function writeSnapshot(
  snapshot: any,
  projectRoot: string,
  cliOut?: string,
  configOut?: string
): WriteSnapshotResult {
  const resolved = resolveOutputPath({
    projectRoot,
    cliOut,
    configOut
  });

  const dir = nodePath.dirname(resolved.outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write snapshot content
  const content = toDeterministicJson(snapshot);
  fs.writeFileSync(resolved.outputPath, content, 'utf8');

  return {
    outputPath: resolved.outputPath,
    isInsideTargetProject: resolved.isInsideTargetProject,
    warning: resolved.warning
  };
}
