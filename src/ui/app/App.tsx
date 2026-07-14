import React, { useCallback, useEffect, useState } from 'react';
import { ProjectStatusSnapshot } from '../../core/snapshot/snapshot-schema.ts';
import { loadSnapshot } from '../data/load-snapshot.ts';
import { loadWatchCapabilities, subscribeToSnapshotUpdates } from '../data/live-updates.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { SearchPalette, type SearchHit } from '../components/SearchPalette.tsx';
import { NAV_GROUPS, NAV_TITLES, type NavId } from './nav.ts';
import {
  Overview,
  FeatureTracker,
  PhaseGateBoard,
  CoverageMatrix,
  DecisionBoard,
  EvidenceHealth,
  RisksAndBlockers,
  ActivityFeed,
  ArtifactInventory,
  SpecsBrowser,
  SourceViewer
} from './routes/all-routes.tsx';

function severityBadge(severity: string) {
  if (severity === 'error') return <span className="badge badge-fail">Errors</span>;
  if (severity === 'warning') return <span className="badge badge-warn">Warnings</span>;
  return <span className="badge badge-pass">Healthy</span>;
}

function renderNavIcon(id: NavId) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  } as const;

  switch (id) {
    case 'overview':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      );
    case 'features':
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'gates':
      return (
        <svg {...props}>
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'risks':
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'coverage':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      );
    case 'decisions':
      return (
        <svg {...props}>
          <path d="M12 3v17" />
          <path d="M5 20h14" />
          <path d="M4 7h16" />
          <path d="m4 7 3 7h-6l3-7Z" />
          <path d="m14 7 3 7h-6l3-7Z" />
        </svg>
      );
    case 'evidence':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'specs':
      return (
        <svg {...props}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      );
    case 'artifacts':
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'excerpts':
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    default:
      return null;
  }
}

