import React from 'react';

export interface StatusBadgeProps {
  status: string;
}

function badgeClassFor(status: string): string {
  const s = status.toUpperCase();

  if (
    s === 'CLOSED' ||
    s === 'VERIFIED' ||
    s === 'PASSED' ||
    s === 'APPROVED' ||
    s === 'COMPLETE' ||
    s === 'RESOLVED' ||
    s === 'ACCEPTED' ||
    s === 'PASS' ||
    s === 'DONE' ||
    s.includes('COMPLETE') ||
    s.includes('VERIFIED') ||
    s.includes('PASSED') ||
    s.includes('APPROVED')
  ) {
    return 'badge-pass';
  }

  if (
    s === 'OPEN' ||
    s === 'PENDING' ||
    s === 'WARNING' ||
    s === 'WARN' ||
    s === 'IN_PROGRESS' ||
    s === 'IN PROGRESS' ||
    s === 'SPECIFIED' ||
    s === 'PLANNED' ||
    s === 'TASKS READY' ||
    s === 'IMPLEMENTED' ||
    s === 'PARTIAL' ||
    s.includes('PROGRESS') ||
    s.includes('DEFERRED') ||
    s.includes('PLANNED')
  ) {
    return 'badge-warn';
  }

  if (
    s === 'FAIL' ||
    s === 'FAILED' ||
    s === 'BLOCKED' ||
    s === 'REJECTED' ||
    s === 'ERROR' ||
    s === 'INCOMPLETE' ||
    s === 'MISSING' ||
    s.includes('FAIL') ||
    s.includes('ERROR') ||
    s.includes('MISSING')
  ) {
    return 'badge-fail';
  }

  if (!status || s === 'UNKNOWN' || s === 'N/A' || s === '-' || s === '—') {
    return 'badge-muted';
  }

  return 'badge-info';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`badge ${badgeClassFor(status)}`}>{status || '—'}</span>
);

export default StatusBadge;
