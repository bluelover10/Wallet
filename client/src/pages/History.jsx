import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, UserPlus, LogIn, LogOut, User, PiggyBank, ArrowDownToLine, Target, History as HistoryIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Pagination from '../components/Pagination';
import Avatar from '../components/Avatar';

const fetchHistory = async (page) => {
  const { data } = await api.get('/activity', { params: { page, limit: 20 } });
  return data;
};

const getActivityStyle = (action = '') => {
  const a = action.toLowerCase();
  if (a.includes('register')) return { icon: UserPlus, accent: 'primary' };
  if (a.includes('logged in') || a.includes('login')) return { icon: LogIn, accent: 'emerald' };
  if (a.includes('logged out') || a.includes('logout')) return { icon: LogOut, accent: 'ink' };
  if (a.includes('profile')) return { icon: User, accent: 'primary' };
  if (a.includes('saving')) return { icon: PiggyBank, accent: 'emerald' };
  if (a.includes('withdraw')) return { icon: ArrowDownToLine, accent: 'rose' };
  if (a.includes('goal')) return { icon: Target, accent: 'amber' };
  return { icon: HistoryIcon, accent: 'primary' };
};

const accentDot = {
  primary: 'bg-primary-500 shadow-primary-500/30',
  emerald: 'bg-emerald-500 shadow-emerald-500/30',
  rose: 'bg-rose-500 shadow-rose-500/30',
  amber: 'bg-amber-500 shadow-amber-500/30',
  ink: 'bg-ink-400 shadow-ink-400/30',
};

const History = () => {
  const [page, setPage] = useState(1);
  const seenIds = useRef(new Set());
  const [newIds, setNewIds] = useState(new Set());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['activityHistory', page],
    queryFn: () => fetchHistory(page),
    refetchInterval: page === 1 ? 15000 : false,
  });

  const activities = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1, page: 1 };

  useEffect(() => {
    const currentActivities = data?.data || [];
    if (page !== 1 || currentActivities.length === 0) return;
    const freshlySeen = new Set(seenIds.current);
    const justAppeared = new Set();
    currentActivities.forEach((a) => {
      if (!freshlySeen.has(a._id)) justAppeared.add(a._id);
      freshlySeen.add(a._id);
    });
    const hadBaseline = seenIds.current.size > 0;
    seenIds.current = freshlySeen;

    if (!hadBaseline) return;
    if (justAppeared.size === 0) return;
    setNewIds(justAppeared);
    const timer = setTimeout(() => setNewIds(new Set()), 2500);
    return () => clearTimeout(timer);
  }, [data, page]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="animate-rise">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300 mb-1">Audit trail</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Activity history</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">A complete log of every entry made in the ledger. Auto-refreshes on page 1.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-surface rounded-2xl overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 space-y-6" role="status" aria-label="Loading history">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-9 h-9 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3.5 w-1/3 skeleton rounded" />
                  <div className="h-3 w-1/4 skeleton rounded" />
                </div>
              </div>
            ))}
            <span className="sr-only">Loading history…</span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center" role="alert">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Couldn&apos;t load history</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{error?.response?.data?.message || 'Please try again.'}</p>
            <button type="button" onClick={() => refetch()} className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-hairline)] hover:bg-[var(--surface-hover)] transition-colors focus-ring">
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" /> Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="bg-primary-50 dark:bg-primary-500/10 p-4 rounded-2xl mb-4 animate-float-slow">
              <Clock className="w-8 h-8 text-primary-500" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">No history found</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">Actions taken by you or your household will appear here.</p>
          </div>
        ) : (
          <>
            <ul className="relative px-4 sm:px-6 py-2" aria-label="Activity timeline">
              <div className="absolute left-8 sm:left-9 top-2 bottom-2 w-px bg-[var(--border-hairline)]" aria-hidden="true" />
              <AnimatePresence initial={false}>
                {activities.map((activity, i) => {
                  const { icon: Icon, accent } = getActivityStyle(activity.action);
                  const isNew = newIds.has(activity._id);
                  return (
                    <motion.li
                      key={activity._id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0, backgroundColor: isNew ? 'var(--surface-hover)' : 'transparent' }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.2) }}
                      className="relative flex gap-3 sm:gap-4 py-4 rounded-xl px-2"
                    >
                      <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${accentDot[accent]}`}>
                        <Icon className="w-4 h-4 text-white" strokeWidth={2.25} aria-hidden="true" />
                        {isNew && (
                          <motion.span
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 1, repeat: 2 }}
                            className={`absolute inset-0 rounded-full ${accentDot[accent]}`}
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2 flex-wrap">
                              {activity.action}
                              {isNew && (
                                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                                  New
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-0.5 flex items-center gap-1.5">
                              <Avatar user={activity.user} size="sm" className="!h-4 !w-4 !text-[8px]" />
                              {activity.user?.name || 'System'}
                            </p>
                            {activity.details && <p className="text-sm text-[var(--foreground-muted)] mt-1 leading-relaxed">{activity.details}</p>}
                          </div>
                          <div className="flex-shrink-0 flex sm:flex-col sm:text-right items-center sm:items-end gap-1.5 sm:gap-0.5">
                            <p className="text-[11px] uppercase tracking-wide text-[var(--foreground-muted)] font-numeric">
                              {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] flex items-center gap-1 whitespace-nowrap font-numeric">
                              <Clock className="w-3 h-3" aria-hidden="true" />
                              {new Date(activity.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
          </>
        )}
      </motion.div>
    </div>
  );
};

export default History;
