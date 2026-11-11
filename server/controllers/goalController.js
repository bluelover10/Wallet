import Goal from '../models/Goal.js';
import Savings from '../models/Savings.js';
import { logActivity } from '../utils/activityLogger.js';

const DEADLINE_WARNING_DAYS = 30;

/**
 * Attaches real progress data to a list of goals by summing
 * linked Savings amounts per goal in a single aggregation query.
 */
const attachProgress = async (goals) => {
  const goalIds = goals.map((g) => g._id);

  const totals = await Savings.aggregate([
    { $match: { goal: { $in: goalIds } } },
    { $group: { _id: '$goal', total: { $sum: '$amount' } } },
  ]);

  const totalsMap = new Map(totals.map((t) => [t._id.toString(), t.total]));
  const now = new Date();

  return goals.map((goal) => {
    const g = goal.toObject ? goal.toObject() : goal;
    const savedAmount = totalsMap.get(g._id.toString()) || 0;
    const progressPercent = g.targetAmount > 0
      ? Math.min(100, Math.round((savedAmount / g.targetAmount) * 100))
      : 0;

    const daysToDeadline = Math.ceil((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24));
    const deadlineWarning = g.status === 'In Progress' && daysToDeadline <= DEADLINE_WARNING_DAYS && daysToDeadline >= 0;
    const isOverdue = g.status === 'In Progress' && daysToDeadline < 0;

    return {
      ...g,
      savedAmount,
      progressPercent,
      daysToDeadline,
      deadlineWarning,
      isOverdue,
    };
  });
};

// @desc    Get all goals (with real progress, optional archived filter)
// @route   GET /api/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const { archived, status } = req.query;

    const query = {};
    if (archived !== undefined && archived !== '') {
      if (!['true', 'false'].includes(String(archived))) {
        res.status(400);
        throw new Error('Invalid archived filter');
      }
      query.archived = archived === 'true';
    }
    if (status) {
      if (!['In Progress', 'Achieved', 'Cancelled'].includes(status)) {
        res.status(400);
        throw new Error('Invalid status filter');
      }
      query.status = status;
    }

    const goals = await Goal.find(query).populate('user', 'name email avatar').sort({ createdAt: -1 });
    const goalsWithProgress = await attachProgress(goals);

    res.json(goalsWithProgress);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a goal
// @route   POST /api/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, description, status } = req.body;

    const goal = new Goal({
      user: req.user._id,
      name,
      targetAmount,
      deadline,
      description,
      status,
    });

    const createdGoal = await goal.save();

    await logActivity({
      user: req.user._id,
      action: 'Created Goal',
      details: `Created goal: ${name} with target ₹${targetAmount}`,
      icon: 'Target',
    });

    res.status(201).json(createdGoal);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a goal (including archiving)
// @route   PUT /api/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, deadline, description, status, archived } = req.body;

    const goal = await Goal.findById(req.params.id);

    if (goal) {
      if (goal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this goal');
      }

      if (name !== undefined) goal.name = name;
      if (targetAmount !== undefined) goal.targetAmount = targetAmount;
      if (deadline !== undefined) goal.deadline = deadline;
      if (description !== undefined) goal.description = description;
      if (status !== undefined) goal.status = status;
      if (archived !== undefined) goal.archived = archived;

      const updatedGoal = await goal.save();

      await logActivity({
        user: req.user._id,
        action: 'Updated Goal',
        details: `Updated goal: ${goal.name}`,
        icon: 'Pencil',
      });

      res.json(updatedGoal);
    } else {
      res.status(404);
      throw new Error('Goal not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (goal) {
      if (goal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this goal');
      }

      await goal.deleteOne();

      // Prevent orphaned references: savings that pointed at this goal
      // would otherwise keep a dangling ObjectId after the goal is gone.
      await Savings.updateMany({ goal: goal._id }, { $set: { goal: null } });

      await logActivity({
        user: req.user._id,
        action: 'Deleted Goal',
        details: `Deleted goal: ${goal.name}`,
        icon: 'Trash2',
      });

      res.json({ message: 'Goal removed' });
    } else {
      res.status(404);
      throw new Error('Goal not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getGoals, createGoal, updateGoal, deleteGoal };
