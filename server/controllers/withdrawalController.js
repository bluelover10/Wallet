import Withdrawal from '../models/Withdrawal.js';
import mongoose from 'mongoose';
import { logActivity } from '../utils/activityLogger.js';
import { buildSafeSearchRegex } from '../utils/regexHelper.js';

const isValidObjectId = (v) => mongoose.isValidObjectId(v);

// @desc    Get all withdrawals (supports search, filters, sorting, pagination)
// @route   GET /api/withdrawals
// @access  Private
const getWithdrawals = async (req, res, next) => {
  try {
    const {
      search,
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

    if (user) {
      if (!isValidObjectId(user)) {
        res.status(400);
        throw new Error('Invalid user filter');
      }
      query.user = user;
    }

    const min = minAmount !== undefined && minAmount !== '' ? Number(minAmount) : undefined;
    const max = maxAmount !== undefined && maxAmount !== '' ? Number(maxAmount) : undefined;
    if ((minAmount !== undefined && minAmount !== '' && !Number.isFinite(min)) || (maxAmount !== undefined && maxAmount !== '' && !Number.isFinite(max))) {
      res.status(400);
      throw new Error('Invalid amount filter');
    }
    if (min !== undefined || max !== undefined) {
      query.amount = {};
      if (min !== undefined) query.amount.$gte = min;
      if (max !== undefined) query.amount.$lte = max;
    }

    if (startDate || endDate) {
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      if ((s && Number.isNaN(s.getTime())) || (e && Number.isNaN(e.getTime()))) {
        res.status(400);
        throw new Error('Invalid date filter');
      }
      query.date = {};
      if (s) query.date.$gte = s;
      if (e) query.date.$lte = e;
    }

    if (search) {
      const regex = buildSafeSearchRegex(search);
      query.$or = [{ reason: regex }, { notes: regex }];
    }

    const sortField = ['date', 'amount', 'createdAt'].includes(sortBy) ? sortBy : 'date';
    const sortOrder = order === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [withdrawals, total] = await Promise.all([
      Withdrawal.find(query)
        .populate('user', 'name email avatar')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum),
      Withdrawal.countDocuments(query),
    ]);

    res.json({
      data: withdrawals,
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

// @desc    Add a withdrawal
// @route   POST /api/withdrawals
// @access  Private
const addWithdrawal = async (req, res, next) => {
  try {
    const { amount, reason, date, notes } = req.body;

    const withdrawal = new Withdrawal({
      user: req.user._id,
      amount,
      reason,
      date,
      notes,
    });

    const createdWithdrawal = await withdrawal.save();

    await logActivity({
      user: req.user._id,
      action: 'Added Withdrawal',
      details: `Withdrew ₹${amount} for ${reason}`,
      icon: 'ArrowDownToLine',
    });

    const populated = await createdWithdrawal.populate('user', 'name email avatar');

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a withdrawal
// @route   PUT /api/withdrawals/:id
// @access  Private
const updateWithdrawal = async (req, res, next) => {
  try {
    const { amount, reason, date, notes } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      res.status(404);
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to update this withdrawal');
    }

    withdrawal.amount = amount ?? withdrawal.amount;
    withdrawal.reason = reason || withdrawal.reason;
    withdrawal.date = date || withdrawal.date;
    withdrawal.notes = notes ?? withdrawal.notes;

    const updatedWithdrawal = await withdrawal.save();

    await logActivity({
      user: req.user._id,
      action: 'Updated Withdrawal',
      details: `Updated withdrawal of ₹${updatedWithdrawal.amount}`,
      icon: 'Pencil',
    });

    const populated = await updatedWithdrawal.populate('user', 'name email avatar');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a withdrawal
// @route   DELETE /api/withdrawals/:id
// @access  Private
const deleteWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);

    if (withdrawal) {
      if (withdrawal.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this withdrawal');
      }

      await withdrawal.deleteOne();

      await logActivity({
        user: req.user._id,
        action: 'Deleted Withdrawal',
        details: `Deleted withdrawal of ₹${withdrawal.amount}`,
        icon: 'Trash2',
      });

      res.json({ message: 'Withdrawal removed' });
    } else {
      res.status(404);
      throw new Error('Withdrawal not found');
    }
  } catch (error) {
    next(error);
  }
};

export { getWithdrawals, addWithdrawal, updateWithdrawal, deleteWithdrawal };
