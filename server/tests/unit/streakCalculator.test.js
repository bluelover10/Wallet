import { describe, it, expect } from 'vitest';
import { calculateStreakFromMonths } from '../../utils/streakCalculator.js';

// Fixed reference date so tests are deterministic: July 2026.
const NOW = new Date(2026, 6, 8); // month is 0-indexed: 6 = July

const monthEntry = (year, month) => ({ _id: { year, month } });

describe('calculateStreakFromMonths', () => {
  it('returns 0 when there are no savings at all', () => {
    expect(calculateStreakFromMonths([], NOW)).toBe(0);
  });

  it('returns 0 when the current month has no saving, even if past months do', () => {
    // June and May have savings, but July (current month) does not — streak
    // counting starts from the current month and must stop immediately.
    const months = [monthEntry(2026, 6), monthEntry(2026, 5)];
    expect(calculateStreakFromMonths(months, NOW)).toBe(0);
  });

  it('counts a single-month streak', () => {
    const months = [monthEntry(2026, 7)]; // July only
    expect(calculateStreakFromMonths(months, NOW)).toBe(1);
  });

  it('counts consecutive months correctly', () => {
    // Jul, Jun, May, Apr all have savings — 4 month streak
    const months = [
      monthEntry(2026, 7),
      monthEntry(2026, 6),
      monthEntry(2026, 5),
      monthEntry(2026, 4),
    ];
    expect(calculateStreakFromMonths(months, NOW)).toBe(4);
  });

  it('stops counting at the first gap', () => {
    // Jul, Jun have savings; May is missing; Apr has savings but shouldn't count
    const months = [
      monthEntry(2026, 7),
      monthEntry(2026, 6),
      monthEntry(2026, 4), // gap at May breaks the streak
    ];
    expect(calculateStreakFromMonths(months, NOW)).toBe(2);
  });

  it('correctly walks backward across a year boundary (Jan -> Dec)', () => {
    const januaryNow = new Date(2026, 0, 15); // Jan 2026
    const months = [
      monthEntry(2026, 1),  // Jan 2026
      monthEntry(2025, 12), // Dec 2025
      monthEntry(2025, 11), // Nov 2025
    ];
    expect(calculateStreakFromMonths(months, januaryNow)).toBe(3);
  });

  it('does not conflate the same month number across different years', () => {
    // Saving exists for July 2025 but NOT July 2026 (current month) —
    // must not be mistaken for a current streak.
    const months = [monthEntry(2025, 7)];
    expect(calculateStreakFromMonths(months, NOW)).toBe(0);
  });

  it('respects the maxMonths cap to avoid unbounded loops', () => {
    // Generate 100 consecutive months of savings, but cap at 60
    const months = [];
    let y = 2026, m = 7;
    for (let i = 0; i < 100; i++) {
      months.push(monthEntry(y, m));
      m -= 1;
      if (m === 0) { m = 12; y -= 1; }
    }
    expect(calculateStreakFromMonths(months, NOW, 60)).toBe(60);
  });
});
