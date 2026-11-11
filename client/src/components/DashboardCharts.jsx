import { PiggyBank, ArrowDownToLine, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

// Contribution-by-user palette — cycles through the identity's accent hues
// rather than a generic rainbow, so it still reads as "this app" in a chart.
const CHART_COLORS = ['#5B5FEF', '#10B981', '#F59E0B', '#F43F5E', '#8E8EF4', '#059669'];

const safeINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const tooltipStyle = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--border-hairline)',
  borderRadius: '12px',
  fontSize: '13px',
};

/**
 * All Recharts-backed dashboard visualizations, isolated into one component
 * so Recharts (a heavy dependency) ships as its own lazy-loaded chunk instead
 * of being bundled inline with the rest of the dashboard.
 */
const DashboardCharts = ({ stats, ChartCard }) => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartCard title="Savings trend (6 months)" icon={TrendingUp} delay={0.45}>
        {!stats?.savingsTrend || stats.savingsTrend.length === 0 ? (
          <p className="text-[var(--foreground-muted)] text-center py-16 text-sm">No savings data yet — add a deposit to see the trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.savingsTrend}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5B5FEF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#5B5FEF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" />
              <XAxis dataKey="label" fontSize={12} tickLine={false} stroke="var(--foreground-muted)" />
              <YAxis fontSize={12} tickLine={false} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} stroke="var(--foreground-muted)" width={70} />
              <Tooltip formatter={(value) => [safeINR(value), 'Total']} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="total" stroke="#5B5FEF" fill="url(#colorTotal)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Contribution by user" icon={PiggyBank} delay={0.5}>
        {!stats?.contributionByUser || stats.contributionByUser.length === 0 ? (
          <p className="text-[var(--foreground-muted)] text-center py-16 text-sm">No contributions yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.contributionByUser}
                dataKey="total"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={52}
                paddingAngle={3}
                label={false}
              >
                {stats.contributionByUser.map((entry, index) => (
                  <Cell key={entry._id || entry.name || index} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [safeINR(value), name]} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {stats?.contributionByUser?.length > 0 && (
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5" aria-label="Contribution legend">
            {stats.contributionByUser.slice(0, 6).map((entry, i) => (
              <li key={entry._id || entry.name} className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
                <span className="truncate flex-1 text-[var(--foreground)] font-medium">{entry.name}</span>
                <span className="font-numeric font-semibold">{safeINR(entry.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </ChartCard>
    </div>

    <ChartCard title="Withdrawal analysis (top reasons)" icon={ArrowDownToLine} delay={0.55}>
      {!stats?.withdrawalByReason || stats.withdrawalByReason.length === 0 ? (
        <p className="text-[var(--foreground-muted)] text-center py-16 text-sm">No withdrawals yet — nothing to analyze.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={stats.withdrawalByReason} layout="vertical" margin={{ left: 12, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline)" horizontal={false} />
            <XAxis type="number" fontSize={12} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} stroke="var(--foreground-muted)" />
            <YAxis type="category" dataKey="_id" fontSize={12} width={110} stroke="var(--foreground-muted)" tick={{ fill: 'var(--foreground-muted)' }} />
            <Tooltip formatter={(value) => [safeINR(value), 'Total']} contentStyle={tooltipStyle} />
            <Bar dataKey="total" fill="#F43F5E" radius={[0, 8, 8, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  </>
);

export default DashboardCharts;
