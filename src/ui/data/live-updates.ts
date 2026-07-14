export interface WatchCapabilities {
  enabled: boolean;
  transport: 'server-sent-events' | 'none';
  debounceMs?: number;
}

export async function loadWatchCapabilities(): Promise<WatchCapabilities> {
  try {
    const response = await fetch('/api/watch');
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      return { enabled: false, transport: 'none' };
    }

    const data = await response.json();
    return {
      enabled: data.enabled === true,
      transport: data.transport === 'server-sent-events' ? 'server-sent-events' : 'none',
      debounceMs: typeof data.debounceMs === 'number' ? data.debounceMs : undefined
    };
  } catch {
    return { enabled: false, transport: 'none' };
  }
}

export function subscribeToSnapshotUpdates(
  onSnapshot: () => void | Promise<void>,
  onConnected?: () => void | Promise<void>
): () => void {
  const events = new EventSource('/api/events');

  const handleSnapshot = () => void onSnapshot();
  const handleConnected = () => void onConnected?.();

  events.addEventListener('snapshot', handleSnapshot);
  events.addEventListener('connected', handleConnected);

  return () => {
    events.removeEventListener('snapshot', handleSnapshot);
    events.removeEventListener('connected', handleConnected);
    events.close();
  };
}
