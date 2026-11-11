import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, FileSpreadsheet, FileDown, Loader2, Check, CalendarRange } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const REPORT_TYPES = [
  { key: 'pdf', label: 'PDF Report', description: 'Print-friendly summary with totals', icon: FileText, color: 'rose' },
  { key: 'excel', label: 'Excel Workbook', description: 'Separate sheets for savings & withdrawals', icon: FileSpreadsheet, color: 'emerald' },
  { key: 'csv', label: 'CSV File', description: 'Raw data for spreadsheets & tools', icon: FileDown, color: 'primary' },
];

const colorClasses = {
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  primary: 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300',
};

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [justDownloaded, setJustDownloaded] = useState(null);

  const handleDownload = async (type) => {
    if (startDate && endDate && startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }
    setDownloading(type);
    try {
      const response = await api.get(`/reports/${type}`, {
        params: { startDate: startDate || undefined, endDate: endDate || undefined },
        responseType: 'blob',
      });

      const extension = type === 'excel' ? 'xlsx' : type;
      const contentType = response.headers?.['content-type'] || (type === 'pdf' ? 'application/pdf' : type === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv');
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const stamp = `${startDate || 'all'}_to_${endDate || 'all'}`;
      link.setAttribute('download', `savings-report_${stamp}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
      setJustDownloaded(type);
      setTimeout(() => setJustDownloaded(null), 1800);
    } catch (err) {
      const msg = err?.response?.data instanceof Blob ? 'Failed to generate report' : err?.response?.data?.message || 'Failed to generate report';
      toast.error(msg);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="animate-rise">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600 dark:text-primary-300 mb-1">Exports</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Reports</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">Export the ledger for record-keeping or sharing.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-surface rounded-3xl p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="orb w-56 h-56 bg-primary-400/15 -top-20 -right-20" aria-hidden="true" />
        <h2 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2 relative">
          <CalendarRange className="w-4 h-4 text-[var(--foreground-muted)]" aria-hidden="true" />
          Date range (optional)
        </h2>
        <div className="flex flex-wrap gap-3 items-center mb-6 relative">
          <label htmlFor="report-start" className="sr-only">Report start date</label>
          <input
            id="report-start"
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 min-w-[150px] sm:flex-none px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          />
          <span className="text-[var(--foreground-muted)] text-sm" aria-hidden="true">to</span>
          <label htmlFor="report-end" className="sr-only">Report end date</label>
          <input
            id="report-end"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 min-w-[150px] sm:flex-none px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          />
          {(startDate || endDate) && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              type="button"
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="text-sm font-medium text-[var(--foreground-muted)] hover:text-rose-500 transition-colors focus-ring rounded"
            >
              Clear
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
          {REPORT_TYPES.map(({ key, label, description, icon: Icon, color }, idx) => (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleDownload(key)}
              disabled={downloading !== null}
              aria-busy={downloading === key}
              aria-label={`Download ${label}${startDate || endDate ? ` for ${startDate || 'start'} to ${endDate || 'now'}` : ''}`}
              className="text-left p-5 rounded-2xl border border-[var(--border-hairline)] card-surface-hover bg-[var(--surface)] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              <div className={`inline-flex p-3 rounded-xl mb-3 ${colorClasses[color]}`}>
                {downloading === key ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : justDownloaded === key ? (
                  <Check className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Icon className="w-5 h-5" aria-hidden="true" />
                )}
              </div>
              <h3 className="font-bold text-sm text-[var(--foreground)]">{label}</h3>
              <p className="mt-1 text-xs text-[var(--foreground-muted)] leading-relaxed">{description}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-primary-600 dark:text-primary-300">
                {downloading === key ? 'Preparing…' : justDownloaded === key ? 'Saved ✓' : 'Download →'}
              </p>
            </motion.button>
          ))}
        </div>
        <p className="mt-5 text-xs text-[var(--foreground-muted)] relative">
          Tip: set a date range to export just one month, or leave blank for the full ledger.
        </p>
      </motion.div>
    </div>
  );
};

export default Reports;
