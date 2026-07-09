import { hashString } from './hash-file.ts';
/**
 * Recursively orders keys of an object to ensure deterministic string representation.
 */
export function deterministicStringify(obj) {
    if (obj === null)
        return 'null';
    if (obj === undefined)
        return 'undefined';
    if (typeof obj !== 'object')
        return JSON.stringify(obj);
    if (Array.isArray(obj)) {
        return `[${obj.map(deterministicStringify).join(',')}]`;
    }
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map(key => `"${key}":${deterministicStringify(obj[key])}`);
    return `{${parts.join(',')}}`;
}
/**
 * Deterministically hashes any JSON-serializable object.
 */
export function hashObject(obj) {
    return hashString(deterministicStringify(obj));
}
