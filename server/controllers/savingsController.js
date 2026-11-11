import Savings from '../models/Savings.js';
import Goal from '../models/Goal.js';
import mongoose from 'mongoose';
import { logActivity } from '../utils/activityLogger.js';
import { buildSafeSearchRegex } from '../utils/regexHelper.js';

const isValidObjectId = (v) => mongoose.isValidObjectId(v);
const parseAmount = (v) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const parseDateOrThrow = (v, label) => {
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    const err = new Error(`Invalid ${label} date`);
    err.statusCode = 400;
    throw err;
  }
  return d;
};

// @desc    Get all savings (supports search, filters, sorting, pagination)
// @route   GET /api/savings
// @access  Private
const getSavings = async (req, res, next) => {
  try {
    const {
      search,
      month,
      year,
      goal,
      user,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (month) query.month = String(month).slice(0, 30);
    if (year) {
      const y = Number(year);
      if (!Number.isInteger(y)) {
        res.status(400);
        throw new Error('Invalid year filter');
      }
      query.year = y;
    }
    if (goal) {
      if (!isValidObjectId(goal)) {
        res.status(400);
        throw new Error('Invalid goal filter');
      }
      query.goal = goal;
    }
    if (user) {
      if (!isValidObjectId(user)) {
        res.status(400);
        throw new Error('Invalid user filter');
      }
      query.user = user;
    }

    const min = parseAmount(minAmount);
    const max = parseAmount(maxAmount);
    if ((minAmount !== undefined && minAmount !== '' && min === undefined) || (maxAmount !== undefined && maxAmount !== '' && max === undefined)) {
      res.status(400);
      throw new Error('Invalid amount filter');
    }
    if (min !== undefined || max !== undefined) {
      query.amount = {};
      if (min !== undefined) query.amount.$gte = min;
      if (max !== undefined) query.amount.$lte = max;
    }

    if (startDate || endDate) {
      query.date = {};
      try {
        if (startDate) query.date.$gte = parseDateOrThrow(startDate, 'start');
        if (endDate) query.date.$lte = parseDateOrThrow(endDate, 'end');
      } catch (e) {
        res.status(400);
        throw e;
      }
    }

    if (search) {
      const regex = buildSafeSearchRegex(search);
      query.$or = [
        { notes: regex },
        { referenceNumber: regex },
        { month: regex },
        { paymentMethod: regex },
      ];
    }

    const sortField = ['date', 'amount', 'createdAt', 'month', 'year'].includes(sortBy) ? sortBy : 'date';
    const sortOrder = order === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [savings, total] = await Promise.all([
      Savings.find(query)
        .populate('user', 'name email avatar')
        .populate('goal', 'name targetAmount')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Savings.countDocuments(query),
    ]);

    res.json({
      data: savings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new saving
// @route   POST /api/savings
// @access  Private
const addSaving = async (req, res, next) => {
  try {
    const { amount, date, month, year, paymentMethod, referenceNumber, notes, type, goal } = req.body;

    if (goal) {
      if (!isValidObjectId(goal)) {
        res.status(400);
        throw new Error('Invalid goal ID');
      }
      const goalExists = await Goal.findById(goal);
      if (!goalExists) {
        res.status(404);
        throw new Error('Linked goal not found');
      }
    }

    const saving = new Savings({
      user: req.user._id,
      amount,
      date,
      month,
      year,
      paymentMethod,
      referenceNumber,
      notes,
      type,
      goal: goal || null,
    });

    const createdSaving = await saving.save();

    await logActivity({
      user: req.user._id,
      action: 'Added Saving',
      details: `Added ${type || 'Monthly'} saving of ₹${amount} for ${month} ${year}`,
      icon: 'PiggyBank',
    });

    const populated = await createdSaving.populate([
      { path: 'user', select: 'name email avatar' },
      { path: 'goal', select: 'name targetAmount' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a saving
// @route   PUT /api/savings/:id
// @access  Private
const updateSaving = async (req, res, next) => {
  try {
    const { amount, date, month, year, paymentMethod, referenceNumber, notes, type, goal } = req.body;

    if (goal !== undefined && goal !== null && goal !== '') {
      if (!isValidObjectId(goal)) {
        res.status(400);
        throw new Error('Invalid goal ID');
      }
      const goalExists = await Goal.findById(goal);
      if (!goalExists) {
        res.status(404);
        throw new Error('Linked goal not found');
      }
    }

    const saving = await Savings.findById(req.params.id);

    if (saving) {
      // Allow user to edit their own or admin
      if (saving.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this saving');
      }

      saving.amount = amount ?? saving.amount;
      saving.date = date || saving.date;
      saving.month = month || saving.month;
      saving.year = year || saving.year;
      saving.paymentMethod = paymentMethod || saving.paymentMethod;
      saving.referenceNumber = referenceNumber ?? saving.referenceNumber;
      saving.notes = notes ?? saving.notes;
      saving.type = type || saving.type;
      if (goal !== undefined) saving.goal = goal || null;

      const updatedSaving = await saving.save();

      await logActivity({
        user: req.user._id,
        action: 'Updated Saving',
        details: `Updated saving of ₹${updatedSaving.amount}`,
        icon: 'Pencil',
      });

      const populated = await updatedSaving.populate([
        { path: 'user', select: 'name email avatar' },
        { path: 'goal', select: 'name targetAmount' },
      ]);

      res.json(populated);
    } else {
      res.status(404);
      throw new Error('Saving not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saving
// @route   DELETE /api/savings/:id
// @access  Private
const deleteSaving = async (req, res, next) => {
  try {
    const saving = await Savings.findById(req.params.id);

    if (saving) {
      if (saving.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this saving');
      }

      await saving.deleteOne();

      await logActivity({
        user: req.user._id,
        action: 'Deleted Saving',
        details: `Deleted saving of ₹${saving.amount}`,
        icon: 'Trash2',
      });

      res.json({ message: 'Saving removed' });
    } else {
      res.status(404);
      throw new Error('Saving not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getSavings, addSaving, updateSaving, deleteSaving };
