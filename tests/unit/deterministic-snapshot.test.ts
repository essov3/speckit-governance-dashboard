import { describe, it, expect } from 'vitest';
import { toDeterministicJson } from '../../src/core/snapshot/deterministic-json.ts';

describe('Deterministic Snapshots', () => {
  it('should format JSON deterministically regardless of key insertion order', () => {
    const objA = {
      b: 2,
      a: {
        y: 'y',
        x: 'x'
      },
      c: [
        { z: 1, y: 2 }
      ]
    };

    const objB = {
      c: [
        { y: 2, z: 1 }
      ],
      b: 2,
      a: {
        x: 'x',
        y: 'y'
      }
    };

    const jsonA = toDeterministicJson(objA);
    const jsonB = toDeterministicJson(objB);

    expect(jsonA).toBe(jsonB);
    
    // Assert keys are alphabetically ordered in string representation
    const lines = jsonA.split('\n');
    const firstLevelKeys = lines
      .filter(l => l.match(/^\s{2}"[a-z]":/))
      .map(l => l.match(/^\s{2}"([a-z])":/)![1]);

    expect(firstLevelKeys).toEqual(['a', 'b', 'c']);
  });
});
