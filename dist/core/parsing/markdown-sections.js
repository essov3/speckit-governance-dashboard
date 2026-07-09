/**
 * Parses a markdown string into hierarchical sections based on heading levels (# to ######).
 */
export function parseMarkdownSections(markdown) {
    const lines = markdown.split(/\r?\n/);
    const rootSections = [];
    const stack = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(headingRegex);
        if (match) {
            const level = match[1].length;
            const title = match[2].trim();
            const newSection = {
                title,
                level,
                content: '',
                lineStart: i + 1,
                lineEnd: i + 1,
                children: []
            };
            // Find the parent section in the stack
            // We pop sections from the stack until we find a section with level < current level
            while (stack.length > 0 && stack[stack.length - 1].section.level >= level) {
                const popped = stack.pop();
                if (popped) {
                    popped.section.lineEnd = i; // The section ended on the line before this new heading
                }
            }
            if (stack.length === 0) {
                rootSections.push(newSection);
            }
            else {
                stack[stack.length - 1].section.children.push(newSection);
            }
            stack.push({
                section: newSection,
                parentStack: [...stack]
            });
        }
        else {
            // Append line content to the active section(s)
            if (stack.length > 0) {
                const active = stack[stack.length - 1].section;
                active.content += (active.content ? '\n' : '') + line;
            }
        }
    }
    // Close remaining open sections in the stack
    while (stack.length > 0) {
        const popped = stack.pop();
        if (popped) {
            popped.section.lineEnd = lines.length;
        }
    }
    return rootSections;
}
/**
 * Flatten sections to a list of headings and their direct content.
 */
export function flattenSections(sections) {
    const flat = [];
    function traverse(s) {
        flat.push(s);
        for (const child of s.children) {
            traverse(child);
        }
    }
    for (const s of sections) {
        traverse(s);
    }
    return flat;
}
