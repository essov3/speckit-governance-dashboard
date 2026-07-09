import { deterministicStringify } from '../hashing/hash-object.ts';

/**
 * Returns a stable JSON string of an object with 2-space indentation.
 */
export function toDeterministicJson(obj: any): string {
  // We can format it nicely using a custom replacer or a sorted stringifier
  // Let's implement a nice sorted formatter with indentation
  return JSON.stringify(sortObjectKeys(obj), null, 2);
}

/**
 * Recursively sorts the keys of an object.
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sortedObj: any = {};
  const keys = Object.keys(obj).sort();
  
  for (const key of keys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  
  return sortedObj;
}
