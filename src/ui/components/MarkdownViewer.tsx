import React, { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false
});

export interface MarkdownViewerProps {
  content: string;
  mode?: 'rendered' | 'raw';
  className?: string;
}

/**
 * Minimal safe-ish HTML sanitizer for locally trusted SpecKit markdown.
 * Strips scripts/event handlers while preserving common prose tags.
 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  mode = 'rendered',
  className
}) => {
  const html = useMemo(() => {
    if (mode === 'raw') return '';
    try {
      const rendered = marked.parse(content, { async: false }) as string;
      return sanitizeHtml(rendered);
    } catch {
      return '<p>Failed to render markdown.</p>';
    }
  }, [content, mode]);

  if (mode === 'raw') {
    return <pre className={`md-raw ${className || ''}`}>{content}</pre>;
  }

  return (
    <div
      className={`prose md-body ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownViewer;
