export interface ChecklistItem {
  checked: boolean;
  text: string;
  taskId?: string;
  frIds: string[];
  decisionIds: string[];
  referencedPaths: string[];
  parallel: boolean;
  phase?: string;
  line: number;
  raw: string;
}

/**
 * Parses markdown text to extract checklist items (lines starting with - [ ] or - [x]).
 */
export function parseMarkdownChecklist(markdown: string, startLine: number = 1): ChecklistItem[] {
  const lines = markdown.split(/\r?\n/);
  const items: ChecklistItem[] = [];

  // Match: - [ ] text, - [x] text, * [X] text, etc.
  const checklistRegex = /^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/;

  // Match task IDs like T001, T-001, T1
  const taskIdRegex = /\b(T-\d+|T\d+)\b/i;

  // Match FR IDs like FR-018, FR018
  const frIdRegex = /\b(FR-\d+|FR\d+)\b/gi;

  // Match Decision IDs like D1, D-01, D01
  const decisionIdRegex = /\b(D-\d+|D\d+)\b/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(checklistRegex);

    if (match) {
      const checkedChar = match[1];
      const checked = checkedChar === 'x' || checkedChar === 'X';
      const rawText = match[2];
      const lineNum = startLine + i;

      // Extract task ID (first one found)
      const taskMatch = rawText.match(taskIdRegex);
      const taskId = taskMatch ? taskMatch[1] : undefined;

      // Extract FR IDs
      const frIds: string[] = [];
      let frMatch;
      // Reset regex index
      frIdRegex.lastIndex = 0;
      while ((frMatch = frIdRegex.exec(rawText)) !== null) {
        frIds.push(frMatch[1]);
      }

      // Extract Decision IDs
      const decisionIds: string[] = [];
      let decMatch;
      // Reset regex index
      decisionIdRegex.lastIndex = 0;
      while ((decMatch = decisionIdRegex.exec(rawText)) !== null) {
        decisionIds.push(decMatch[1]);
      }

      // Parallel execution marker [P]
      const parallel = /\[P\]/i.test(rawText) || /\bparallel\b/i.test(rawText);

      // Detect Phase (P0, P1, P2, P3, P4 or Phase 1, Phase 2, etc.)
      let phase: string | undefined;
      const phaseMatch = rawText.match(/\b(P[0-4]|Phase\s*[0-4])\b/i);
      if (phaseMatch) {
        phase = phaseMatch[1].toUpperCase();
      }

      // Extract Markdown links [text](path) or raw file paths (e.g. specs/evidence/...)
      const referencedPaths: string[] = [];
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(rawText)) !== null) {
        const linkPath = linkMatch[2].split('#')[0]; // Strip hash anchors
        if (linkPath && !linkPath.startsWith('http://') && !linkPath.startsWith('https://')) {
          referencedPaths.push(linkPath);
        }
      }

      // Also search for raw file paths (e.g. specs/..., evidence/..., reports/...)
      const rawPathRegex = /\b((?:specs|evidence|reports|contracts|openapi)\/[a-zA-Z0-9-_\./]+)\b/g;
      let rawPathMatch;
      while ((rawPathMatch = rawPathRegex.exec(rawText)) !== null) {
        const p = rawPathMatch[1];
        if (!referencedPaths.includes(p)) {
          referencedPaths.push(p);
        }
      }

      items.push({
        checked,
        text: rawText.trim(),
        taskId,
        frIds: Array.from(new Set(frIds)),
        decisionIds: Array.from(new Set(decisionIds)),
        referencedPaths: Array.from(new Set(referencedPaths)),
        parallel,
        phase,
        line: lineNum,
        raw: line
      });
    }
  }

  return items;
}
