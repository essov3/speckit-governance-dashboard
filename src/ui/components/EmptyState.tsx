import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="empty-state">
    <h3>{title}</h3>
    <p>{description}</p>
    {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
  </div>
);

export default EmptyState;
