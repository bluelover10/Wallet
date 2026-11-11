import { Search, ArrowUpDown, X } from 'lucide-react';

/**
 * Generic search + sort + date range filter bar.
 * `sortOptions` is an array of { value, label } used to populate the sort dropdown.
 */
const FilterBar = ({
  search,
  onSearchChange,
  sortBy,
  onSortByChange,
  order,
  onOrderChange,
  sortOptions = [],
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear,
  hasActiveFilters,
  searchPlaceholder = 'Search notes, reference, method...',
}) => {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" aria-hidden="true" />
          <label htmlFor="filter-search" className="sr-only">Search</label>
          <input
            id="filter-search"
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <label htmlFor="filter-sort" className="sr-only">Sort by</label>
          <select
            id="filter-sort"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
            aria-label={order === 'asc' ? 'Sort ascending, switch to descending' : 'Sort descending, switch to ascending'}
            aria-pressed={order === 'asc'}
            title={order === 'asc' ? 'Ascending' : 'Descending'}
            className="px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-1.5 transition-colors focus-ring"
          >
            <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
            {order === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label htmlFor="filter-start" className="sr-only">Start date</label>
        <input
          id="filter-start"
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="flex-1 min-w-[140px] sm:flex-none px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          aria-label="Start date"
        />
        <span className="text-[var(--foreground-muted)] text-sm" aria-hidden="true">to</span>
        <label htmlFor="filter-end" className="sr-only">End date</label>
        <input
          id="filter-end"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="flex-1 min-w-[140px] sm:flex-none px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors"
          aria-label="End date"
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:text-rose-500 flex items-center gap-1 transition-colors focus-ring rounded-xl"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
