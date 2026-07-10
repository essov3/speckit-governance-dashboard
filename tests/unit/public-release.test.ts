import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = path.resolve(__dirname, '../..');

describe('public release hygiene', () => {
  it('declares the public package metadata and safety promises', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

    expect(pkg.name).toBe('speckit-governance-dashboard');
    expect(pkg.license).toBe('MIT');
    expect(pkg.bin['speckit-governance-dashboard']).toBe('./dist/cli/index.js');
    expect(readme).toContain('Markdown remains the source of truth.');
    expect(readme).toContain('Generated JSON is derived cache only.');
  });

  it('keeps forbidden private path markers out of tracked public text', () => {
    const decode = (...codes: number[]) => String.fromCharCode(...codes);
    const forbidden = [
      decode(47, 104, 111, 109, 101, 47, 101, 115, 115, 111, 118, 51, 47, 99, 117, 114, 114, 101, 110, 116, 95, 119, 111, 114, 107, 47, 111, 97, 114, 45, 98),
      decode(46, 100, 97, 115, 104, 98, 111, 97, 114, 100, 45, 99, 97, 99, 104, 101, 47, 111, 97, 114, 45, 98),
      decode(102, 105, 108, 101, 58, 47, 47, 47, 104, 111, 109, 101, 47),
    ];
    const files = ['README.md', 'package.json', 'docs', 'examples', 'src', 'tests'];

    const visit = (entry: string): string[] => {
      const absolute = path.join(root, entry);
      if (fs.statSync(absolute).isFile()) return [absolute];
      return fs.readdirSync(absolute, { recursive: true })
        .map((child) => path.join(absolute, String(child)))
        .filter((child) => fs.statSync(child).isFile());
    };

    for (const file of files.flatMap(visit)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const marker of forbidden) expect(content).not.toContain(marker);
    }
  });
});
