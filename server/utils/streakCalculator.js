/**
 * Given the raw aggregation result of distinct { year, month } combinations
 * that have at least one saving, and a reference "now" date, walks backward
 * from the current month counting consecutive months with a saving.
 *
 * This is pure/deterministic and has no DB dependency, so it can be unit
 * tested directly — the aggregation query itself lives in the controller.
 *
 * @param {Array<{_id: {year: number, month: number}}>} monthsWithSavings
 * @param {Date} now
 * @param {number} maxMonths - safety cap to avoid unbounded loops
 */
export const calculateStreakFromMonths = (monthsWithSavings, now = new Date(), maxMonths = 60) => {
  // $month from MongoDB's aggregation is 1-indexed; keys as "YYYY-M" for O(1) lookup
  const monthSet = new Set(monthsWithSavings.map((m) => `${m._id.year}-${m._id.month}`));

  let streak = 0;
  let cursor = new Date(now.getFullYear(), now.getMonth(), 1);

  for (let i = 0; i < maxMonths; i++) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
    if (monthSet.has(key)) {
      streak += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    } else {
      break;
    }
  }

  return streak;
};
