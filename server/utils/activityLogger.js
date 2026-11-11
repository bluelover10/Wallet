import ActivityLog from '../models/ActivityLog.js';

/**
 * Centralized activity logging helper.
 * Wraps ActivityLog.create so failures never crash the parent request —
 * logging is best-effort and should not break the primary action.
 */
export const logActivity = async ({ user, action, details, icon }) => {
  try {
    await ActivityLog.create({ user, action, details, icon });
  } catch (error) {
    console.error('Failed to write activity log:', error.message);
  }
};
