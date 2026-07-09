import { TaskFragment } from '../adapters/adapter-types.ts';

export interface Task {
  taskId: string;
  featureNumber: number;
  label: string;
  checked: boolean;
  phase?: string;
  parallel: boolean;
  dependencies?: string[];
  referencedFiles?: string[];
  source: {
    path: string;
    line: number;
  };
}

/**
 * Normalizes, deduplicates, and sorts tasks.
 */
export function normalizeTasks(
  parsedTasks: TaskFragment[],
  artifactPathMap: Map<string, string> // maps features to tasks file paths
): Task[] {
  const normalized: Task[] = [];

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
