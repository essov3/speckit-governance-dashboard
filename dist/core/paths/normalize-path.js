import * as path from 'path';
/**
 * Normalizes a path to use forward slashes.
 */
export function toForwardSlash(p) {
    return p.replace(/\\/g, '/');
}
/**
 * Converts a path to an absolute path, resolved against the base directory.
 * If the path is already absolute, it returns the normalized absolute path.
 */
export function toAbsolutePath(p, baseDir = process.cwd()) {
    if (path.isAbsolute(p)) {
        return path.resolve(p);
    }
    return path.resolve(baseDir, p);
}
/**
 * Computes a relative path from a base directory, normalized to forward slashes.
 */
export function toRelativePath(absolutePath, baseDir) {
    const relative = path.relative(baseDir, absolutePath);
    return toForwardSlash(relative);
}
