import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Mongoose models before importing the controller that uses them.
vi.mock('../../models/Goal.js', () => ({
  default: { findById: vi.fn() },
}));
vi.mock('../../models/Savings.js', () => ({
  default: { updateMany: vi.fn(), aggregate: vi.fn() },
}));
vi.mock('../../utils/activityLogger.js', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

const Goal = (await import('../../models/Goal.js')).default;
const Savings = (await import('../../models/Savings.js')).default;
const { deleteGoal } = await import('../../controllers/goalController.js');

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('deleteGoal', () => {
  const goalId = '507f1f77bcf86cd799439011';
  const ownerId = '507f191e810c19729de860ea';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes the goal and nulls out linked savings references (no orphans left)', async () => {
    const deleteOne = vi.fn().mockResolvedValue(undefined);
    const goalDoc = {
      _id: goalId,
      name: 'Vacation fund',
      user: { toString: () => ownerId },
      deleteOne,
    };
    Goal.findById.mockResolvedValue(goalDoc);
    Savings.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const req = { params: { id: goalId }, user: { _id: ownerId, role: 'user' } };
    const res = mockRes();
    const next = vi.fn();

    await deleteGoal(req, res, next);

    expect(deleteOne).toHaveBeenCalledTimes(1);
    // The orphan-cleanup fix: every saving pointing at this goal must be
    // updated to clear the reference, in the same request.
    expect(Savings.updateMany).toHaveBeenCalledWith(
      { goal: goalId },
      { $set: { goal: null } }
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Goal removed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects deletion from a non-owner, non-admin user without touching savings', async () => {
    const deleteOne = vi.fn();
    const goalDoc = {
      _id: goalId,
      name: 'Vacation fund',
      user: { toString: () => 'someone-else' },
      deleteOne,
    };
    Goal.findById.mockResolvedValue(goalDoc);

    const req = { params: { id: goalId }, user: { _id: ownerId, role: 'user' } };
    const res = mockRes();
    const next = vi.fn();

    await deleteGoal(req, res, next);

    expect(deleteOne).not.toHaveBeenCalled();
    expect(Savings.updateMany).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('allows an admin to delete a goal they do not own', async () => {
    const deleteOne = vi.fn().mockResolvedValue(undefined);
    const goalDoc = {
      _id: goalId,
      name: 'Someone else\'s goal',
      user: { toString: () => 'someone-else' },
      deleteOne,
    };
    Goal.findById.mockResolvedValue(goalDoc);
    Savings.updateMany.mockResolvedValue({ modifiedCount: 0 });

    const req = { params: { id: goalId }, user: { _id: ownerId, role: 'admin' } };
    const res = mockRes();
    const next = vi.fn();

    await deleteGoal(req, res, next);

    expect(deleteOne).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ message: 'Goal removed' });
  });

  it('returns 404 and does not call Savings.updateMany when the goal does not exist', async () => {
    Goal.findById.mockResolvedValue(null);

    const req = { params: { id: goalId }, user: { _id: ownerId, role: 'user' } };
    const res = mockRes();
    const next = vi.fn();

    await deleteGoal(req, res, next);

    expect(Savings.updateMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
