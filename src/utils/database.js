import { randomUUID } from 'crypto';

/**
 * Generate a UUID for MySQL (same as PostgreSQL gen_random_uuid())
 */
export const generateUUID = () => {
  return randomUUID();
};

/**
 * Convert PostgreSQL parameterized query to MySQL format
 * PostgreSQL uses $1, $2, $3... MySQL uses ?
 * @param {string} query - PostgreSQL query with $1, $2, etc.
 * @returns {string} - MySQL query with ? placeholders
 */
export const convertQuery = (query) => {
  // Replace $1, $2, $3... with ?
  return query.replace(/\$\d+/g, '?');
};

/**
 * Convert PostgreSQL array to MySQL JSON
 * PostgreSQL: ['item1', 'item2'] or ARRAY['item1', 'item2']
 * MySQL: JSON_ARRAY('item1', 'item2') or just use JSON.stringify([...])
 */
export const arrayToJSON = (arr) => {
  return arr ? JSON.stringify(arr) : null;
};

/**
 * Convert MySQL JSON to array
 */
export const jsonToArray = (json) => {
  if (!json) return [];
  if (typeof json === 'string') {
    try {
      return JSON.parse(json);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(json) ? json : [];
};

/**
 * Helper to wrap results with proper JSON parsing for arrays
 */
export const processRows = (rows) => {
  return rows.map(row => {
    const processed = { ...row };
    // Auto-convert JSON fields back to arrays if they look like arrays
    Object.keys(processed).forEach(key => {
      if (processed[key] && typeof processed[key] === 'string' && processed[key].startsWith('[')) {
        try {
          processed[key] = JSON.parse(processed[key]);
        } catch (e) {
          // Keep as string if not valid JSON
        }
      }
    });
    return processed;
  });
};
