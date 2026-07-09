import * as fs from 'fs';
import { toDeterministicJson } from './deterministic-json.ts';

export interface ComparisonResult {
  isIdentical: boolean;
  diffMessage?: string;
}

/**
 * Compares a freshly built snapshot against an existing file on disk.
 */
export function compareSnapshot(
  freshSnapshot: any,
  existingSnapshotPath: string
): ComparisonResult {
  if (!fs.existsSync(existingSnapshotPath)) {
    return {
      isIdentical: false,
      diffMessage: `Existing snapshot file does not exist at "${existingSnapshotPath}"`
    };
  }

  try {
    const existingContent = fs.readFileSync(existingSnapshotPath, 'utf8');
    const existingObj = JSON.parse(existingContent);

    // Neutralize transient generation metadata for semantic comparison
    const freshCopy = JSON.parse(JSON.stringify(freshSnapshot));
    const existingCopy = JSON.parse(JSON.stringify(existingObj));
    if (freshCopy.generated && existingCopy.generated) {
      freshCopy.generated.command = existingCopy.generated.command;
      freshCopy.generated.generatedAt = existingCopy.generated.generatedAt;
    }

    const freshDeterministic = toDeterministicJson(freshCopy);
    const existingDeterministic = toDeterministicJson(existingCopy);

    if (freshDeterministic === existingDeterministic) {
      return { isIdentical: true };
    }

    // Attempt to locate a simple difference to report
    let diffMessage = 'Snapshot contents differ.';
    
    // Check fields
    if (freshSnapshot.executive?.highestSeverity !== existingObj.executive?.highestSeverity) {
      diffMessage = `Highest severity changed from "${existingObj.executive?.highestSeverity}" to "${freshSnapshot.executive?.highestSeverity}"`;
    } else if (freshSnapshot.artifacts.length !== existingObj.artifacts.length) {
      diffMessage = `Artifact count changed from ${existingObj.artifacts.length} to ${freshSnapshot.artifacts.length}`;
    } else if (freshSnapshot.features.length !== existingObj.features.length) {
      diffMessage = `Feature count changed from ${existingObj.features.length} to ${freshSnapshot.features.length}`;
    } else if (freshSnapshot.diagnostics.length !== existingObj.diagnostics.length) {
      diffMessage = `Diagnostics count changed from ${existingObj.diagnostics.length} to ${freshSnapshot.diagnostics.length}`;
    }

    return {
      isIdentical: false,
      diffMessage: `Snapshot is stale/different. Details: ${diffMessage}`
    };
  } catch (err) {
    return {
      isIdentical: false,
      diffMessage: `Failed to read or parse existing snapshot: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
