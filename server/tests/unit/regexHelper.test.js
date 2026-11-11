import { describe, it, expect } from 'vitest';
import { escapeRegex, buildSafeSearchRegex } from '../../utils/regexHelper.js';

describe('regexHelper', () => {
  describe('escapeRegex', () => {
    it('escapes all regex metacharacters', () => {
      expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('leaves plain alphanumeric text untouched', () => {
      expect(escapeRegex('UPI payment 2026')).toBe('UPI payment 2026');
    });

    it('handles empty and undefined input without throwing', () => {
      expect(escapeRegex('')).toBe('');
      expect(escapeRegex(undefined)).toBe('');
    });

    it('coerces non-string input to string safely', () => {
      expect(escapeRegex(123)).toBe('123');
    });
  });

  describe('buildSafeSearchRegex', () => {
    it('neutralizes a classic ReDoS payload into a literal match', () => {
      const payload = '(a+)+$';
      const regex = buildSafeSearchRegex(payload);

      // The payload should now only match itself literally...
      expect(regex.test('(a+)+$')).toBe(true);
      // ...and must NOT behave as the catastrophic-backtracking pattern
      // it would have been without escaping.
      expect(regex.test('a'.repeat(40))).toBe(false);
    });

    it('still performs a normal case-insensitive substring search', () => {
      const regex = buildSafeSearchRegex('upi');
      expect(regex.test('Paid via UPI transfer')).toBe(true);
      expect(regex.test('Cash payment')).toBe(false);
    });

    it('does not let special characters in search terms alter matching semantics', () => {
      // A user searching for a literal reference number containing regex
      // metacharacters should get a literal match, not a pattern match.
      const regex = buildSafeSearchRegex('REF#2026.04');
      expect(regex.test('Note: REF#2026.04 pending')).toBe(true);
      expect(regex.test('Note: REF#2026X04 pending')).toBe(false); // '.' must not mean "any char"
    });

    it('resolves quickly even against a long adversarial input (no catastrophic backtracking)', () => {
      const payload = '(a|aa)+$';
      const regex = buildSafeSearchRegex(payload);
      const adversarialInput = 'a'.repeat(50) + '!';

      const start = performance.now();
      regex.test(adversarialInput);
      const elapsed = performance.now() - start;

      // An unescaped version of this pattern would take seconds/hang on
      // input this size; the escaped literal match must resolve near-instantly.
      expect(elapsed).toBeLessThan(50);
    });
  });
});
