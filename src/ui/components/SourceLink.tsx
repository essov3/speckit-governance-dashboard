import React from 'react';

export interface SourceLinkProps {
  path: string;
  line?: number;
  /** When set, clicking opens the in-app Specs viewer */
  onOpen?: (path: string) => void;
}

export const SourceLink: React.FC<SourceLinkProps> = ({ path, line, onOpen }) => {
  if (!path) return <span style={{ color: 'var(--text-muted)' }}>—</span>;

  const basename = path.split(/[/\\]/).pop() || path;
  const label = `${basename}${line ? `:${line}` : ''}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText(path + (line ? `:${line}` : ''));
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen(path);
      return;
    }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {onOpen ? (
        <button type="button" className="source-link" title={`View ${path}`} onClick={handleOpen}>
          {label}
        </button>
      ) : (
        <span className="source-link" title={path} style={{ cursor: 'default', textDecoration: 'none' }}>
          {label}
        </span>
      )}
      <button type="button" className="icon-btn" onClick={handleCopy} title="Copy path">
        ⧉
      </button>
    </span>
  );
};

export default SourceLink;
