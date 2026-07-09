import { describe, it, expect } from 'vitest';
import { parseMarkdownSections } from '../../src/core/parsing/markdown-sections.ts';
import { parseMarkdownChecklist } from '../../src/core/parsing/markdown-checklists.ts';
import { parseMarkdownTables } from '../../src/core/parsing/markdown-tables.ts';
import { extractLinksAndIds } from '../../src/core/parsing/links.ts';
import { normalizeFeatureId, normalizeDecisionId, normalizeGateId, normalizeTaskId } from '../../src/core/parsing/ids.ts';

describe('Markdown Section & Format Parsers', () => {
  it('should parse hierarchical sections correctly', () => {
    const md = `
# Main Title
Intro text.
## Section 1
Content 1.
### Subsection 1.1
Subcontent.
## Section 2
Content 2.
    `;
    const sections = parseMarkdownSections(md);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Main Title');
    expect(sections[0].children).toHaveLength(2);
    expect(sections[0].children[0].title).toBe('Section 1');
    expect(sections[0].children[0].children[0].title).toBe('Subsection 1.1');
    expect(sections[0].children[1].title).toBe('Section 2');
  });

  it('should parse checklists and extract IDs', () => {
    const checklist = `
- [ ] T001 Implementation Task
- [x] T002 Task 2 [P] referenced specs/090-notification/contracts/openapi.yaml for FR-018
- [X] T-003 Decision D1 related
    `;
    const items = parseMarkdownChecklist(checklist);
    expect(items).toHaveLength(3);
    
    expect(items[0].taskId).toBe('T001');
    expect(items[0].checked).toBe(false);

    expect(items[1].taskId).toBe('T002');
    expect(items[1].checked).toBe(true);
    expect(items[1].parallel).toBe(true);
    expect(items[1].frIds).toContain('FR-018');
    expect(items[1].referencedPaths).toContain('specs/090-notification/contracts/openapi.yaml');

    expect(items[2].taskId).toBe('T-003');
    expect(items[2].checked).toBe(true);
    expect(items[2].decisionIds).toContain('D1');
  });

  it('should parse markdown tables and report warnings', () => {
    const tableMd = `
| Header 1 | Header 2 | Header 1 |
|---|---|---|
| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |
| Inconsistent Row | Col 2 |
    `;
    const tables = parseMarkdownTables(tableMd, 'test.md');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Header 1', 'Header 2', 'Header 1']);
    expect(tables[0].rows).toHaveLength(2);

    const warnings = tables[0].warnings;
    const ids = warnings.map(w => w.id);
    expect(ids).toContain('WARN_DUPLICATE_TABLE_HEADERS');
    expect(ids).toContain('WARN_INCONSISTENT_TABLE_COLUMNS');
  });

  it('should extract SHAs and generic IDs', () => {
    const text = 'Commit ab12cd3 was verified. Decision D-4 resolved. Gate P2 blocked.';
    const extracted = extractLinksAndIds(text);
    
    expect(extracted.commitShas).toContain('ab12cd3');
    expect(extracted.decisionIds).toContain('D-4');
    expect(extracted.gateIds).toContain('P2');
  });

  it('should normalize all standard IDs correctly', () => {
    expect(normalizeFeatureId(90)).toBe('090');
    expect(normalizeDecisionId('d-1')).toBe('D1');
    expect(normalizeGateId('phase-3')).toBe('P3');
    expect(normalizeTaskId('t-01')).toBe('T01');
  });
});
