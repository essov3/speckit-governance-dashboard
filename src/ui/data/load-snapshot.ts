import { ProjectStatusSnapshot } from '../../core/snapshot/snapshot-schema.ts';

/**
 * Attempts to fetch the project-status.json snapshot from the local server API.
 * Returns null if the fetch fails or is not available.
 */
export async function loadSnapshot(): Promise<ProjectStatusSnapshot | null> {
  try {
    const response = await fetch('/project-status.json');
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data as ProjectStatusSnapshot;
  } catch (e) {
    return null;
  }
}
