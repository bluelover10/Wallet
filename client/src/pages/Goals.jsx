import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Target, Pencil, AlertTriangle, Archive, ArchiveRestore, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Modal from '../components/Modal';
import GoalForm from '../components/GoalForm';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';

const fetchGoals = async (archived) => {
  const { data } = await api.get('/goals', { params: { archived } });
  return data;
};

const statusBadgeClasses = (status) => {
  if (status === 'Achieved') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
  if (status === 'Cancelled') return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
  return 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300';
};

const Goals = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: goals, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['goals', showArchived],
    queryFn: () => fetchGoals(showArchived),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['goalsForSelect'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    queryClient.invalidateQueries({ queryKey: ['activityHistory'] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/goals/${id}`),
    onSuccess: () => {
      invalidateAll();
      toast.success('Goal deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete goal');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }) => await api.put(`/goals/${id}`, { archived }),
    onSuccess: (_, variables) => {
      invalidateAll();
      toast.success(variables.archived ? 'Goal archived' : 'Goal restored');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update goal');
    },
  });

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingGoal(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300 mb-1">Targets</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Savings goals{' '}
            {goals?.length > 0 && <span className="text-base font-bold text-[var(--foreground-muted)] font-numeric">· {goals.length}</span>}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">What the household is saving toward.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowArchived((v) => !v)}
            aria-pressed={showArchived}
            className={`inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all focus-ring ${
              showArchived ? 'bg-ink-800 dark:bg-white text-white dark:text-ink-900 shadow-md' : 'card-surface text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            <Archive className="w-4 h-4 mr-2" aria-hidden="true" />
            {showArchived ? 'Showing archived' : 'Show archived'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg focus-ring"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            Create goal
          </motion.button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-label="Loading goals">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 card-surface rounded-2xl skeleton" />
          ))}
          <span className="sr-only">Loading goals…</span>
        </div>
      ) : isError ? (
        <div className="card-surface rounded-2xl p-12 text-center" role="alert">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-rose-500" aria-hidden="true" />
          </div>
          <h3 className="font-bold text-[var(--foreground)]">Couldn&apos;t load goals</h3>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{error?.response?.data?.message || 'Please try again.'}</p>
          <button type="button" onClick={() => refetch()} className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-hairline)] hover:bg-[var(--surface-hover)] transition-colors focus-ring">
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" /> Retry
          </button>
        </div>
      ) : goals?.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-surface rounded-2xl p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4 animate-float-slow">
            <Target className="w-8 h-8 text-primary-500" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-[var(--foreground)]">{showArchived ? 'No archived goals' : 'No goals set'}</h3>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {showArchived ? 'Goals you archive will show up here.' : 'Start by creating your first savings goal.'}
          </p>
          {!showArchived && (
            <button type="button" onClick={() => setIsModalOpen(true)} className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press focus-ring">
              Create your first goal
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {goals?.map((goal, index) => (
              <motion.div
                key={goal._id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="card-surface card-surface-hover rounded-2xl p-6 relative overflow-hidden"
              >
                {goal.progressPercent >= 100 && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />}
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[var(--foreground)] truncate">{goal.name}</h3>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${statusBadgeClasses(goal.status)}`}>{goal.status}</span>
                      {goal.progressPercent >= 100 && goal.status === 'In Progress' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Target reached
                        </span>
                      )}
                      {goal.deadlineWarning && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" /> {goal.daysToDeadline}d left
                        </span>
                      )}
                      {goal.isOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                          <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button type="button" onClick={() => handleEdit(goal)} aria-label={`Edit goal ${goal.name}`} title="Edit"
                      className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all hover:scale-110 focus-ring">
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => archiveMutation.mutate({ id: goal._id, archived: !goal.archived })} disabled={archiveMutation.isPending}
                      aria-label={goal.archived ? `Restore goal ${goal.name}` : `Archive goal ${goal.name}`} title={goal.archived ? 'Restore' : 'Archive'}
                      className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all hover:scale-110 focus-ring disabled:opacity-50">
                      {goal.archived ? <ArchiveRestore className="w-4 h-4" aria-hidden="true" /> : <Archive className="w-4 h-4" aria-hidden="true" />}
                    </button>
                    <button type="button" onClick={() => setDeleteTarget(goal)} aria-label={`Delete goal ${goal.name}`} title="Delete"
                      className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all hover:scale-110 focus-ring">
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-baseline text-sm mb-1.5 gap-2">
                      <span className="text-[var(--foreground-muted)] font-numeric text-xs truncate">
                        ₹{(goal.savedAmount || 0).toLocaleString('en-IN')} of ₹{(goal.targetAmount || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="font-bold text-[var(--foreground)] font-numeric">{goal.progressPercent || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--surface-hover)] rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={goal.progressPercent || 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, goal.progressPercent || 0)}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${goal.progressPercent >= 100 ? 'bg-emerald-500' : 'gradient-primary'}`} />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--foreground-muted)]">Deadline</span>
                    <span className={`font-medium font-numeric ${goal.isOverdue ? 'text-rose-500' : 'text-[var(--foreground)]'}`}>
                      {new Date(goal.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {goal.description && <p className="text-sm text-[var(--foreground-muted)] mt-2 line-clamp-2 leading-relaxed">{goal.description}</p>}

                  <div className="flex items-center mt-4 pt-4 border-t border-[var(--border-hairline)]">
                    <Avatar user={goal.user} size="sm" className="!h-6 !w-6 !text-[10px]" />
                    <span className="ml-2 text-xs text-[var(--foreground-muted)] truncate">Created by {goal.user?.name}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingGoal ? 'Edit Goal' : 'Create Goal'}>
        <GoalForm onClose={handleCloseModal} defaultValues={editingGoal} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        isPending={deleteMutation.isPending}
        title="Delete goal?"
        message={`Delete “${deleteTarget?.name}”? Linked savings will be kept but unlinked. This cannot be undone.`}
        confirmLabel="Delete goal"
      />
    </div>
  );
};

export default Goals;
