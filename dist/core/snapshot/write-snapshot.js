import * as fs from 'fs';
import * as nodePath from 'path';
import { toDeterministicJson } from './deterministic-json.ts';
import { resolveOutputPath } from '../paths/safe-output-path.ts';
/**
 * Writes the snapshot object to the resolved output path.
 * Ensures the target folder exists.
 */
export function writeSnapshot(snapshot, projectRoot, cliOut, configOut) {
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
