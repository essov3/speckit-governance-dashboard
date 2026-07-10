import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ProjectStatusSnapshot } from '../../core/snapshot/snapshot-schema.ts';
import type { NavId } from '../app/nav.ts';

export interface SearchHit {
  id: string;
  kind: 'page' | 'feature' | 'artifact' | 'decision' | 'gate' | 'issue';
  title: string;
  meta: string;
  nav: NavId;
  path?: string;
  icon: string;
}

interface SearchPaletteProps {
  open: boolean;
  snapshot: ProjectStatusSnapshot;
  onClose: () => void;
  onSelect: (hit: SearchHit) => void;
}

const PAGES: Array<{ nav: NavId; title: string; meta: string; icon: string }> = [
  { nav: 'overview', title: 'Overview', meta: 'Executive summary and readiness', icon: '◉' },
  { nav: 'features', title: 'Features', meta: 'Feature tracker and lifecycle', icon: '▦' },
  { nav: 'gates', title: 'Phase gates', meta: 'Readiness gate board', icon: '▣' },
  { nav: 'coverage', title: 'Coverage', meta: 'Capability coverage matrix', icon: '◫' },
  { nav: 'decisions', title: 'Decisions', meta: 'Decision records', icon: '⚖' },
  { nav: 'evidence', title: 'Evidence', meta: 'Evidence health scores', icon: '✓' },
  { nav: 'risks', title: 'Risks & blockers', meta: 'Validation errors and warnings', icon: '!' },
  { nav: 'activity', title: 'Activity', meta: 'Project activity feed', icon: '◷' },
  { nav: 'artifacts', title: 'Artifacts', meta: 'Discovered SpecKit files', icon: '📁' },
  { nav: 'specs', title: 'Specs browser', meta: 'View and render markdown files', icon: '≡' },
  { nav: 'excerpts', title: 'Excerpts', meta: 'Diagnostic source excerpts', icon: '⌀' }
];

function buildIndex(snapshot: ProjectStatusSnapshot): SearchHit[] {
  const hits: SearchHit[] = PAGES.map((p) => ({
    id: `page:${p.nav}`,
    kind: 'page',
    title: p.title,
    meta: p.meta,
    nav: p.nav,
    icon: p.icon
  }));

  for (const f of snapshot.features as any[]) {
    hits.push({
      id: `feature:${f.number}`,
      kind: 'feature',
      title: `#${String(f.number).padStart(3, '0')} ${f.title || f.slug}`,
      meta: `${f.lifecycle || ''} · ${f.slug}`,
      nav: 'features',
      path: f.sourceLinks?.[0]?.path,
      icon: '#'
    });
  }

  for (const a of snapshot.artifacts as any[]) {
    hits.push({
      id: `artifact:${a.path}`,
      kind: 'artifact',
      title: a.path.split(/[/\\]/).pop() || a.path,
      meta: `${a.role} · ${a.path}`,
      nav: 'specs',
      path: a.path,
      icon: '≡'
    });
  }

  for (const d of snapshot.decisions as any[]) {
    hits.push({
      id: `decision:${d.decisionId}`,
      kind: 'decision',
      title: `${d.decisionId} ${d.title || ''}`.trim(),
      meta: d.status || 'decision',
      nav: 'decisions',
      path: d.source?.path,
      icon: '⚖'
    });
  }

  for (const g of snapshot.gates as any[]) {
    hits.push({
      id: `gate:${g.gateId}`,
      kind: 'gate',
      title: `${g.gateId} ${g.title || ''}`.trim(),
      meta: g.status || 'gate',
      nav: 'gates',
      path: g.source?.path,
      icon: '▣'
    });
  }

  const issues = [
    ...(snapshot.validation?.errors || []).map((e) => ({ ...e, severity: 'error' })),
    ...(snapshot.validation?.warnings || []).map((w) => ({ ...w, severity: 'warning' }))
  ];
  for (const issue of issues as any[]) {
    hits.push({
      id: `issue:${issue.id}`,
      kind: 'issue',
      title: issue.message,
      meta: `${issue.severity || issue.severity || ''} · ${issue.id}`,
      nav: 'risks',
      path: issue.source?.path,
      icon: '!'
    });
  }

  return hits;
}

function scoreHit(hit: SearchHit, q: string): number {
  if (!q) return hit.kind === 'page' ? 2 : 0;
  const hay = `${hit.title} ${hit.meta} ${hit.path || ''}`.toLowerCase();
  if (hay === q) return 100;
  if (hay.startsWith(q)) return 80;
  if (hit.title.toLowerCase().includes(q)) return 60;
  if (hay.includes(q)) return 40;
  // token match
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.every((t) => hay.includes(t))) return 30;
  return -1;
}

export const SearchPalette: React.FC<SearchPaletteProps> = ({ open, snapshot, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const index = useMemo(() => buildIndex(snapshot), [snapshot]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scored = index
      .map((hit) => ({ hit, score: scoreHit(hit, q) }))
      .filter((x) => x.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 40)
      .map((x) => x.hit);
    return scored;
  }, [index, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[active]) {
        e.preventDefault();
        onSelect(results[active]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, active, onClose, onSelect]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="search-modal" role="dialog" aria-modal="true" aria-label="Search">
        <div className="search-input-row">
          <span aria-hidden>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, features, specs, decisions…"
            aria-label="Search dashboard"
          />
          <kbd style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>esc</kbd>
        </div>
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">No matches for “{query}”</div>
          ) : (
            results.map((hit, i) => (
              <button
                key={hit.id}
                type="button"
                className={`search-result ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => onSelect(hit)}
              >
                <span className="search-result-icon">{hit.icon}</span>
                <span className="search-result-body">
                  <span className="search-result-title">{hit.title}</span>
                  <span className="search-result-meta">{hit.meta}</span>
                </span>
                <span className="search-result-kind">{hit.kind}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
