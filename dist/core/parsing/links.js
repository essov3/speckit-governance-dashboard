import * as fs from 'fs';
import * as path from 'path';
/**
 * Extracts links, SHAs, IDs, and paths from a text block.
 */
export function extractLinksAndIds(text) {
    const markdownLinks = [];
    const urls = [];
    const commitShas = [];
    const frIds = [];
    const taskIds = [];
    const featureIds = [];
    const decisionIds = [];
    const gateIds = [];
    const filePaths = [];
    // 1. Markdown Links [text](url)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let mdLinkMatch;
    while ((mdLinkMatch = mdLinkRegex.exec(text)) !== null) {
        const linkUrl = mdLinkMatch[2].split('#')[0];
        markdownLinks.push({ text: mdLinkMatch[1], url: linkUrl });
        if (linkUrl && !linkUrl.startsWith('http://') && !linkUrl.startsWith('https://')) {
            filePaths.push(linkUrl);
        }
    }
    // 2. URLs (http/https)
    const urlRegex = /\b(https?:\/\/[^\s\)]+)/gi;
    let urlMatch;
    while ((urlMatch = urlRegex.exec(text)) !== null) {
        urls.push(urlMatch[1]);
    }
    // 3. Commit SHAs (40 hex or 7 hex)
    // To avoid false positives on random 7-letter words, we check for word boundaries and pure hex
    const shaRegex = /\b([0-9a-f]{40}|[0-9a-f]{7,8})\b/gi;
    let shaMatch;
    while ((shaMatch = shaRegex.exec(text)) !== null) {
        // Avoid false positives like 'deceded', 'package', 'deadbee' unless in hex-likely context, 
        // but a standard regex boundary is requested. Let's filter out known non-hex dictionary words if needed,
        // or just store them. Checking if it's purely digits and a-f:
        if (/^[0-9a-f]+$/i.test(shaMatch[1])) {
            // Exclude pure numbers if they are short (like 1000000)
            if (!/^\d+$/.test(shaMatch[1]) || shaMatch[1].length >= 10) {
                commitShas.push(shaMatch[1]);
            }
        }
    }
    // 4. FR IDs (FR-018, FR018)
    const frRegex = /\b(FR-\d+|FR\d+)\b/gi;
    let frMatch;
    while ((frMatch = frRegex.exec(text)) !== null) {
        frIds.push(frMatch[1].toUpperCase());
    }
    // 5. Task IDs (T001, T-001)
    const taskRegex = /\b(T-\d+|T\d+)\b/gi;
    let taskMatch;
    while ((taskMatch = taskRegex.exec(text)) !== null) {
        taskIds.push(taskMatch[1].toUpperCase());
    }
    // 6. Decision IDs (D1, D-2, D01)
    const decRegex = /\b(D-\d+|D\d+)\b/gi;
    let decMatch;
    while ((decMatch = decRegex.exec(text)) !== null) {
        decisionIds.push(decMatch[1].toUpperCase());
    }
    // 7. Gate IDs (P0, P1, P2, P3, P4)
    const gateRegex = /\b(P[0-4]|Phase\s*[0-4])\b/gi;
    let gateMatch;
    while ((gateMatch = gateRegex.exec(text)) !== null) {
        let gateId = gateMatch[1].toUpperCase();
        if (gateId.startsWith('PHASE')) {
            gateId = 'P' + gateId.replace(/PHASE\s*/, '');
        }
        gateIds.push(gateId);
    }
    // 8. Feature IDs (e.g. specs/090-client or feature 090 or just 090)
    // Let's match patterns like "specs/090", "feature 090", "feat 090", or "F-090"
    const featRegex = /\b(?:specs?\/|features?|feat|F-)\s*#?(\d+)\b/gi;
    let featMatch;
    while ((featMatch = featRegex.exec(text)) !== null) {
        featureIds.push(featMatch[1].padStart(3, '0'));
    }
    // Deduplicate everything
    return {
        markdownLinks,
        urls: Array.from(new Set(urls)),
        commitShas: Array.from(new Set(commitShas)),
        frIds: Array.from(new Set(frIds)),
        taskIds: Array.from(new Set(taskIds)),
        featureIds: Array.from(new Set(featureIds)),
        decisionIds: Array.from(new Set(decisionIds)),
        gateIds: Array.from(new Set(gateIds)),
        filePaths: Array.from(new Set(filePaths)),
    };
}
/**
 * Resolves a referenced local path and checks if it exists in any of the 4 standard locations.
 * Returns the absolute path if found, or null.
 */
export function resolveReferencedPath(params) {
    const { referencedPath, artifactPath, projectRoot, featureDir } = params;
    // Clean paths (strip query/hash)
    const cleanPath = referencedPath.split('?')[0].split('#')[0];
    const searchLocations = [
        // 1. Current artifact directory
        path.resolve(path.dirname(artifactPath), cleanPath),
        // 2. Project root
        path.resolve(projectRoot, cleanPath),
    ];
    // 3. Feature directory (if applicable)
    if (featureDir) {
        searchLocations.push(path.resolve(featureDir, cleanPath));
    }
    // 4. Specs directory
    searchLocations.push(path.resolve(projectRoot, 'specs', cleanPath));
    for (const loc of searchLocations) {
        if (fs.existsSync(loc)) {
            return loc;
        }
    }
    return null;
}
