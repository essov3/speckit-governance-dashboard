import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { buildSnapshot } from '../../src/core/snapshot/build-snapshot.ts';

describe('full governance demo', () => {
  it('builds a rich, public-safe snapshot', async () => {
    const projectRoot = path.resolve(__dirname, '../../examples/full-governance-demo');
    const snapshot = await buildSnapshot({ projectRoot, deterministic: true, includeUnknown: true });

    expect(snapshot.features.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.gates.length).toBeGreaterThanOrEqual(5);
    expect(snapshot.decisions.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.coverage.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.artifacts.some((artifact) => artifact.role === 'contract')).toBe(true);
    expect(snapshot.evidenceHealth.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.validation.warnings.length).toBeGreaterThan(0);
    expect(snapshot.activityFeed.length).toBeGreaterThan(0);
  });
});
