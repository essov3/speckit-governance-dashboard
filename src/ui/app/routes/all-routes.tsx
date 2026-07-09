import React, { useState } from 'react';
import { ProjectStatusSnapshot } from '../../../core/snapshot/snapshot-schema.ts';
import { StatusBadge } from '../../components/StatusBadge.tsx';
import { SourceLink } from '../../components/SourceLink.tsx';

// -------------------------------------------------------------
// 1. Executive Overview
// -------------------------------------------------------------
export const Overview: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const { executive, project, validation } = data;
  const isOarB = project.detectedType === 'oarb-governance';
  const showEngineCompleteWarning = isOarB && !executive.engineCompleteDeclared?.value;

  return (
    <div>
      {showEngineCompleteWarning && (
        <div className="warning-panel" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'var(--color-warn)' }}>
          <div className="warning-header" style={{ color: 'var(--color-warn)' }}>
            ⚠️ OAR B Readiness Alert
          </div>
          <div className="warning-item" style={{ color: '#fff', fontWeight: 600 }}>
            ENGINE_COMPLETE is not declared in the delivery ledger!
          </div>
          <div className="warning-item">
            All P1 features must be verified and decisions resolved before declaring engine completeness.
          </div>
        </div>
      )}

      {validation.status === 'fail' && (
        <div className="warning-panel">
          <div className="warning-header">
            🛑 Governance Validation Failure
          </div>
          <div className="warning-item">
            The project currently violates <strong>{validation.errors.length}</strong> critical readiness rules. Fix the underlying Markdown artifacts to resolve.
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="card glass metric-card">
          <div className="metric-title">Project Type</div>
          <div className="metric-value" style={{ fontSize: '20px', marginTop: '12px' }}>
            {project.detectedType.toUpperCase().replace('-', ' ')}
          </div>
        </div>

        <div className="card glass metric-card">
          <div className="metric-title">Total Features</div>
          <div className="metric-value">{executive.featureSummary.total}</div>
        </div>

        <div className="card glass metric-card">
          <div className="metric-title">Verified Features</div>
          <div className="metric-value" style={{ color: 'var(--color-pass)' }}>
            {executive.featureSummary.verified}
          </div>
        </div>

        <div className="card glass metric-card">
          <div className="metric-title">Implemented</div>
          <div className="metric-value" style={{ color: 'var(--color-info)' }}>
            {executive.featureSummary.implemented}
          </div>
        </div>

        <div className="card glass metric-card">
          <div className="metric-title">Open Issues</div>
          <div className="metric-value" style={{ color: 'var(--color-warn)' }}>
            {executive.warnings.length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left column: Active Feature and Governance Details */}
        <div>
          <div className="card glass">
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Active Workspace Feature</h2>
            {project.activeFeature ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-secondary)' }}>
                    #{String(project.activeFeature.number).padStart(3, '0')}
                  </span>
                  <h3 style={{ fontSize: '18px' }}>{project.activeFeature.title || project.activeFeature.slug}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  This feature is currently registered in <code>.specify/feature.json</code>.
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No active feature pointer found in <code>.specify/feature.json</code>.</p>
            )}
          </div>

          <div className="card glass">
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Readiness Gates Status</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {data.gates.map((g: any) => (
                <div 
                  key={g.gateId} 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    minWidth: '90px'
                  }}
                >
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{g.gateId}</span>
                  <StatusBadge status={g.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Snapshot Details */}
        <div className="card glass" style={{ height: 'fit-content' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px', fontSize: '18px' }}>Snapshot Metadata</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Generated At</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{data.generated.generatedAt}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Generator Version</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>v{data.generated.generatorVersion}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)' }}>Project Path</div>
              <div style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>{data.generated.projectRoot}</div>
            </div>
            {project.constitution && (
              <div>
                <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Constitution Compliance</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="progress-container" style={{ margin: 0, flex: 1 }}>
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(project.constitution.passedChecksCount / project.constitution.checksCount) * 100}%` }}
                    ></div>
                  </div>
                  <span style={{ fontWeight: 600 }}>{project.constitution.passedChecksCount}/{project.constitution.checksCount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. Feature Tracker
// -------------------------------------------------------------
export const FeatureTracker: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const [search, setSearch] = useState('');
  
  const filtered = data.features.filter((f: any) => 
    String(f.number).includes(search) || 
    f.slug.toLowerCase().includes(search.toLowerCase()) || 
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Feature Implementation & Governance</h2>
        <input 
          type="text" 
          placeholder="Search features..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            width: '260px'
          }}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Feature</th>
              <th>Status</th>
              <th>Artifacts</th>
              <th>Progress</th>
              <th>Next Recommended Action</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f: any) => (
              <tr key={f.number}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {String(f.number).padStart(3, '0')}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{f.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{f.slug}</div>
                </td>
                <td>
                  <StatusBadge status={f.lifecycle} />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                    <span style={{ opacity: f.specExists ? 1 : 0.25 }} title="spec.md">📄 SPEC</span>
                    <span style={{ opacity: f.planExists ? 1 : 0.25 }} title="plan.md">🗺️ PLAN</span>
                    <span style={{ opacity: f.tasksExists ? 1 : 0.25 }} title="tasks.md">✅ TASKS</span>
                    <span style={{ opacity: f.phaseExitExists ? 1 : 0.25 }} title="phase-exit.md">🚪 EXIT</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-container" style={{ width: '80px', margin: 0 }}>
                      <div className="progress-fill" style={{ width: `${f.taskCompletionPct}%` }}></div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{f.taskCompletionPct}%</span>
                  </div>
                </td>
                <td style={{ fontSize: '13px', color: f.nextAction.startsWith('None') ? 'var(--color-pass)' : 'var(--text-secondary)' }}>
                  {f.nextAction}
                </td>
                <td>
                  <SourceLink path={f.sourceLinks[0]?.path || ''} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                  No features matched the query.
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
// 3. Phase Gate Board
// -------------------------------------------------------------
export const PhaseGateBoard: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const hasGates = data.gates.some((g: any) => g.requiredChildren.length > 0 || g.status !== 'OPEN');

  if (!hasGates) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Gate model not detected</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          No delivery ledger or readiness program definitions were found in the target project. 
          To enable gates, define a delivery ledger artifact (e.g. <code>specs/069-production-readiness-program/delivery-ledger.md</code>).
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card glass">
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Phase Readiness Boards</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {data.gates.map((g: any) => {
            const isClosed = g.status === 'CLOSED' || g.status === 'COMPLETE' || g.status === 'VERIFIED';
            
            return (
              <div 
                key={g.gateId} 
                className="card glass" 
                style={{ 
                  margin: 0, 
                  background: isClosed ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                  borderColor: isClosed ? 'rgba(16, 185, 129, 0.15)' : 'var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{g.gateId}</span>
                  <StatusBadge status={g.status} />
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>{g.title}</h3>
                
                {g.requiredChildren.length > 0 && (
                  <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Child Features Verification:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {g.requiredChildren.map((cId: number) => {
                        const isVerified = g.verifiedChildren.includes(cId);
                        return (
                          <span 
                            key={cId}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              fontSize: '11px',
                              fontFamily: 'var(--font-mono)',
                              background: isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: isVerified ? 'var(--color-pass)' : 'var(--color-fail)',
                              border: `1px solid ${isVerified ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                            }}
                          >
                            #{String(cId).padStart(3, '0')}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {g.openBlockers.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ color: 'var(--color-fail)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Active Blockers:</div>
                    <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {g.openBlockers.map((b: string, i: number) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Source Ledger:</span>
                  <SourceLink path={g.source.path} line={g.source.lineStart} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. Coverage Matrix
// -------------------------------------------------------------
export const CoverageMatrix: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const hasCoverage = data.coverage.length > 0;

  if (!hasCoverage) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Capability Coverage Matrix Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          No product coverage matrix file was detected in the project. 
          Create <code>specs/069-production-readiness-program/product-coverage-matrix.md</code> with a checklist/table of capabilities to display metrics here.
        </p>
      </div>
    );
  }

  return (
    <div className="card glass">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Product Capability Coverage Matrix</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Capability</th>
              <th>Status</th>
              <th>Responsible Feature</th>
              <th>Gate</th>
              <th>Client Contract</th>
              <th>Admin Console</th>
              <th>Verification Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.coverage.map((row: any, idx: number) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{row.capability}</td>
                <td>
                  <StatusBadge status={row.state} />
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.responsibleChild || '-'}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{row.gate || '-'}</td>
                <td>{row.clientContractStatus || '-'}</td>
                <td>{row.adminConsoleStatus || '-'}</td>
                <td>
                  {row.evidenceLinks.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {row.evidenceLinks.map((link: string, lIdx: number) => (
                        <SourceLink key={lIdx} path={link} />
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-fail)', fontSize: '12px' }}>⚠️ Missing Evidence</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 5. Decision Board
// -------------------------------------------------------------
export const DecisionBoard: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const hasDecisions = data.decisions.length > 0;

  if (!hasDecisions) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>No decisions registered</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          No decision record files were discovered. Create markdown files inside a <code>decisions/</code> folder (e.g. <code>specs/069-production-readiness-program/decisions/D1-some-decision.md</code>) to register architecture or governance decisions.
        </p>
      </div>
    );
  }

  return (
    <div className="card glass">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Decision Records (D1 - D4)</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Decision Record</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Deadline</th>
              <th>Outcome / Consequence</th>
              <th>Source File</th>
            </tr>
          </thead>
          <tbody>
            {data.decisions.map((dec: any) => (
              <tr key={dec.decisionId}>
                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  {dec.decisionId}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{dec.title}</div>
                  {dec.blockingImpact && (
                    <div style={{ fontSize: '11px', color: 'var(--color-fail)', marginTop: '4px' }}>
                      Impact: {dec.blockingImpact}
                    </div>
                  )}
                </td>
                <td>
                  <StatusBadge status={dec.status} />
                </td>
                <td>{dec.owner || '-'}</td>
                <td style={{ fontSize: '13px' }}>{dec.deadline || '-'}</td>
                <td>
                  {dec.currentDecision ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{dec.currentDecision}</div>
                      {dec.consequence && (
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Consequence: {dec.consequence}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      Default outcome: {dec.defaultOutcome || '-'}
                    </span>
                  )}
                </td>
                <td>
                  <SourceLink path={dec.source.path} line={dec.source.lineStart} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 6. Evidence Health
// -------------------------------------------------------------
export const EvidenceHealth: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  return (
    <div className="card glass">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Feature Evidence & Validation Health</h2>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Exit Evidence</th>
              <th>Commands Run</th>
              <th>Test Summary</th>
              <th>Exit Code</th>
              <th>Approvals</th>
              <th>Health Score</th>
            </tr>
          </thead>
          <tbody>
            {data.evidenceHealth.map((eh: any) => (
              <tr key={eh.featureNumber}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-secondary)', marginRight: '8px' }}>
                    #{String(eh.featureNumber).padStart(3, '0')}
                  </span>
                  <strong>{eh.featureSlug}</strong>
                </td>
                <td>
                  {eh.phaseExitExists ? (
                    <SourceLink path={eh.source.path} />
                  ) : (
                    <span style={{ color: 'var(--color-fail)', fontSize: '12px' }}>❌ Missing phase-exit.md</span>
                  )}
                </td>
                <td>
                  {eh.commandsRecorded.length > 0 ? (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px', maxWidth: '200px', overflowX: 'auto' }}>
                      {eh.commandsRecorded.map((cmd: string, i: number) => (
                        <div key={i} style={{ whiteSpace: 'nowrap' }}>$ {cmd}</div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>None</span>
                  )}
                </td>
                <td>
                  {eh.testCounts ? (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-pass)', fontWeight: 600 }}>{eh.testCounts.passed} Passed</span>
                      {eh.testCounts.failed > 0 && (
                        <span style={{ color: 'var(--color-fail)', marginLeft: '6px' }}>({eh.testCounts.failed} Failed)</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  )}
                </td>
                <td>
                  {eh.exitCodesRecorded.length > 0 ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {eh.exitCodesRecorded.map((code: number, i: number) => (
                        <span 
                          key={i} 
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: code === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: code === 0 ? 'var(--color-pass)' : 'var(--color-fail)'
                          }}
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  )}
                </td>
                <td>
                  {eh.approvalRecorded ? (
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-pass)', fontWeight: 600 }}>APPROVED</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>By: {eh.approver}</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-warn)', fontSize: '12px', fontWeight: 600 }}>PENDING</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-container" style={{ width: '80px', margin: 0 }}>
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${eh.evidenceHealthScore}%`,
                          background: eh.evidenceHealthScore >= 80 ? 'var(--color-pass)' : eh.evidenceHealthScore >= 50 ? 'var(--color-warn)' : 'var(--color-fail)'
                        }}
                      ></div>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>{eh.evidenceHealthScore}/100</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 7. Risks & Blockers
// -------------------------------------------------------------
export const RisksAndBlockers: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const errors = data.validation.errors;
  const warnings = data.validation.warnings;

  const totalIssues = errors.length + warnings.length;

  if (totalIssues === 0) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(16, 185, 129, 0.02)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-pass)', marginBottom: '12px' }}>No Risks or Blockers Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>All checks passed, decision records are in terminal states, and gates have correct child verifications.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {errors.length > 0 && (
        <div className="card glass" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.01)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-fail)', marginBottom: '16px' }}>
            🛑 Hard Governance Blockers ({errors.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {errors.map((err: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  border: '1px solid rgba(239, 68, 68, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-fail)' }}>
                    {err.id}
                  </strong>
                  <StatusBadge status="ERROR" />
                </div>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>{err.message}</p>
                {err.source && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Source: <SourceLink path={err.source.path} line={err.source.lineStart} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="card glass" style={{ borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.01)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warn)', marginBottom: '16px' }}>
            ⚠️ Quality Warnings ({warnings.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {warnings.map((warn: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '16px', 
                  borderRadius: '8px', 
                  background: 'rgba(245, 158, 11, 0.05)', 
                  border: '1px solid rgba(245, 158, 11, 0.15)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-warn)' }}>
                    {warn.id}
                  </strong>
                  <StatusBadge status="WARNING" />
                </div>
                <p style={{ fontSize: '14px', marginBottom: '8px' }}>{warn.message}</p>
                {warn.source && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Source: <SourceLink path={warn.source.path} line={warn.source.lineStart} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// 8. Activity Feed
// -------------------------------------------------------------
export const ActivityFeed: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const hasActivities = data.activityFeed.length > 0;

  if (!hasActivities) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>No activities recorded</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Develop features, run review phases, or declare gates in the ledger to populate the activity logs.</p>
      </div>
    );
  }

  return (
    <div className="card glass">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '20px' }}>Project Activity Feed</h2>
      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Timeline line */}
        <div style={{ position: 'absolute', left: '8px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-color)' }}></div>

        {data.activityFeed.map((act: any, idx: number) => (
          <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
            {/* Timeline dot */}
            <div style={{ 
              position: 'absolute', 
              left: '-20px', 
              top: '6px', 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: act.event.includes('Approved') || act.event.includes('Closed') ? 'var(--color-pass)' : 'var(--color-primary)' 
            }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '15px' }}>{act.event}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{act.date || 'No Date'}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{act.notes}</p>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {act.featureNumber !== undefined && (
                  <span>Feature: #{String(act.featureNumber).padStart(3, '0')}</span>
                )}
                {act.gateId && <span>Gate: {act.gateId}</span>}
                <span>Source: <SourceLink path={act.source.path} line={act.source.lineStart} /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 9. Artifact Inventory
// -------------------------------------------------------------
export const ArtifactInventory: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const [filterRole, setFilterRole] = useState('ALL');

  const uniqueRoles = Array.from(new Set(data.artifacts.map((a: any) => a.role)));

  const filtered = filterRole === 'ALL' 
    ? data.artifacts 
    : data.artifacts.filter((a: any) => a.role === filterRole);

  return (
    <div className="card glass">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)' }}>Discovered SpecKit Artifacts ({filtered.length})</h2>
        
        <select 
          value={filterRole} 
          onChange={e => setFilterRole(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Roles</option>
          {uniqueRoles.map((r: string) => (
            <option key={r} value={r}>{r.toUpperCase().replace(/-/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Relative Path</th>
              <th>Artifact Role</th>
              <th>Assigned Feature</th>
              <th>SHA-256 Hash</th>
              <th>Size (Bytes)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((art: any, idx: number) => (
              <tr key={idx}>
                <td>
                  <SourceLink path={art.path} />
                </td>
                <td>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: art.role.includes('canonical') || art.role.includes('ledger') ? 'var(--color-pass)' : 'var(--text-secondary)'
                  }}>
                    {art.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>
                  {art.featureNumber !== undefined ? `#${String(art.featureNumber).padStart(3, '0')}` : '-'}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {art.hash.substring(0, 16)}...
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  {art.sizeBytes.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 10. Source Viewer (excerpts explorer)
// -------------------------------------------------------------
export const SourceViewer: React.FC<{ data: ProjectStatusSnapshot }> = ({ data }) => {
  const excerpts = data.diagnostics.filter(d => d.source?.excerpt);

  if (excerpts.length === 0) {
    return (
      <div className="card glass" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '12px' }}>No Source Excerpts Available</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Excerpts are captured automatically in diagnostic logs for any warning or failure. No warnings exist at this moment.</p>
      </div>
    );
  }

  return (
    <div className="card glass">
      <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Diagnostic Excerpt Inspector</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {excerpts.map((d: any, idx: number) => (
          <div key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>{d.id}: {d.message}</strong>
              <SourceLink path={d.source.path} line={d.source.lineStart} />
            </div>
            <pre style={{ 
              background: '#040508', 
              padding: '12px', 
              borderRadius: '6px', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '12px', 
              overflowX: 'auto',
              color: 'var(--color-warn)',
              borderLeft: '3px solid var(--color-warn)'
            }}>
              {d.source.excerpt}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Overview;
