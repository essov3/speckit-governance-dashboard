import React, { useEffect, useState } from 'react';
import { ProjectStatusSnapshot } from '../../core/snapshot/snapshot-schema.ts';
import { loadSnapshot } from '../data/load-snapshot.ts';
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
  SourceViewer
} from './routes/all-routes.tsx';

export const App: React.FC = () => {
  const [snapshot, setSnapshot] = useState<ProjectStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function init() {
      const data = await loadSnapshot();
      if (data) {
        setSnapshot(data);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSnapshot(parsed);
      } catch (err) {
        alert('Invalid snapshot JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSnapshot(parsed);
      } catch (err) {
        alert('Invalid snapshot JSON file.');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#090a0f', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 600, marginBottom: '8px' }}>Loading Dashboard...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Reading project-status.json snapshot cache</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="upload-container" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="logo" style={{ fontSize: '28px', marginBottom: '24px', justifyContent: 'center' }}>
          📐 SpecKit Governance
        </div>
        <div className="dropzone">
          <h2>Upload Status Snapshot</h2>
          <p>Drag and drop your <code>project-status.json</code> file here, or click to browse.</p>
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
            id="file-upload-input"
          />
          <label htmlFor="file-upload-input" className="upload-button">
            Browse Snapshot File
          </label>
        </div>
        <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
          Markdown remains the single source of truth.<br />
          This dashboard reads derived snapshot caches and performs zero database writes.
        </div>
      </div>
    );
  }

  const renderActiveRoute = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview data={snapshot} />;
      case 'features':
        return <FeatureTracker data={snapshot} />;
      case 'gates':
        return <PhaseGateBoard data={snapshot} />;
      case 'coverage':
        return <CoverageMatrix data={snapshot} />;
      case 'decisions':
        return <DecisionBoard data={snapshot} />;
      case 'evidence':
        return <EvidenceHealth data={snapshot} />;
      case 'risks':
        return <RisksAndBlockers data={snapshot} />;
      case 'activities':
        return <ActivityFeed data={snapshot} />;
      case 'artifacts':
        return <ArtifactInventory data={snapshot} />;
      case 'excerpts':
        return <SourceViewer data={snapshot} />;
      default:
        return <Overview data={snapshot} />;
    }
  };

  const isOarb = snapshot.project.detectedType === 'oarb-governance';

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo">
          <span>📐</span> SpecKit Governance
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="nav-menu">
            <li>
              <a className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                📊 Overview
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'gates' ? 'active' : ''}`} onClick={() => setActiveTab('gates')}>
                🚧 Phase Gates
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'features' ? 'active' : ''}`} onClick={() => setActiveTab('features')}>
                📋 Feature Tracker
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'coverage' ? 'active' : ''}`} onClick={() => setActiveTab('coverage')}>
                🎯 Coverage Matrix
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'decisions' ? 'active' : ''}`} onClick={() => setActiveTab('decisions')}>
                ⚖️ Decisions
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'evidence' ? 'active' : ''}`} onClick={() => setActiveTab('evidence')}>
                🧪 Evidence Health
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'risks' ? 'active' : ''}`} onClick={() => setActiveTab('risks')}>
                ⚠️ Risks & Blockers
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'activities' ? 'active' : ''}`} onClick={() => setActiveTab('activities')}>
                ⚡ Activity Feed
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'artifacts' ? 'active' : ''}`} onClick={() => setActiveTab('artifacts')}>
                📁 Artifact Inventory
              </a>
            </li>
            <li>
              <a className={`nav-item ${activeTab === 'excerpts' ? 'active' : ''}`} onClick={() => setActiveTab('excerpts')}>
                🔍 Excerpt Inspector
              </a>
            </li>
          </ul>
        </nav>

        {/* Sidebar safety labels */}
        <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>🛡️ READ-ONLY MODE</div>
          <div>Markdown is the source of truth.</div>
          <div style={{ marginTop: '2px' }}>Snapshot is derived cache.</div>
          {isOarb && (
            <div style={{ marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '6px', color: 'var(--color-warn)' }}>
              This dashboard does not close gates, mark features Verified, or declare ENGINE_COMPLETE.
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header className="header-container">
          <div className="header-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {snapshot.project.name}
            </h1>
            <p>
              SpecKit Governance Dashboard &bull; Detected Mode: <strong>{snapshot.project.detectedType.toUpperCase().replace('-', ' ')}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {snapshot.executive.highestSeverity === 'error' && (
              <span className="badge badge-fail" style={{ padding: '6px 12px', borderRadius: '6px' }}>🛑 BLOCKERS DETECTED</span>
            )}
            {snapshot.executive.highestSeverity === 'warning' && (
              <span className="badge badge-warn" style={{ padding: '6px 12px', borderRadius: '6px' }}>⚠️ WARNINGS</span>
            )}
            {snapshot.executive.highestSeverity === 'none' && (
              <span className="badge badge-pass" style={{ padding: '6px 12px', borderRadius: '6px' }}>✅ VERIFIED COMPLETE</span>
            )}
          </div>
        </header>

        {renderActiveRoute()}
      </main>
    </div>
  );
};
export default App;
