import React from 'react';

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toUpperCase();

  let badgeClass = 'badge-info';
  
  if (s === 'CLOSED' || s === 'VERIFIED' || s === 'PASSED' || s === 'APPROVED' || s === 'COMPLETE' || s === 'RESOLVED' || s === 'ACCEPTED') {
    badgeClass = 'badge-pass';
  } else if (s === 'OPEN' || s === 'PENDING' || s === 'WARNING' || s === 'WARN' || s === 'IN_PROGRESS' || s === 'SPECIFIED' || s === 'PLANNED' || s === 'TASKS READY') {
    badgeClass = 'badge-warn';
  } else if (s === 'FAIL' || s === 'FAILED' || s === 'BLOCKED' || s === 'REJECTED' || s === 'ERROR') {
    badgeClass = 'badge-fail';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
export default StatusBadge;
