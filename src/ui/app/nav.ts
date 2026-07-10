export type NavId =
  | 'overview'
  | 'features'
  | 'gates'
  | 'coverage'
  | 'decisions'
  | 'evidence'
  | 'risks'
  | 'activity'
  | 'artifacts'
  | 'specs'
  | 'excerpts';

export interface NavItem {
  id: NavId;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'features', label: 'Features' },
      { id: 'gates', label: 'Phase gates' },
      { id: 'risks', label: 'Risks' }
    ]
  },
  {
    label: 'Governance',
    items: [
      { id: 'coverage', label: 'Coverage' },
      { id: 'decisions', label: 'Decisions' },
      { id: 'evidence', label: 'Evidence' },
      { id: 'activity', label: 'Activity' }
    ]
  },
  {
    label: 'SpecKit',
    items: [
      { id: 'specs', label: 'Specs browser' },
      { id: 'artifacts', label: 'Artifacts' },
      { id: 'excerpts', label: 'Excerpts' }
    ]
  }
];

export const NAV_TITLES: Record<NavId, string> = {
  overview: 'Overview',
  features: 'Features',
  gates: 'Phase gates',
  coverage: 'Coverage matrix',
  decisions: 'Decisions',
  evidence: 'Evidence health',
  risks: 'Risks & blockers',
  activity: 'Activity',
  artifacts: 'Artifacts',
  specs: 'Specs browser',
  excerpts: 'Source excerpts'
};
