import { ActivityFragment } from '../adapters/adapter-types.ts';

export interface ActivityEvent {
  event: string;
  featureNumber?: number;
  gateId?: string;
  decisionId?: string;
  commitSha?: string;
  date?: string;
  notes?: string;
  source: {
    path: string;
    lineStart?: number;
  };
}

/**
 * Aggregates, normalizes, and sorts the activity feed.
 */
export function normalizeActivities(
  parsedActivities: ActivityFragment[],
  pathMap: Map<string, string> // maps fragments to paths
): ActivityEvent[] {
  const normalized: ActivityEvent[] = [];

  for (let i = 0; i < parsedActivities.length; i++) {
    const act = parsedActivities[i];
    const key = `${act.event}-${act.featureNumber}-${act.gateId}-${act.decisionId}`;
    const filePath = pathMap.get(key) || '';

    normalized.push({
      event: act.event,
      featureNumber: act.featureNumber,
      gateId: act.gateId,
      decisionId: act.decisionId,
      commitSha: act.commitSha,
      date: act.date,
      notes: act.notes,
      source: {
        path: filePath,
        lineStart: act.lineStart || 1
      }
    });
  }

  // Sort by date if available, otherwise path and line number
  return normalized.sort((a, b) => {
    if (a.date && b.date) {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateB - dateA; // Newest first
      }
    }
    
    // Fallback: sort by path
    const pathCompare = a.source.path.localeCompare(b.source.path);
    if (pathCompare !== 0) return pathCompare;
    
    // Fallback: sort by line number
    return (a.source.lineStart || 0) - (b.source.lineStart || 0);
  });
}
