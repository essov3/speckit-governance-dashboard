import * as crypto from 'crypto';
import * as fs from 'fs';
/**
 * Computes the SHA-256 hash of a file's content.
 * Returns a hex string prefixed with 'sha256:'.
 */
export function hashFileContent(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        return hashBuffer(fileBuffer);
    }
    catch (err) {
        return 'sha256:error';
    }
}
/**
 * Computes the SHA-256 hash of a string content.
 */
export function hashString(content) {
    const hash = crypto.createHash('sha256');
    hash.update(content, 'utf8');
    return `sha256:${hash.digest('hex')}`;
}
/**
 * Computes the SHA-256 hash of a buffer.
 */
export function hashBuffer(buffer) {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return `sha256:${hash.digest('hex')}`;
}
