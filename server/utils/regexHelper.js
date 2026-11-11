/**
 * Escapes regex metacharacters in user-supplied search input before it is
 * used to build a MongoDB RegExp. Without this, a crafted `search` query
 * (e.g. "(a+)+$") can trigger catastrophic backtracking (ReDoS) and hang
 * the Node event loop, or match unintended documents via regex operators.
 */
export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a case-insensitive "contains" RegExp from raw user input, safely.
 */
export const buildSafeSearchRegex = (value) => new RegExp(escapeRegex(value), 'i');
