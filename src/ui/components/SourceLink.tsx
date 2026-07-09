import React from 'react';

export interface SourceLinkProps {
  path: string;
  line?: number;
  projectRoot?: string;
}

export const SourceLink: React.FC<SourceLinkProps> = ({ path, line, projectRoot }) => {
  if (!path) return <span style={{ color: 'var(--text-muted)' }}>-</span>;

  const basename = path.split('/').pop() || path;
  
  // Format standard clickable file URL if absolute, or relative to root
  let fileUrl = '';
  if (projectRoot) {
    fileUrl = `file://${projectRoot}/${path}`;
  } else {
    fileUrl = `file:///${path}`;
  }
  if (line) {
    fileUrl += `#L${line}`;
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path + (line ? `:${line}` : ''));
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <a 
        href={fileUrl}
        className="source-link" 
        title={`Open file: ${path}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {basename}{line ? `:${line}` : ''}
      </a>
      <button 
        onClick={handleCopy}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: '10px',
          padding: '2px 4px',
          borderRadius: '4px'
        }}
        title="Copy path to clipboard"
      >
        📋
      </button>
    </span>
  );
};
export default SourceLink;
