import * as path from 'path';
import { toAbsolutePath } from './normalize-path.ts';
/**
 * Normalizes a string to a safe path slug.
 */
export function getProjectSlug(projectRoot) {
    const base = path.basename(projectRoot);
    return base.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}
/**
 * Resolves the final snapshot output path and checks if it falls inside the target project.
 */
export function resolveOutputPath(params) {
    const { projectRoot, cliOut, configOut } = params;
    const targetProjectAbs = toAbsolutePath(projectRoot);
    let outputPath;
    let isExplicit = false;
    if (cliOut) {
        outputPath = toAbsolutePath(cliOut);
        isExplicit = true;
    }
    else if (configOut) {
        outputPath = toAbsolutePath(configOut);
        isExplicit = true;
    }
    else {
        // Default safe external mode
        const slug = getProjectSlug(targetProjectAbs);
        // Write inside the dashboard repository
        // Let's resolve the dashboard repo root. We can assume the dashboard's folder is process.cwd() or the folder of the running script.
        // Let's write to process.cwd()/.dashboard-cache/<slug>/project-status.json
        outputPath = path.resolve(process.cwd(), '.dashboard-cache', slug, 'project-status.json');
    }
    // Check if output path is inside the target project
    const relative = path.relative(targetProjectAbs, outputPath);
    const isInsideTargetProject = !relative.startsWith('..') && !path.isAbsolute(relative) && relative !== '';
    let warning;
    if (isInsideTargetProject && isExplicit) {
        warning = `WARNING: You are writing a generated dashboard snapshot inside the target SpecKit project.
This file is derived cache only and must not be edited manually.`;
    }
    return {
        outputPath,
        isInsideTargetProject,
        warning,
    };
}
