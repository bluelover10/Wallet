import Savings from '../models/Savings.js';
import Withdrawal from '../models/Withdrawal.js';
import Goal from '../models/Goal.js';
import ActivityLog from '../models/ActivityLog.js';
import { calculateStreakFromMonths } from '../utils/streakCalculator.js';

const sumOf = (agg) => (agg.length > 0 ? agg[0].total : 0);

/**
 * Calculates the current consecutive-month saving streak.
 * A streak continues as long as each preceding calendar month
 * has at least one saving recorded.
 *
 * Uses a single aggregation to fetch the distinct year/month
 * combinations that have savings (capped to the last 60 months),
 * then walks that set in memory — avoiding the N sequential
 * countDocuments() round-trips a per-month loop would require.
 */
const calculateSavingStreak = async () => {
  const now = new Date();
  const sixtyMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 59, 1);

  const monthsWithSavings = await Savings.aggregate([
    { $match: { date: { $gte: sixtyMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' } },
      },
    },
  ]);

  return calculateStreakFromMonths(monthsWithSavings, now);
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      savingsAggregation,
      withdrawalsAggregation,
      avgHighLowAgg,
      contributionByUser,
      withdrawalByReason,
      monthlyTrend,
    ] = await Promise.all([
      Savings.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Withdrawal.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Savings.aggregate([
        {
          $group: {
            _id: null,
            avg: { $avg: '$amount' },
            max: { $max: '$amount' },
            min: { $min: '$amount' },
          },
        },
      ]),
      Savings.aggregate([
        { $group: { _id: '$user', total: { $sum: '$amount' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { total: 1, name: '$user.name', avatar: '$user.avatar' } },
      ]),
      Withdrawal.aggregate([
        { $group: { _id: '$reason', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
        { $limit: 5 },
      ]),
      // Last 6 months of savings totals, for trend charts
      Savings.aggregate([
        {
          $match: {
            date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const totalSavings = sumOf(savingsAggregation);
    const totalWithdrawals = sumOf(withdrawalsAggregation);
    const currentBalance = totalSavings - totalWithdrawals;

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYearStart = new Date(now.getFullYear(), 0, 1);

    const [currentMonthSavingsAgg, lastMonthSavingsAgg, yearlySavingsAgg] = await Promise.all([
      Savings.aggregate([
        { $match: { date: { $gte: currentMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Savings.aggregate([
        { $match: { date: { $gte: lastMonthStart, $lt: currentMonthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Savings.aggregate([
        { $match: { date: { $gte: currentYearStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const currentMonthSavings = sumOf(currentMonthSavingsAgg);
    const lastMonthSavings = sumOf(lastMonthSavingsAgg);
    const yearlySavings = sumOf(yearlySavingsAgg);

    let savingsGrowth = 0;
    if (lastMonthSavings > 0) {
      savingsGrowth = ((currentMonthSavings - lastMonthSavings) / lastMonthSavings) * 100;
    } else if (currentMonthSavings > 0) {
      savingsGrowth = 100;
    }

    const activeGoals = await Goal.find({ status: 'In Progress', archived: false })
      .sort({ createdAt: -1 })
      .limit(5);

    const goalIds = activeGoals.map((g) => g._id);
    const goalTotals = await Savings.aggregate([
      { $match: { goal: { $in: goalIds } } },
      { $group: { _id: '$goal', total: { $sum: '$amount' } } },
    ]);
    const goalTotalsMap = new Map(goalTotals.map((t) => [t._id.toString(), t.total]));

    const activeGoalsWithProgress = activeGoals.map((g) => {
      const goal = g.toObject();
      const savedAmount = goalTotalsMap.get(g._id.toString()) || 0;
      return {
        ...goal,
        savedAmount,
        progressPercent: goal.targetAmount > 0 ? Math.min(100, Math.round((savedAmount / goal.targetAmount) * 100)) : 0,
      };
    });

    const recentActivity = await ActivityLog.find()
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    const currentStreak = await calculateSavingStreak();
    const avgHighLow = avgHighLowAgg[0] || { avg: 0, max: 0, min: 0 };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const savingsTrend = monthlyTrend.map((m) => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      total: m.total,
    }));

    res.json({
      totalSavings,
      totalWithdrawals,
      currentBalance,
      currentMonthSavings,
      yearlySavings,
      savingsGrowth: parseFloat(savingsGrowth.toFixed(1)),
      averageDeposit: Math.round(avgHighLow.avg || 0),
      highestDeposit: avgHighLow.max || 0,
      lowestDeposit: avgHighLow.min || 0,
      currentStreak,
      contributionByUser,
      withdrawalByReason,
      savingsTrend,
      activeGoals: activeGoalsWithProgress,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};
