import React, { useEffect, useMemo, useState } from 'react';
import { ProjectStatusSnapshot } from '../../../core/snapshot/snapshot-schema.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { SourceLink } from '../../components/SourceLink.tsx';
import { EmptyState } from '../../components/EmptyState.tsx';
import { PageHeader } from '../../components/PageHeader.tsx';
import { MarkdownViewer } from '../../components/MarkdownViewer.tsx';
import { loadSourceFile, type FileListItem } from '../../data/load-file.ts';
import { NavId } from '../nav.ts';

export type OpenSpecFn = (path: string) => void;

// -------------------------------------------------------------
// 1. Overview
// -------------------------------------------------------------

const AnalyticsVisuals: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const { executive, validation } = data;
  
  const totalFeatures = executive.featureSummary.total || 0;
  const verified = executive.featureSummary.verified || 0;
  const implemented = executive.featureSummary.implemented || 0;
  const pending = Math.max(0, totalFeatures - verified - implemented);

  const errors = validation.errors.length;
  const warnings = validation.warnings.length;
  const totalIssues = errors + warnings;

  const size = 140;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let featureOffset = 0;
  const featureSegments = totalFeatures > 0 ? [
    { value: verified / totalFeatures, color: 'var(--pass)' },
    { value: implemented / totalFeatures, color: 'var(--info)' },
    { value: pending / totalFeatures, color: 'var(--bg-muted)' }
  ] : [ { value: 1, color: 'var(--bg-muted)' } ];

  return (
    <div className="card-grid" style={{ marginBottom: 16 }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px' }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            {featureSegments.map((seg, i) => {
              const dash = Math.max(0, seg.value * circumference - (seg.value > 0 && seg.value < 1 ? 2 : 0));
              const offset = -featureOffset * circumference;
              featureOffset += seg.value;
              return (
                <circle 
                  key={i} 
                  cx={size/2} cy={size/2} r={radius} 
                  fill="none" stroke={seg.color} strokeWidth={strokeWidth} 
                  strokeDasharray={`${dash} ${circumference}`} 
                  strokeDashoffset={offset} 
                  strokeLinecap="butt"
                  style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }} 
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{totalFeatures > 0 ? Math.round((verified/totalFeatures)*100) : 0}%</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4, fontWeight: 600 }}>Verified</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Feature Progress</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--pass)' }} />
                Verified
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{verified}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--info)' }} />
                Implemented
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{implemented}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
                <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--bg-muted)' }} />
                Pending
              </div>
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{pending}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <div className="card-title">Validation Health</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 8, marginTop: 16, marginBottom: 16, flex: 1 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
             <div style={{ width: '100%', maxWidth: 48, background: 'var(--fail)', borderRadius: '4px 4px 0 0', height: totalIssues > 0 ? `${Math.max(4, (errors/totalIssues)*100)}%` : 0, transition: 'height 1s ease-out' }} />
             <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{errors}</div>
             <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Blockers</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
             <div style={{ width: '100%', maxWidth: 48, background: 'var(--warn)', borderRadius: '4px 4px 0 0', height: totalIssues > 0 ? `${Math.max(4, (warnings/totalIssues)*100)}%` : 0, transition: 'height 1s ease-out' }} />
             <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{warnings}</div>
             <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Warnings</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 8, height: '100%' }}>
             <div style={{ width: '100%', maxWidth: 48, background: 'var(--pass)', borderRadius: '4px 4px 0 0', height: totalIssues === 0 ? '100%' : '10%', transition: 'height 1s ease-out' }} />
             <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{totalIssues === 0 ? '100%' : ''}</div>
             <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Healthy</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export const Overview: React.FC<{
  data: ProjectStatusSnapshot;
  onOpenSpec?: OpenSpecFn;
  onNavigate?: (tab: NavId) => void;
}> = ({ data, onOpenSpec, onNavigate }) => {
  const { executive, project, validation } = data;
  const isOarB = project.detectedType === 'oarb-governance';
  const showEngineCompleteWarning = isOarB && !executive.engineCompleteDeclared?.value;
  const constitutionPct =
    project.constitution && project.constitution.checksCount > 0
      ? Math.round((project.constitution.passedChecksCount / project.constitution.checksCount) * 100)
      : null;

  const activeFeatureData = useMemo(() => {
    if (!project.activeFeature) return null;
    return (data.features as any[]).find(f => f.number === project.activeFeature?.number);
  }, [data.features, project.activeFeature]);

  const specLink = activeFeatureData?.sourceLinks?.find((l: any) => l.role === 'spec-source')?.path;
  const planLink = activeFeatureData?.sourceLinks?.find((l: any) => l.role === 'plan-source')?.path;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Read-only snapshot of SpecKit project state derived from Markdown artifacts."
      />

      {showEngineCompleteWarning && (
        <div className="alert alert-warn">
          <div className="alert-title">ENGINE_COMPLETE not declared</div>
          <div className="alert-body">
            OAR B readiness mode is active, but engine completeness is not declared in the delivery ledger.
          </div>
        </div>
      )}

      {validation.status === 'fail' && (
        <div className="alert alert-fail">
          <div className="alert-title">Governance validation failed</div>
          <div className="alert-body">
            {validation.errors.length} critical issue{validation.errors.length === 1 ? '' : 's'} found.
            Fix the underlying Markdown artifacts to resolve.
          </div>
        </div>
      )}

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Project type</div>
          <div className="metric-value sm">{project.detectedType.replace(/-/g, ' ')}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Features</div>
          <div className="metric-value">{executive.featureSummary.total}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Verified</div>
          <div className="metric-value" style={{ color: 'var(--pass)' }}>
            {executive.featureSummary.verified}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Implemented</div>
          <div className="metric-value" style={{ color: 'var(--info)' }}>
            {executive.featureSummary.implemented}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Open issues</div>
          <div className="metric-value" style={{ color: executive.warnings.length ? 'var(--warn)' : undefined }}>
            {executive.warnings.length}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Validation</div>
          <div className="metric-value sm" style={{ marginTop: 6 }}>
            <StatusBadge status={validation.status.toUpperCase()} />
          </div>
        </div>
      </div>

      <AnalyticsVisuals data={data} />

      <div className="card-grid">
        <div>
          {/* Current Spec State */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Current Spec State</span>
              {project.activeFeature && (
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('features')}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-muted)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View Tracker →
                </button>
              )}
            </div>
            {project.activeFeature ? (
              <div>
                {/* Active Spec Title */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span className="mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>
                    #{String(project.activeFeature.number).padStart(3, '0')}
                  </span>
                  <strong style={{ fontSize: 14 }}>
                    {project.activeFeature.title || project.activeFeature.slug}
                  </strong>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Grid of Spec/Plan source files */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {/* Spec File */}
                    <div
                      onClick={() => onOpenSpec && specLink && onOpenSpec(specLink)}
                      style={{
                        padding: '10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                      className={specLink ? "hover-border" : ""}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Current Spec
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>
                          spec.md
                        </span>
                        {activeFeatureData?.specExists ? (
                          <span className="badge badge-pass" style={{ fontSize: 9, padding: '1px 4px' }}>Detected</span>
                        ) : (
                          <span className="badge badge-fail" style={{ fontSize: 9, padding: '1px 4px' }}>Missing</span>
                        )}
                      </div>
                    </div>

                    {/* Plan File */}
                    <div
                      onClick={() => onOpenSpec && planLink && onOpenSpec(planLink)}
                      style={{
                        padding: '10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                      className={planLink ? "hover-border" : ""}
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Plan
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 500 }}>
                          plan.md
                        </span>
                        {activeFeatureData?.planExists ? (
                          <span className="badge badge-pass" style={{ fontSize: 9, padding: '1px 4px' }}>Detected</span>
                        ) : (
                          <span className="badge badge-fail" style={{ fontSize: 9, padding: '1px 4px' }}>Missing</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tasks Progress */}
                  <div
                    onClick={() => onNavigate && onNavigate('features')}
                    style={{
                      padding: '12px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      cursor: 'pointer'
                    }}
                    className="hover-border"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Tasks Progress
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        {activeFeatureData?.taskCompletionPct ?? 0}% Completed
                      </span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: 'var(--border)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        width: `${activeFeatureData?.taskCompletionPct ?? 0}%`,
                        backgroundColor: (activeFeatureData?.taskCompletionPct ?? 0) === 100 ? 'var(--pass)' : 'var(--warn)',
                        height: '100%'
                      }} />
                    </div>
                    {activeFeatureData?.nextAction && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, display: 'flex', gap: 4 }}>
                        <strong style={{ color: 'var(--text-secondary)' }}>Next:</strong> {activeFeatureData.nextAction}
                      </div>
                    )}
                  </div>

                  {/* Lifecycle */}
                  {activeFeatureData?.lifecycle && (
                    <div
                      onClick={() => onNavigate && onNavigate('gates')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      className="hover-border"
                    >
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Lifecycle State
                      </span>
                      <StatusBadge status={activeFeatureData.lifecycle} />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                No active feature pointer in <code>.specify/feature.json</code>.
              </p>
            )}
          </div>

          {/* Readiness gates */}
          <div className="card">
            <div
              className="card-title hover-border"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => onNavigate && onNavigate('gates')}
            >
              <span>Readiness gates</span>
              <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>Detail View →</span>
            </div>
            {data.gates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No gates detected.</p>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(data.gates as any[]).map((g) => (
                  <div
                    key={g.gateId}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigate) onNavigate('gates');
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      minWidth: 88,
                      textAlign: 'center'
                    }}
                    className="hover-border"
                  >
                    <div className="mono" style={{ fontWeight: 700, marginBottom: 6 }}>
                      {g.gateId}
                    </div>
                    <StatusBadge status={g.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-title">Snapshot</div>
          <dl className="meta-list">
            <div>
              <dt>Generated</dt>
              <dd>{data.generated.generatedAt}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>v{data.generated.generatorVersion}</dd>
            </div>
            <div>
              <dt>Project root</dt>
              <dd>{data.generated.projectRoot}</dd>
            </div>
            {project.constitution && (
              <div>
                <dt>Constitution</dt>
                <dd style={{ fontFamily: 'var(--font-sans)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div className="progress" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${constitutionPct}%` }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12 }}>
                      {project.constitution.passedChecksCount}/{project.constitution.checksCount}
                    </span>
                  </div>
                  {onOpenSpec && project.constitution.path && (
                    <div style={{ marginTop: 8 }}>
                      <SourceLink path={project.constitution.path} onOpen={onOpenSpec} />
                    </div>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Features
// -------------------------------------------------------------
export const FeatureTracker: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const statuses = useMemo(
    () => Array.from(new Set((data.features as any[]).map((f) => f.lifecycle).filter(Boolean))).sort(),
    [data.features]
  );

  const filtered = (data.features as any[]).filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      String(f.number).includes(q) ||
      (f.slug || '').toLowerCase().includes(q) ||
      (f.title || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || f.lifecycle === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Features"
        description="Lifecycle and task progress for each SpecKit feature folder."
      />

      <div className="toolbar">
        <div className="field" style={{ flex: 1, maxWidth: 320 }}>
          <span style={{ color: 'var(--text-muted)' }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by id, slug, or title…"
            aria-label="Search features"
          />
        </div>
        <div className="field" style={{ minWidth: 160 }}>
          <span className="field-label">Status</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-spacer" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} of {(data.features as any[]).length}
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feature</th>
              <th>Status</th>
              <th>Artifacts</th>
              <th>Progress</th>
              <th>Next action</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.number}>
                <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                  {String(f.number).padStart(3, '0')}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{f.title || f.slug}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.slug}</div>
                </td>
                <td>
                  <StatusBadge status={f.lifecycle} />
                </td>
                <td>
                  <div className="chip-row">
                    <span className={`chip ${f.specExists ? 'ok' : ''}`}>spec</span>
                    <span className={`chip ${f.planExists ? 'ok' : ''}`}>plan</span>
                    <span className={`chip ${f.tasksExists ? 'ok' : ''}`}>tasks</span>
                    <span className={`chip ${f.phaseExitExists ? 'ok' : ''}`}>exit</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
                    <div className="progress" style={{ width: 72 }}>
                      <div className="progress-fill" style={{ width: `${f.taskCompletionPct || 0}%` }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12 }}>
                      {f.taskCompletionPct || 0}%
                    </span>
                  </div>
                </td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 220 }}>
                  {f.nextAction}
                </td>
                <td>
                  <SourceLink path={f.sourceLinks?.[0]?.path || ''} onOpen={onOpenSpec} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>
                  No features match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. Gates
// -------------------------------------------------------------
export const PhaseGateBoard: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const hasGates = (data.gates as any[]).some(
    (g) => (g.requiredChildren?.length || 0) > 0 || g.status !== 'OPEN'
  );

  return (
    <div>
      <PageHeader title="Phase gates" description="Readiness gates derived from delivery ledger Markdown." />

      {!hasGates ? (
        <EmptyState
          title="No gate model detected"
          description={
            <>
              Define a delivery ledger (e.g. <code>specs/.../delivery-ledger.md</code>) to enable phase gates.
            </>
          }
        />
      ) : (
        <div className="gate-grid">
          {(data.gates as any[]).map((g) => {
            const isClosed = ['CLOSED', 'COMPLETE', 'VERIFIED'].includes(String(g.status).toUpperCase());
            return (
              <div key={g.gateId} className={`gate-card ${isClosed ? 'closed' : ''}`}>
                <div className="gate-card-head">
                  <span className="gate-id">{g.gateId}</span>
                  <StatusBadge status={g.status} />
                </div>
                <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>{g.title}</div>

                {g.requiredChildren?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                      REQUIRED CHILDREN
                    </div>
                    <div className="chip-row">
                      {g.requiredChildren.map((cId: number) => {
                        const ok = g.verifiedChildren?.includes(cId);
                        return (
                          <span key={cId} className={`chip ${ok ? 'ok' : 'bad'}`}>
                            #{String(cId).padStart(3, '0')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {g.openBlockers?.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--fail)', marginBottom: 4, fontWeight: 600 }}>
                      BLOCKERS
                    </div>
                    <ul style={{ paddingLeft: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {g.openBlockers.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {g.source?.path && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                      marginTop: 4,
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <span>Source</span>
                    <SourceLink path={g.source.path} line={g.source.lineStart} onOpen={onOpenSpec} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 4. Coverage
// -------------------------------------------------------------
const parseState = (stateStr: string) => {
  if (!stateStr) return { badge: 'UNKNOWN', details: '' };
  const trimmed = stateStr.trim();
  const match = trimmed.match(/^([A-Za-z0-9_\-]+)\s*(.*)$/);
  if (match) {
    const badge = match[1];
    const details = match[2].trim();
    return { badge, details };
  }
  return { badge: trimmed, details: '' };
};

const parseDetails = (value: string) => {
  if (!value) return { core: '', details: '' };
  const trimmed = value.trim();
  const parenIdx = trimmed.indexOf('(');
  if (parenIdx !== -1) {
    const core = trimmed.substring(0, parenIdx).trim();
    const details = trimmed.substring(parenIdx).trim();
    return { core, details };
  }
  return { core: trimmed, details: '' };
};

const renderDetailsCell = (value: string | undefined, isMono = false) => {
  if (!value || value === '—') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  
  const { core, details } = parseDetails(value);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span className={isMono ? "mono" : ""} style={{ fontWeight: isMono ? 500 : 'normal' }}>
        {core}
      </span>
      {details && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.3' }}>
          {details}
        </span>
      )}
    </div>
  );
};

export const CoverageMatrix: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'in-progress' | 'deferred' | 'missing'>('all');

  const coverageData = (data.coverage as any[]) || [];

  // Compute status summary metrics
  const { total, verified, inProgress, deferred, missing } = useMemo(() => {
    let verified = 0;
    let deferred = 0;
    let inProgress = 0;
    let missing = 0;

    for (const row of coverageData) {
      const s = (row.state || '').toUpperCase();
      if (s.includes('COMPLETE') || s.includes('VERIFIED') || s.includes('PASSED')) {
        verified++;
      } else if (s.includes('DEFERRED')) {
        deferred++;
      } else if (s.includes('PROGRESS') || s.includes('PLANNED')) {
        inProgress++;
      } else {
        missing++;
      }
    }

    return {
      total: coverageData.length,
      verified,
      inProgress,
      deferred,
      missing
    };
  }, [coverageData]);

  const rows = useMemo(() => {
    return coverageData.filter((row) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const s = (row.state || '').toUpperCase();
        const isVerified = s.includes('COMPLETE') || s.includes('VERIFIED') || s.includes('PASSED');
        const isDeferred = s.includes('DEFERRED');
        const isProgress = s.includes('PROGRESS') || s.includes('PLANNED');
        
        if (statusFilter === 'verified' && !isVerified) return false;
        if (statusFilter === 'deferred' && !isDeferred) return false;
        if (statusFilter === 'in-progress' && !isProgress) return false;
        if (statusFilter === 'missing' && (isVerified || isDeferred || isProgress)) return false;
      }
      
      // 2. Text Search
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (row.capability || '').toLowerCase().includes(q) ||
        (row.responsibleChild || '').toLowerCase().includes(q) ||
        (row.state || '').toLowerCase().includes(q) ||
        (row.clientContractStatus || '').toLowerCase().includes(q) ||
        (row.adminConsoleStatus || '').toLowerCase().includes(q)
      );
    });
  }, [coverageData, search, statusFilter]);

  return (
    <div>
      <PageHeader title="Coverage matrix" description="Product capability coverage from Markdown checklists." />

      {coverageData.length === 0 ? (
        <EmptyState
          title="Coverage matrix not found"
          description={
            <>
              Create <code>product-coverage-matrix.md</code> under your readiness program to populate this view.
            </>
          }
        />
      ) : (
        <>
          <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, maxWidth: 320 }}>
              <span style={{ color: 'var(--text-muted)' }}>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter capabilities…"
              />
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'all' ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'all' ? 'var(--accent)' : 'var(--text)',
                  fontWeight: statusFilter === 'all' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                All ({total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('verified')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'verified' ? 'var(--pass-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'verified' ? 'var(--pass)' : 'var(--text)',
                  fontWeight: statusFilter === 'verified' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Verified ({verified})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in-progress')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'in-progress' ? 'var(--warn-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'in-progress' ? 'var(--warn)' : 'var(--text)',
                  fontWeight: statusFilter === 'in-progress' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                In Progress ({inProgress})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('deferred')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'deferred' ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'deferred' ? 'var(--accent)' : 'var(--text)',
                  fontWeight: statusFilter === 'deferred' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Deferred ({deferred})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('missing')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'missing' ? 'var(--fail-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'missing' ? 'var(--fail)' : 'var(--text)',
                  fontWeight: statusFilter === 'missing' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Missing ({missing})
              </button>
            </div>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {rows.length} of {total} rows
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Capability</th>
                  <th style={{ width: '20%' }}>Status</th>
                  <th style={{ width: '15%' }}>Feature</th>
                  <th style={{ width: '8%', textAlign: 'center' }}>Gate</th>
                  <th style={{ width: '12%' }}>Client Contract</th>
                  <th style={{ width: '12%' }}>Admin Console</th>
                  <th style={{ width: '12%' }}>Evidence</th>
                  <th style={{ width: '8%' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const parsed = parseState(row.state);
                  const isComplete = parsed.badge.toUpperCase().includes('COMPLETE') || 
                                     parsed.badge.toUpperCase().includes('VERIFIED') ||
                                     parsed.badge.toUpperCase().includes('PASSED');
                  
                  return (
                    <tr key={idx}>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{row.capability}</div>
                        {row.frReferences?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                            {row.frReferences.map((fr: string) => {
                              const isFR018 = fr.toUpperCase() === 'FR-018' || fr.toUpperCase() === 'FR018';
                              return (
                                <span
                                  key={fr}
                                  className={isFR018 ? "badge badge-warn" : "badge badge-info"}
                                  style={{
                                    fontSize: 10,
                                    padding: '1px 6px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    ...(isFR018 ? {
                                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                      color: 'var(--warn)',
                                      border: '1px solid rgba(245, 158, 11, 0.3)'
                                    } : {
                                      backgroundColor: 'var(--bg-muted)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-muted)'
                                    })
                                  }}
                                >
                                  {fr}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <StatusBadge status={parsed.badge} />
                          {parsed.details && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: '1.3' }}>
                              {parsed.details}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {renderDetailsCell(row.responsibleChild, true)}
                      </td>
                      <td className="mono" style={{ verticalAlign: 'top', textAlign: 'center', fontWeight: 600 }}>
                        {row.gate ? (
                          <span style={{
                            backgroundColor: 'var(--bg-muted)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                            fontSize: 11
                          }}>
                            {row.gate}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {renderDetailsCell(row.clientContractStatus)}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {renderDetailsCell(row.adminConsoleStatus)}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        {row.evidenceLinks?.length ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {row.evidenceLinks.map((link: string, i: number) => (
                              <SourceLink key={i} path={link} onOpen={onOpenSpec} />
                            ))}
                          </div>
                        ) : isComplete ? (
                          <span className="badge badge-fail" style={{ fontSize: 11 }}>Missing Evidence</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <SourceLink path={row.source?.path || ''} line={row.source?.lineStart} onOpen={onOpenSpec} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 5. Decisions
// -------------------------------------------------------------
export const DecisionBoard: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'pending' | 'rejected'>('all');

  const decisionsData = (data.decisions as any[]) || [];

  // Compute status summary metrics
  const { total, resolved, pending, rejected } = useMemo(() => {
    let resolved = 0;
    let pending = 0;
    let rejected = 0;

    for (const d of decisionsData) {
      const s = (d.status || '').toUpperCase();
      if (s === 'ACCEPTED' || s === 'APPROVED' || s === 'RESOLVED' || s === 'CLOSED' || s === 'DECIDED' || s === 'DONE') {
        resolved++;
      } else if (s === 'REJECTED' || s === 'DEPRECATED' || s === 'FAIL') {
        rejected++;
      } else {
        pending++; // Default to pending (e.g. PENDING, PROPOSED, DRAFT, OPEN)
      }
    }

    return {
      total: decisionsData.length,
      resolved,
      pending,
      rejected
    };
  }, [decisionsData]);

  const rows = useMemo(() => {
    return decisionsData.filter((d) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const s = (d.status || '').toUpperCase();
        const isResolved = s === 'ACCEPTED' || s === 'APPROVED' || s === 'RESOLVED' || s === 'CLOSED' || s === 'DECIDED' || s === 'DONE';
        const isRejected = s === 'REJECTED' || s === 'DEPRECATED' || s === 'FAIL';
        const isPending = !isResolved && !isRejected;

        if (statusFilter === 'resolved' && !isResolved) return false;
        if (statusFilter === 'pending' && !isPending) return false;
        if (statusFilter === 'rejected' && !isRejected) return false;
      }

      // 2. Text Search
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (d.decisionId || '').toLowerCase().includes(q) ||
        (d.title || '').toLowerCase().includes(q) ||
        (d.status || '').toLowerCase().includes(q) ||
        (d.owner || '').toLowerCase().includes(q) ||
        (d.consequence || '').toLowerCase().includes(q) ||
        (d.defaultOutcome || '').toLowerCase().includes(q) ||
        (d.currentDecision || '').toLowerCase().includes(q)
      );
    });
  }, [decisionsData, search, statusFilter]);

  return (
    <div>
      <PageHeader title="Decisions" description="Decision records discovered under specs/**/decisions/." />

      {decisionsData.length === 0 ? (
        <EmptyState
          title="No decisions registered"
          description={
            <>
              Add markdown files under a <code>decisions/</code> folder to track architecture and governance
              decisions.
            </>
          }
        />
      ) : (
        <>
          <div className="toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="field" style={{ flex: 1, maxWidth: 320 }}>
              <span style={{ color: 'var(--text-muted)' }}>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search decisions…" />
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'all' ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'all' ? 'var(--accent)' : 'var(--text)',
                  fontWeight: statusFilter === 'all' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                All ({total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'resolved' ? 'var(--pass-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'resolved' ? 'var(--pass)' : 'var(--text)',
                  fontWeight: statusFilter === 'resolved' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Resolved ({resolved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'pending' ? 'var(--warn-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'pending' ? 'var(--warn)' : 'var(--text)',
                  fontWeight: statusFilter === 'pending' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Pending ({pending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                style={{
                  fontSize: 12,
                  padding: '6.5px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border)',
                  backgroundColor: statusFilter === 'rejected' ? 'var(--fail-soft)' : 'var(--bg-elevated)',
                  color: statusFilter === 'rejected' ? 'var(--fail)' : 'var(--text)',
                  fontWeight: statusFilter === 'rejected' ? 600 : 'normal',
                  cursor: 'pointer'
                }}
              >
                Rejected ({rejected})
              </button>
            </div>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {rows.length} of {total} decisions
            </span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>ID</th>
                  <th style={{ width: '32%' }}>Record</th>
                  <th style={{ width: '12%' }}>Status</th>
                  <th style={{ width: '12%' }}>Owner</th>
                  <th style={{ width: '12%' }}>Deadline</th>
                  <th style={{ width: '20%' }}>Outcome & Consequences</th>
                  <th style={{ width: '10%' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((dec) => (
                  <tr key={dec.decisionId}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)', verticalAlign: 'top' }}>
                      {dec.decisionId}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 600 }}>{dec.title}</div>
                      {dec.blockingImpact && (
                        <div style={{
                          fontSize: 11,
                          color: 'var(--fail)',
                          backgroundColor: 'var(--fail-soft)',
                          border: '1px solid var(--fail-border)',
                          borderRadius: 4,
                          padding: '4px 8px',
                          marginTop: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}>
                          <span style={{ fontWeight: 650 }}>⚠ Impact:</span> {dec.blockingImpact}
                        </div>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <StatusBadge status={dec.status} />
                    </td>
                    <td style={{ verticalAlign: 'top', fontWeight: 500 }}>
                      {dec.owner || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13, verticalAlign: 'top', fontWeight: 500 }}>
                      {dec.deadline ? (
                        <span style={{
                          backgroundColor: 'var(--bg-muted)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid var(--border)',
                          fontSize: 12
                        }}>
                          {dec.deadline}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'top', fontSize: 13, maxWidth: 300 }}>
                      {dec.currentDecision ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <MarkdownViewer content={dec.currentDecision} className="prose-compact" />
                          {dec.consequence && (
                            <div style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              borderLeft: '2px solid var(--border-strong)',
                              paddingLeft: 6,
                              marginTop: 4,
                              fontStyle: 'italic'
                            }}>
                              Consequence: {dec.consequence}
                            </div>
                          )}
                        </div>
                      ) : dec.defaultOutcome ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Default outcome:</span>
                          <code style={{ alignSelf: 'flex-start' }}>{dec.defaultOutcome}</code>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ verticalAlign: 'top' }}>
                      <SourceLink path={dec.source?.path || ''} line={dec.source?.lineStart} onOpen={onOpenSpec} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 6. Evidence
// -------------------------------------------------------------
export const EvidenceHealth: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const rows = (data.evidenceHealth as any[]).filter((eh) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      String(eh.featureNumber).includes(q) ||
      (eh.featureSlug || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Evidence health" description="Phase-exit evidence, approvals, and test signals." />

      {(data.evidenceHealth as any[]).length === 0 ? (
        <EmptyState title="No evidence records" description="Phase-exit or evidence files will appear here when discovered." />
      ) : (
        <>
          <div className="toolbar">
            <div className="field" style={{ flex: 1, maxWidth: 320 }}>
              <span style={{ color: 'var(--text-muted)' }}>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter features…" />
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Exit evidence</th>
                  <th>Commands</th>
                  <th>Tests</th>
                  <th>Exit codes</th>
                  <th>Approval</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((eh) => (
                  <tr key={eh.featureNumber}>
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 6 }}>
                        #{String(eh.featureNumber).padStart(3, '0')}
                      </span>
                      <strong>{eh.featureSlug}</strong>
                    </td>
                    <td>
                      {eh.phaseExitExists ? (
                        <SourceLink path={eh.source?.path || ''} onOpen={onOpenSpec} />
                      ) : (
                        <span style={{ color: 'var(--fail)', fontSize: 12 }}>Missing phase-exit.md</span>
                      )}
                    </td>
                    <td>
                      {eh.commandsRecorded?.length ? (
                        <div
                          className="mono"
                          style={{
                            fontSize: 11,
                            background: 'var(--bg-code)',
                            padding: 6,
                            borderRadius: 4,
                            maxWidth: 200,
                            overflowX: 'auto',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {eh.commandsRecorded.map((cmd: string, i: number) => (
                            <div key={i} style={{ whiteSpace: 'nowrap' }}>
                              $ {cmd}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {eh.testCounts ? (
                        <>
                          <span style={{ color: 'var(--pass)', fontWeight: 600 }}>{eh.testCounts.passed} passed</span>
                          {eh.testCounts.failed > 0 && (
                            <span style={{ color: 'var(--fail)', marginLeft: 6 }}>({eh.testCounts.failed} failed)</span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      {eh.exitCodesRecorded?.length ? (
                        <div className="chip-row">
                          {eh.exitCodesRecorded.map((code: number, i: number) => (
                            <span key={i} className={`chip ${code === 0 ? 'ok' : 'bad'}`}>
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {eh.approvalRecorded ? (
                        <>
                          <span style={{ color: 'var(--pass)', fontWeight: 600 }}>Approved</span>
                          {eh.approver && (
                            <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>By {eh.approver}</div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: 'var(--warn)', fontWeight: 600 }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress" style={{ width: 64 }}>
                          <div
                            className="progress-fill"
                            style={{
                              width: `${eh.evidenceHealthScore || 0}%`,
                              background:
                                (eh.evidenceHealthScore || 0) >= 80
                                  ? 'var(--pass)'
                                  : (eh.evidenceHealthScore || 0) >= 50
                                    ? 'var(--warn)'
                                    : 'var(--fail)'
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                          {eh.evidenceHealthScore || 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 7. Risks
// -------------------------------------------------------------
export const RisksAndBlockers: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const errors = data.validation.errors.filter((e) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return e.id.toLowerCase().includes(q) || e.message.toLowerCase().includes(q);
  });
  const warnings = data.validation.warnings.filter((w) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return w.id.toLowerCase().includes(q) || w.message.toLowerCase().includes(q);
  });
  const total = data.validation.errors.length + data.validation.warnings.length;

  return (
    <div>
      <PageHeader
        title="Risks & blockers"
        description="Validation errors and warnings from governance rules — never written back to Markdown."
      />

      {total === 0 ? (
        <div className="alert alert-pass">
          <div className="alert-title">No risks or blockers</div>
          <div className="alert-body">All checks passed for the current snapshot.</div>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <div className="field" style={{ flex: 1, maxWidth: 320 }}>
              <span style={{ color: 'var(--text-muted)' }}>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter issues…" />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {data.validation.errors.length} errors · {data.validation.warnings.length} warnings
            </span>
          </div>

          {errors.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--fail-border)' }}>
              <div className="card-title" style={{ color: 'var(--fail)' }}>
                Blockers ({errors.length})
              </div>
              <div className="issue-list">
                {errors.map((err, idx) => (
                  <div key={idx} className="issue fail">
                    <div className="issue-head">
                      <span className="issue-id" style={{ color: 'var(--fail)' }}>
                        {err.id}
                      </span>
                      <StatusBadge status="ERROR" />
                    </div>
                    <div className="issue-msg">{err.message}</div>
                    {err.source && (
                      <SourceLink path={err.source.path} line={err.source.lineStart} onOpen={onOpenSpec} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="card" style={{ borderColor: 'var(--warn-border)' }}>
              <div className="card-title" style={{ color: 'var(--warn)' }}>
                Warnings ({warnings.length})
              </div>
              <div className="issue-list">
                {warnings.map((warn, idx) => (
                  <div key={idx} className="issue warn">
                    <div className="issue-head">
                      <span className="issue-id" style={{ color: 'var(--warn)' }}>
                        {warn.id}
                      </span>
                      <StatusBadge status="WARNING" />
                    </div>
                    <div className="issue-msg">{warn.message}</div>
                    {warn.source && (
                      <SourceLink path={warn.source.path} line={warn.source.lineStart} onOpen={onOpenSpec} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 8. Activity
// -------------------------------------------------------------
export const ActivityFeed: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [search, setSearch] = useState('');
  const items = (data.activityFeed as any[]).filter((act) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (act.event || '').toLowerCase().includes(q) ||
      (act.notes || '').toLowerCase().includes(q) ||
      (act.gateId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Activity" description="Events inferred from ledgers, phase exits, and feature history." />

      {data.activityFeed.length === 0 ? (
        <EmptyState
          title="No activities recorded"
          description="Develop features, run review phases, or declare gates to populate activity."
        />
      ) : (
        <div className="card">
          <div className="toolbar" style={{ marginBottom: 16 }}>
            <div className="field" style={{ flex: 1, maxWidth: 320 }}>
              <span style={{ color: 'var(--text-muted)' }}>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter activity…" />
            </div>
          </div>
          <div className="timeline">
            {items.map((act, idx) => {
              const success =
                String(act.event || '').includes('Approved') || String(act.event || '').includes('Closed');
              return (
                <div key={idx} className={`timeline-item ${success ? 'success' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 2 }}>
                    <strong style={{ fontSize: 14 }}>{act.event}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {act.date || 'No date'}
                    </span>
                  </div>
                  {act.notes && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{act.notes}</p>
                  )}
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {act.featureNumber !== undefined && (
                      <span>Feature #{String(act.featureNumber).padStart(3, '0')}</span>
                    )}
                    {act.gateId && <span>Gate {act.gateId}</span>}
                    {act.source?.path && (
                      <SourceLink path={act.source.path} line={act.source.lineStart} onOpen={onOpenSpec} />
                    )}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No activity matches the filter.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 9. Artifacts
// -------------------------------------------------------------
export const ArtifactInventory: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const [filterRole, setFilterRole] = useState('ALL');
  const [search, setSearch] = useState('');
  const uniqueRoles = Array.from(new Set((data.artifacts as any[]).map((a) => a.role))).sort();

  const filtered = (data.artifacts as any[]).filter((a) => {
    if (filterRole !== 'ALL' && a.role !== filterRole) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (a.path || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <PageHeader
        title="Artifacts"
        description="All discovered SpecKit files with role classification and content hashes."
      />

      <div className="toolbar">
        <div className="field" style={{ flex: 1, maxWidth: 320 }}>
          <span style={{ color: 'var(--text-muted)' }}>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search paths…" />
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <span className="field-label">Role</span>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="ALL">All roles</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="toolbar-spacer" />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} files
        </span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Path</th>
              <th>Role</th>
              <th>Feature</th>
              <th>Hash</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((art, idx) => {
              const isMd = /\.(md|markdown)$/i.test(art.path || '');
              return (
                <tr
                  key={idx}
                  className={isMd && onOpenSpec ? 'clickable' : undefined}
                  onClick={() => {
                    if (isMd && onOpenSpec) onOpenSpec(art.path);
                  }}
                >
                  <td>
                    <SourceLink path={art.path} onOpen={isMd ? onOpenSpec : undefined} />
                  </td>
                  <td>
                    <span className="badge badge-muted">{art.role}</span>
                  </td>
                  <td className="mono">
                    {art.featureNumber !== undefined ? `#${String(art.featureNumber).padStart(3, '0')}` : '—'}
                  </td>
                  <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {(art.hash || '').slice(0, 12)}…
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {(art.sizeBytes || 0).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>
                  No artifacts match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 10. Specs browser (markdown viewer)
// -------------------------------------------------------------
export const SpecsBrowser: React.FC<{
  data: ProjectStatusSnapshot;
  initialPath?: string | null;
  onPathChange?: (path: string | null) => void;
}> = ({ data, initialPath, onPathChange }) => {
  const files: FileListItem[] = useMemo(
    () =>
      (data.artifacts as any[])
        .filter((a) => /\.(md|markdown|ya?ml|txt)$/i.test(a.path || ''))
        .map((a) => ({
          path: a.path,
          role: a.role,
          featureNumber: a.featureNumber,
          sizeBytes: a.sizeBytes
        }))
        .sort((a, b) => a.path.localeCompare(b.path)),
    [data.artifacts]
  );

  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(initialPath || files[0]?.path || null);
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'rendered' | 'raw'>('rendered');

  useEffect(() => {
    if (initialPath) setSelected(initialPath);
  }, [initialPath]);

  useEffect(() => {
    if (!selected) {
      setContent('');
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    loadSourceFile(selected)
      .then((res) => {
        if (!cancelled) {
          setContent(res.content);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          // Fallback: show artifact metadata when serve API is unavailable (upload-only mode)
          const art = (data.artifacts as any[]).find((a) => a.path === selected);
          setContent(
            [
              `# ${selected.split(/[/\\]/).pop()}`,
              '',
              '> File content is available when running `dashboard:serve`.',
              '',
              art
                ? [
                    '| Field | Value |',
                    '| --- | --- |',
                    `| Path | \`${art.path}\` |`,
                    `| Role | ${art.role} |`,
                    `| Hash | \`${art.hash}\` |`,
                    `| Size | ${art.sizeBytes} bytes |`
                  ].join('\n')
                : 'Artifact not found in snapshot.',
              '',
              err.message ? `\n_API note: ${err.message}_` : ''
            ].join('\n')
          );
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selected, data.artifacts]);

  const selectFile = (path: string) => {
    setSelected(path);
    onPathChange?.(path);
  };

  const filtered = files.filter((f) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return f.path.toLowerCase().includes(q) || f.role.toLowerCase().includes(q);
  });

  const isMarkdown = selected ? /\.(md|markdown)$/i.test(selected) : false;

  return (
    <div>
      <PageHeader
        title="Specs browser"
        description="Browse and render SpecKit Markdown (and related text) artifacts. Read-only."
      />

      {files.length === 0 ? (
        <EmptyState title="No source files" description="No markdown or text artifacts were discovered." />
      ) : (
        <div className="specs-layout">
          <aside className="file-tree">
            <div className="file-tree-head">
              <strong>Project files</strong>
              <span>{files.length} source files</span>
            </div>
            <div className="file-tree-search">
              <div className="field">
                <span style={{ color: 'var(--text-muted)' }}>⌕</span>
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter files…"
                  aria-label="Filter files"
                />
              </div>
            </div>
            <div className="file-tree-list">
              {filtered.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  className={`file-tree-item ${selected === f.path ? 'active' : ''}`}
                  onClick={() => selectFile(f.path)}
                >
                  <span className="path">{f.path}</span>
                  <span className="role">
                    {f.role}
                    {f.featureNumber !== undefined
                      ? ` · #${String(f.featureNumber).padStart(3, '0')}`
                      : ''}
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  No files match.
                </div>
              )}
            </div>
          </aside>

          <section className="md-pane">
            {!selected ? (
              <div className="empty-state" style={{ border: 'none', boxShadow: 'none' }}>
                <h3>Select a file</h3>
                <p>Choose a SpecKit artifact from the list to render its contents.</p>
              </div>
            ) : (
              <>
                <div className="md-pane-head">
                  <span className="path" title={selected}>
                    {selected}
                  </span>
                  {error && (
                    <span className="badge badge-warn" title={error}>
                      API fallback
                    </span>
                  )}
                  {isMarkdown && (
                    <div className="md-pane-tabs">
                      <button
                        type="button"
                        className={mode === 'rendered' ? 'active' : ''}
                        onClick={() => setMode('rendered')}
                      >
                        Rendered
                      </button>
                      <button
                        type="button"
                        className={mode === 'raw' ? 'active' : ''}
                        onClick={() => setMode('raw')}
                      >
                        Source
                      </button>
                    </div>
                  )}
                </div>
                {loading ? (
                  <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
                ) : isMarkdown ? (
                  <MarkdownViewer content={content} mode={mode} />
                ) : (
                  <pre className="md-raw">{content}</pre>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 11. Excerpts
// -------------------------------------------------------------
export const SourceViewer: React.FC<{ data: ProjectStatusSnapshot; onOpenSpec?: OpenSpecFn }> = ({
  data,
  onOpenSpec
}) => {
  const excerpts = data.diagnostics.filter((d) => d.source?.excerpt);

  return (
    <div>
      <PageHeader
        title="Source excerpts"
        description="Diagnostic excerpts captured when parsing or validating Markdown artifacts."
      />

      {excerpts.length === 0 ? (
        <EmptyState
          title="No excerpts available"
          description="Excerpts appear when diagnostics include a source snippet. None in this snapshot."
        />
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {excerpts.map((d, idx) => (
              <div key={idx} style={{ borderBottom: idx < excerpts.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>
                    {d.id}: {d.message}
                  </strong>
                  {d.source && (
                    <SourceLink path={d.source.path} line={d.source.lineStart} onOpen={onOpenSpec} />
                  )}
                </div>
                <pre
                  style={{
                    background: '#1a1a18',
                    color: '#f5e6c8',
                    padding: 12,
                    borderRadius: 6,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    overflowX: 'auto',
                    borderLeft: '3px solid var(--warn)',
                    margin: 0
                  }}
                >
                  {d.source?.excerpt}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
