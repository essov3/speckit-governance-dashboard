import * as fs from 'fs';
import { toDeterministicJson } from './deterministic-json.ts';
/**
 * Compares a freshly built snapshot against an existing file on disk.
 */
export function compareSnapshot(freshSnapshot, existingSnapshotPath) {
    if (!fs.existsSync(existingSnapshotPath)) {
        return {
            isIdentical: false,
            diffMessage: `Existing snapshot file does not exist at "${existingSnapshotPath}"`
        };
    }
    try {
        const existingContent = fs.readFileSync(existingSnapshotPath, 'utf8');
        const existingObj = JSON.parse(existingContent);
        // Make both deterministic (neutralize timestamps for comparison if needed, 
        // but check command compares deterministic outputs directly)
        const freshDeterministic = toDeterministicJson(freshSnapshot);
        const existingDeterministic = toDeterministicJson(existingObj);
        if (freshDeterministic === existingDeterministic) {
            return { isIdentical: true };
        }
        // Attempt to locate a simple difference to report
        let diffMessage = 'Snapshot contents differ.';
        // Check fields
        if (freshSnapshot.executive?.highestSeverity !== existingObj.executive?.highestSeverity) {
            diffMessage = `Highest severity changed from "${existingObj.executive?.highestSeverity}" to "${freshSnapshot.executive?.highestSeverity}"`;
        }
        else if (freshSnapshot.artifacts.length !== existingObj.artifacts.length) {
            diffMessage = `Artifact count changed from ${existingObj.artifacts.length} to ${freshSnapshot.artifacts.length}`;
        }
        else if (freshSnapshot.features.length !== existingObj.features.length) {
            diffMessage = `Feature count changed from ${existingObj.features.length} to ${freshSnapshot.features.length}`;
        }
        else if (freshSnapshot.diagnostics.length !== existingObj.diagnostics.length) {
            diffMessage = `Diagnostics count changed from ${existingObj.diagnostics.length} to ${freshSnapshot.diagnostics.length}`;
        }
        return {
            isIdentical: false,
            diffMessage: `Snapshot is stale/different. Details: ${diffMessage}`
        };
    }
    catch (err) {
        return {
            isIdentical: false,
            diffMessage: `Failed to read or parse existing snapshot: ${err instanceof Error ? err.message : String(err)}`
        };
    }
}
