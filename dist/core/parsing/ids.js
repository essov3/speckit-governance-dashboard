/**
 * Helper utilities for working with and formatting SpecKit IDs.
 */
/**
 * Normalizes feature numbers to a 3-digit padded string (e.g. 90 -> "090").
 */
export function normalizeFeatureId(num) {
    const parsed = typeof num === 'number' ? num : parseInt(num, 10);
    if (isNaN(parsed))
        return String(num);
    return String(parsed).padStart(3, '0');
}
/**
 * Normalizes decision IDs (e.g., "d1" or "D-1" -> "D1").
 */
export function normalizeDecisionId(id) {
    const cleaned = id.replace(/[-_\s]/g, '').toUpperCase();
    return cleaned;
}
/**
 * Normalizes gate IDs (e.g., "phase 1" or "p-1" -> "P1").
 */
export function normalizeGateId(id) {
    let cleaned = id.replace(/[-_\s]/g, '').toUpperCase();
    if (cleaned.startsWith('PHASE')) {
        cleaned = 'P' + cleaned.substring(5);
    }
    return cleaned;
}
/**
 * Normalizes task IDs (e.g., "t001" or "T-001" -> "T001").
 */
export function normalizeTaskId(id) {
    const cleaned = id.replace(/[-_\s]/g, '').toUpperCase();
    return cleaned;
}
