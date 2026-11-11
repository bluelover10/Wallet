import { describe, it, expect } from 'vitest';
import { sanitizeForSpreadsheet } from '../../utils/spreadsheetSanitizer.js';

describe('sanitizeForSpreadsheet', () => {
  it.each([
    ['=cmd|"/c calc"!A1', "'=cmd|\"/c calc\"!A1"],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(1+1)', "'@SUM(1+1)"],
    ['\t=malicious', "'\t=malicious"],
  ])('prefixes a leading quote when the value starts with %s', (input, expected) => {
    expect(sanitizeForSpreadsheet(input)).toBe(expected);
  });

  it('leaves ordinary text unchanged', () => {
    expect(sanitizeForSpreadsheet('Monthly deposit via UPI')).toBe('Monthly deposit via UPI');
  });

  it('leaves text with a dash or plus sign in the middle unchanged', () => {
    expect(sanitizeForSpreadsheet('Refund for -₹500 item')).toBe('Refund for -₹500 item');
    expect(sanitizeForSpreadsheet('Split 50+50 with roommate')).toBe('Split 50+50 with roommate');
  });

  it('handles null/undefined/empty input without throwing', () => {
    expect(sanitizeForSpreadsheet(null)).toBe('');
    expect(sanitizeForSpreadsheet(undefined)).toBe('');
    expect(sanitizeForSpreadsheet('')).toBe('');
  });

  it('coerces non-string input safely', () => {
    expect(sanitizeForSpreadsheet(12345)).toBe('12345');
  });
});