export const App: React.FC = () => {
  const [snapshot, setSnapshot] = useState<ProjectStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NavId>('overview');
  const [searchOpen, setSearchOpen] = useState(false);
  const [specPath, setSpecPath] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const [isWatching, setIsWatching] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('watch') !== 'false';
    }
    return true;
  });
  const [watchAvailable, setWatchAvailable] = useState(false);

  const toggleWatch = () => {
    const nextWatch = !isWatching;
    setIsWatching(nextWatch);
    localStorage.setItem('watch', nextWatch ? 'true' : 'false');
  };

  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await loadSnapshot();
      if (data) setSnapshot(data);
      setLoading(false);
    }
    void init();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    const refreshSnapshot = async () => {
      const data = await loadSnapshot();
      if (!cancelled && data) setSnapshot(data);
    };

    const connect = async () => {
      const capabilities = await loadWatchCapabilities();
      if (cancelled) return;
      setWatchAvailable(capabilities.enabled);

      if (isWatching && capabilities.enabled && capabilities.transport === 'server-sent-events') {
        unsubscribe = subscribeToSnapshotUpdates(refreshSnapshot, refreshSnapshot);
      }
    };

    void connect();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [isWatching]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (e.key === '/' && !typing && snapshot) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [snapshot]);

  const parseSnapshotFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSnapshot(parsed);
      } catch {
        alert('Invalid snapshot JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseSnapshotFile(file);
  };

  const openSpec = useCallback((path: string) => {
    setSpecPath(path);
    setActiveTab('specs');
  }, []);

  const handleSearchSelect = useCallback(
    (hit: SearchHit) => {
      setSearchOpen(false);
      if (hit.path && (hit.nav === 'specs' || hit.kind === 'artifact')) {
        openSpec(hit.path);
        return;
      }
      setActiveTab(hit.nav);
      if (hit.path && hit.kind !== 'page') {
        // Soft-navigate to related file when useful
        if (hit.kind === 'feature' || hit.kind === 'decision' || hit.kind === 'gate') {
          // stay on list page; path is still available via SourceLink
        }
      }
    },
    [openSpec]
  );

  const navigate = (id: NavId) => {
    setActiveTab(id);
    if (id !== 'specs') {
      // keep last spec path so returning to browser is sticky
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--text)',
              color: 'var(--text-inverse)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              margin: '0 auto 14px'
            }}
          >
            SK
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 650, marginBottom: 4 }}>Loading dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Reading project-status.json…</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="upload-screen">
        <div className="upload-card">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'var(--text)',
              color: 'var(--text-inverse)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              margin: '0 auto'
            }}
          >
            SK
          </div>
          <h2>SpecKit Governance</h2>
          <p>
            Load a <code>project-status.json</code> snapshot, or run{' '}
            <code>dashboard:serve</code> against a SpecKit project.
          </p>
          <div
            className={`dropzone ${dragOver ? 'dragover' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) parseSnapshotFile(file);
            }}
          >
            <p style={{ marginBottom: 14, color: 'var(--text-secondary)' }}>
              Drop snapshot here, or browse to select a file.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              Browse snapshot
            </label>
          </div>
          <div className="upload-hint">
            Markdown remains the single source of truth.
            <br />
            This dashboard never writes lifecycle state.
          </div>
        </div>
      </div>
    );
  }

  const renderRoute = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview data={snapshot} onOpenSpec={openSpec} onNavigate={setActiveTab} />;
      case 'features':
        return <FeatureTracker data={snapshot} onOpenSpec={openSpec} />;
      case 'gates':
        return <PhaseGateBoard data={snapshot} onOpenSpec={openSpec} />;
      case 'coverage':
        return <CoverageMatrix data={snapshot} onOpenSpec={openSpec} />;
      case 'decisions':
        return <DecisionBoard data={snapshot} onOpenSpec={openSpec} />;
      case 'evidence':
        return <EvidenceHealth data={snapshot} onOpenSpec={openSpec} />;
      case 'risks':
        return <RisksAndBlockers data={snapshot} onOpenSpec={openSpec} />;
      case 'activity':
        return <ActivityFeed data={snapshot} onOpenSpec={openSpec} />;
      case 'artifacts':
        return <ArtifactInventory data={snapshot} onOpenSpec={openSpec} />;
      case 'specs':
        return (
          <SpecsBrowser
            data={snapshot}
            initialPath={specPath}
            onPathChange={setSpecPath}
          />
        );
      case 'excerpts':
        return <SourceViewer data={snapshot} onOpenSpec={openSpec} />;
      default:
        return <Overview data={snapshot} onOpenSpec={openSpec} onNavigate={setActiveTab} />;
    }
  };

  const riskCount = snapshot.validation.errors.length + snapshot.validation.warnings.length;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">SK</div>
          <div className="sidebar-brand-text">
            <strong>SpecKit</strong>
            <span>Governance dashboard</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {group.items.map((item) => {
                const count =
                  item.id === 'features'
                    ? snapshot.features.length
                    : item.id === 'risks'
                      ? riskCount
                      : item.id === 'artifacts'
                        ? snapshot.artifacts.length
                        : item.id === 'decisions'
                          ? snapshot.decisions.length
                          : undefined;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.id)}
                  >
                    <span className="nav-icon" aria-hidden>
                      {renderNavIcon(item.id)}
                    </span>
                    <span>{item.label}</span>
                    {typeof count === 'number' && count > 0 ? (
                      <span className="nav-count">{count}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>Read-only</strong>
          Markdown is the source of truth. Snapshot is derived cache.
          <div style={{ marginTop: 6, color: 'var(--warn)' }}>
            Does not close gates or mark features verified.
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-meta">
            <h1>{snapshot.project.name}</h1>
            <p>
              {NAV_TITLES[activeTab]} · {snapshot.project.detectedType.replace(/-/g, ' ')}
            </p>
          </div>

          <div className="topbar-actions">
            <button type="button" className="search-trigger" onClick={() => setSearchOpen(true)}>
              <span>⌕</span>
              <span>Search…</span>
              <kbd>⌘K</kbd>
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleWatch}
              disabled={!watchAvailable}
              aria-label={watchAvailable ? (isWatching ? 'Stop auto-refresh' : 'Start auto-refresh') : 'Auto-refresh unavailable'}
              title={watchAvailable ? (isWatching ? 'Stop auto-refresh' : 'Start auto-refresh') : 'Run the dashboard with serve or watch to enable auto-refresh'}
              style={{ color: isWatching && watchAvailable ? 'var(--pass)' : 'currentColor', borderColor: isWatching && watchAvailable ? 'var(--pass-border)' : undefined }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isWatching && watchAvailable ? 'spin' : ''}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="content">{renderRoute()}</main>
      </div>

      <SearchPalette
        open={searchOpen}
        snapshot={snapshot}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSearchSelect}
      />
    </div>
  );
};

export default App;
