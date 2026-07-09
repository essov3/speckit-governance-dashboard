import matter from 'gray-matter';
/**
 * Parses frontmatter from a markdown string.
 * Uses gray-matter, falling back to a custom parser if it fails.
 */
export function parseFrontmatter(markdown) {
    try {
        const { data, content } = matter(markdown);
        return {
            data,
            content,
            hasFrontmatter: Object.keys(data).length > 0
        };
    }
    catch (err) {
        // Custom lightweight fallback parser
        const lines = markdown.split(/\r?\n/);
        if (lines[0]?.trim() === '---') {
            const closingIndex = lines.indexOf('---', 1);
            if (closingIndex !== -1) {
                const frontmatterLines = lines.slice(1, closingIndex);
                const contentLines = lines.slice(closingIndex + 1);
                const data = {};
                for (const line of frontmatterLines) {
                    const match = line.match(/^([^:]+):\s*(.*)$/);
                    if (match) {
                        const key = match[1].trim();
                        let val = match[2].trim();
                        // Try to parse basic types
                        if (val === 'true')
                            val = true;
                        else if (val === 'false')
                            val = false;
                        else if (!isNaN(Number(val)) && val !== '')
                            val = Number(val);
                        else if (val.startsWith('"') && val.endsWith('"'))
                            val = val.slice(1, -1);
                        else if (val.startsWith("'") && val.endsWith("'"))
                            val = val.slice(1, -1);
                        data[key] = val;
                    }
                }
                return {
                    data,
                    content: contentLines.join('\n'),
                    hasFrontmatter: true
                };
            }
        }
        return {
            data: {},
            content: markdown,
            hasFrontmatter: false
        };
    }
}
