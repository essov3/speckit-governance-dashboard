/**
 * Normalizes, deduplicates, and sorts tasks.
 */
export function normalizeTasks(parsedTasks, artifactPathMap // maps features to tasks file paths
) {
    const normalized = [];
    for (const t of parsedTasks) {
        const featNum = t.featureNumber || 0;
        const taskPath = artifactPathMap.get(String(featNum)) || '';
        normalized.push({
            taskId: t.taskId,
            featureNumber: featNum,
            label: t.label,
            checked: t.checked,
            phase: t.phase,
            parallel: t.parallel,
            dependencies: t.dependencies,
            referencedFiles: t.referencedFiles,
            source: {
                path: taskPath,
                line: t.line
            }
        });
    }
    // Sort by task ID
    return normalized.sort((a, b) => a.taskId.localeCompare(b.taskId, undefined, { numeric: true, sensitivity: 'base' }));
}
