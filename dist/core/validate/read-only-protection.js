import { discoverArtifacts } from '../discovery/discover-artifacts.ts';
/**
 * Captures the current state of source artifacts in the project root.
 */
export async function startReadOnlyGuard(projectRoot) {
    const artifacts = await discoverArtifacts({
        projectRoot,
        includeUnknown: true
    });
    const initialHashes = new Map();
    for (const art of artifacts) {
        initialHashes.set(art.relativePath, art.hash);
    }
    return { initialHashes };
}
/**
 * Asserts that no source files have been modified.
 * Throws a hard error if any changes are detected.
 */
export async function assertNoMutation(guard, projectRoot) {
    const currentArtifacts = await discoverArtifacts({
        projectRoot,
        includeUnknown: true
    });
    for (const fresh of currentArtifacts) {
        const originalHash = guard.initialHashes.get(fresh.relativePath);
        if (originalHash === undefined) {
            // A new file was added during execution!
            throw new Error(`Read-only violation: target source artifact was added during dashboard command: "${fresh.relativePath}"`);
        }
        if (originalHash !== fresh.hash) {
            // Hash changed!
            throw new Error(`Read-only violation: target source artifact changed during dashboard command: "${fresh.relativePath}"`);
        }
    }
    // Check if any original files are missing now
    for (const originalPath of guard.initialHashes.keys()) {
        const stillExists = currentArtifacts.some(art => art.relativePath === originalPath);
        if (!stillExists) {
            throw new Error(`Read-only violation: target source artifact was deleted during dashboard command: "${originalPath}"`);
        }
    }
}
