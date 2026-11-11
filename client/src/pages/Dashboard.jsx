import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PiggyBank, ArrowDownToLine, TrendingUp, Target, Activity,
  Flame, ArrowUp, ArrowDown, BarChart3, RefreshCw, AlertCircle, Wallet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import StatNumber from '../components/StatNumber';
import ErrorBoundary from '../components/ErrorBoundary';

// Recharts is a heavy dependency; isolating it into its own lazy chunk keeps
// the initial Dashboard paint (stat cards, balance) fast even before charts
// finish loading.
const DashboardCharts = lazy(() => import('../components/DashboardCharts'));

const fetchDashboardStats = async () => {
  const { data } = await api.get('/statistics');
  return data;
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

const StatCard = ({ title, value, icon: Icon, delay, isCurrency = true, accent = 'primary', subtext }) => {
  const accentClasses = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  };

  return (
    <motion.div
      custom={delay}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card-surface card-surface-hover rounded-2xl p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--foreground-muted)]">{title}</p>
          <p className="mt-2 text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
            {isCurrency ? <StatNumber value={value} prefix="₹" /> : <StatNumber value={value} />}
          </p>
          {subtext && <div className="mt-1.5 text-xs text-[var(--foreground-muted)]">{subtext}</div>}
        </div>
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${accentClasses[accent]}`} aria-hidden="true">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      </div>
    </motion.div>
  );
};

const ChartCard = ({ title, delay, children, icon: Icon }) => (
  <motion.div
    custom={delay}
    initial="hidden"
    animate="visible"
    variants={cardVariants}
    className="card-surface rounded-2xl p-6"
  >
    <h2 className="text-base font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
      {Icon && <Icon className="w-[18px] h-[18px] text-[var(--foreground-muted)]" aria-hidden="true" />}
      {title}
    </h2>
    {children}
  </motion.div>
);

const ChartsFallback = () => (
  <div className="space-y-6" aria-label="Loading charts" role="status">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-[340px] card-surface rounded-2xl skeleton" />
      <div className="h-[340px] card-surface rounded-2xl skeleton" />
    </div>
    <div className="h-[340px] card-surface rounded-2xl skeleton" />
    <span className="sr-only">Loading charts…</span>
  </div>
);

const Dashboard = () => {
  const { data: stats, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading dashboard">
        <div className="h-8 skeleton rounded-lg w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-72 skeleton rounded-2xl" />
          ))}
        </div>
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card-surface rounded-2xl p-10 text-center max-w-lg mx-auto my-8 animate-rise" role="alert">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-rose-500" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-bold text-[var(--foreground)]">Couldn&apos;t load dashboard</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          {error?.response?.data?.message || error?.normalizedMessage || 'Something went wrong. Check your connection and try again.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-6 inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press focus-ring"
        >
          <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  const growthPositive = (stats?.savingsGrowth || 0) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 animate-rise">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300 mb-1.5">
            Household ledger
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Here&apos;s the shared savings pot, at a glance. {isFetching && <span className="italic">Refreshing…</span>}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2 }}
          className="gradient-mesh-hero rounded-2xl px-6 py-4 text-left sm:text-right shadow-xl shadow-primary-500/25 relative overflow-hidden min-w-[220px]"
        >
          <div className="orb w-32 h-32 bg-white/25 -top-8 -right-8" aria-hidden="true" />
          <p className="text-[11px] uppercase tracking-[0.12em] font-bold text-white/80 flex items-center gap-1.5 sm:justify-end">
            <Wallet className="w-3.5 h-3.5" aria-hidden="true" /> Current balance
          </p>
          <p className="mt-1 text-3xl font-extrabold text-white font-numeric tracking-tight">
            <StatNumber value={stats?.currentBalance} prefix="₹" />
          </p>
          <p className="mt-0.5 text-xs text-white/70 font-medium">
            {stats?.totalSavings ? `${stats?.savingsCount || ''} deposits tracked` : 'No deposits yet'}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Savings" value={stats?.totalSavings} icon={PiggyBank} delay={0.05} accent="emerald" />
        <StatCard
          title="This Month"
          value={stats?.currentMonthSavings}
          icon={TrendingUp}
          delay={0.1}
          accent="primary"
          subtext={
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                growthPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {growthPositive ? <ArrowUp className="w-3 h-3" aria-hidden="true" /> : <ArrowDown className="w-3 h-3" aria-hidden="true" />}
              {Math.abs(stats?.savingsGrowth || 0)}% vs last month
            </span>
          }
        />
        <StatCard title="Total Withdrawals" value={stats?.totalWithdrawals} icon={ArrowDownToLine} delay={0.15} accent="rose" />
        <StatCard
          title="Active Goals"
          value={stats?.activeGoals?.length}
          icon={Target}
          delay={0.2}
          isCurrency={false}
          accent="amber"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Average Deposit" value={stats?.averageDeposit} icon={BarChart3} delay={0.25} accent="primary" />
        <StatCard title="Highest Deposit" value={stats?.highestDeposit} icon={ArrowUp} delay={0.3} accent="emerald" />
        <StatCard title="Lowest Deposit" value={stats?.lowestDeposit} icon={ArrowDown} delay={0.35} accent="rose" />
        <StatCard
          title="Saving Streak"
          value={stats?.currentStreak}
          icon={Flame}
          delay={0.4}
          isCurrency={false}
          accent="amber"
          subtext={stats?.currentStreak === 1 ? 'month in a row — keep it going!' : 'months in a row'}
        />
      </div>

      <ErrorBoundary>
        <Suspense fallback={<ChartsFallback />}>
          <DashboardCharts stats={stats} ChartCard={ChartCard} />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Recent activity" icon={Activity} delay={0.6}>
          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-primary-500" aria-hidden="true" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm">No recent activity yet — deposits will show up here.</p>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto -mx-6 -mb-2 thin-scroll">
              {stats?.recentActivity?.map((activity, i) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`grid grid-cols-[70px_1fr] gap-3 px-6 py-3 ${
                    i !== stats.recentActivity.length - 1 ? 'border-b border-[var(--border-hairline)]' : ''
                  }`}
                >
                  <div className="text-[11px] uppercase tracking-wide text-[var(--foreground-muted)] pt-0.5 font-numeric">
                    {new Date(activity.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[var(--foreground)] truncate">{activity.action}</p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate">{activity.user?.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Goal progress" icon={Target} delay={0.65}>
          {!stats?.activeGoals || stats.activeGoals.length === 0 ? (
            <div className="text-center py-10">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-amber-500" aria-hidden="true" />
              </div>
              <p className="text-[var(--foreground-muted)] text-sm max-w-sm mx-auto">
                Create a goal to see tracking and charts here.
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              {stats?.activeGoals?.map((goal, i) => (
                <div key={goal._id} className="w-full">
                  <div className="flex justify-between items-baseline gap-3 text-sm mb-1.5">
                    <span className="font-medium text-[var(--foreground)] truncate">{goal.name}</span>
                    <span className="text-[var(--foreground-muted)] font-numeric text-xs whitespace-nowrap">
                      ₹{(goal.savedAmount || 0).toLocaleString('en-IN')} / ₹{(goal.targetAmount || 0).toLocaleString('en-IN')} ({goal.progressPercent || 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--surface-hover)] rounded-full h-2 overflow-hidden" role="progressbar" aria-valuenow={goal.progressPercent || 0} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, goal.progressPercent || 0)}%` }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${goal.progressPercent >= 100 ? 'bg-emerald-500' : 'gradient-primary'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
