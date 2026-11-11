import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Pagination = ({ page, totalPages, onPageChange, total }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav aria-label="Pagination" className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between px-6 py-4 border-t border-[var(--border-hairline)]">
      <p className="text-sm text-[var(--foreground-muted)]" aria-live="polite">
        Page <span className="font-semibold text-[var(--foreground)] font-numeric">{page}</span> of {totalPages} &middot; {total} total
      </p>
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: page > 1 ? 0.95 : 1 }}
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="p-2 rounded-lg border border-[var(--border-hairline)] text-[var(--foreground-muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus-ring"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </motion.button>
        <div className="hidden sm:flex items-center gap-1" role="group" aria-label="Page numbers">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Go to page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-colors focus-ring ${
                p === page
                  ? 'gradient-primary text-white shadow-md shadow-primary-500/20'
                  : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: page < totalPages ? 0.95 : 1 }}
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="p-2 rounded-lg border border-[var(--border-hairline)] text-[var(--foreground-muted)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors focus-ring"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </motion.button>
      </div>
    </nav>
  );
};

export default Pagination;
