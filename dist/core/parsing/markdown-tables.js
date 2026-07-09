import { createDiagnostic } from '../diagnostics/warnings.ts';
/**
 * Parses markdown text to extract tables.
 * Emits warnings for inconsistent columns, missing separators, and duplicate headers.
 */
export function parseMarkdownTables(markdown, filePath, startLine = 1) {
    const lines = markdown.split(/\r?\n/);
    const tables = [];
    let inTable = false;
    let currentHeaders = [];
    let currentRows = [];
    let tableLineStart = -1;
    let separatorLine = null;
    let separatorLineIndex = -1;
    function finalizeTable(endIndex) {
        if (!inTable)
            return;
        const warnings = [];
        const lineNumStart = startLine + tableLineStart;
        const lineNumEnd = startLine + endIndex - 1;
        // Check for duplicate headers
        const headerSet = new Set();
        for (const h of currentHeaders) {
            if (headerSet.has(h)) {
                warnings.push(createDiagnostic({
                    id: 'WARN_DUPLICATE_TABLE_HEADERS',
                    severity: 'warning',
                    category: 'parsing',
                    message: `Duplicate table header found: "${h}"`,
                    source: { path: filePath, lineStart: lineNumStart }
                }));
            }
            headerSet.add(h);
        }
        // Check for missing separator line
        if (!separatorLine) {
            warnings.push(createDiagnostic({
                id: 'WARN_MISSING_TABLE_SEPARATOR',
                severity: 'warning',
                category: 'parsing',
                message: `Table is missing standard Markdown separator line (e.g. |---|)`,
                source: { path: filePath, lineStart: lineNumStart }
            }));
        }
        // Check for inconsistent column count in rows
        const expectedCols = currentHeaders.length;
        for (const row of currentRows) {
            if (row.cells.length !== expectedCols) {
                warnings.push(createDiagnostic({
                    id: 'WARN_INCONSISTENT_TABLE_COLUMNS',
                    severity: 'warning',
                    category: 'parsing',
                    message: `Table row on line ${row.line} has ${row.cells.length} columns, but header has ${expectedCols}`,
                    source: { path: filePath, lineStart: row.line }
                }));
            }
        }
        tables.push({
            headers: currentHeaders,
            rows: currentRows,
            lineStart: lineNumStart,
            lineEnd: lineNumEnd,
            warnings
        });
        // Reset
        inTable = false;
        currentHeaders = [];
        currentRows = [];
        tableLineStart = -1;
        separatorLine = null;
        separatorLineIndex = -1;
    }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const isRow = line.startsWith('|') && line.endsWith('|');
        if (isRow) {
            const cells = line
                .split('|')
                .slice(1, -1)
                .map(c => c.trim());
            if (!inTable) {
                // Start of a table (first row is headers)
                inTable = true;
                tableLineStart = i;
                currentHeaders = cells;
            }
            else {
                // We are inside a table
                // Check if this is the separator line (contains only dashes, colons, pipes, and spaces)
                const isSeparator = cells.every(c => /^[:-]+$/.test(c));
                if (isSeparator && !separatorLine) {
                    separatorLine = line;
                    separatorLineIndex = i;
                }
                else {
                    currentRows.push({
                        cells,
                        line: startLine + i
                    });
                }
            }
        }
        else {
            if (inTable) {
                // End of the current table block
                finalizeTable(i);
            }
        }
    }
    // Finalize table if it was cut off by EOF
    if (inTable) {
        finalizeTable(lines.length);
    }
    return tables;
}
