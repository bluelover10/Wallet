import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, PiggyBank, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import Modal from '../components/Modal';
import SavingForm from '../components/SavingForm';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import Avatar from '../components/Avatar';
import ConfirmDialog from '../components/ConfirmDialog';
import useDebouncedValue from '../hooks/useDebouncedValue';

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'month', label: 'Month' },
];

const fetchSavings = async (params) => {
  const { data } = await api.get('/savings', { params });
  return data;
};

const Savings = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 350);
  const queryParams = { search: debouncedSearch || undefined, sortBy, order, startDate: startDate || undefined, endDate: endDate || undefined, page, limit: 10 };

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['savings', queryParams],
    queryFn: () => fetchSavings(queryParams),
  });

  const savings = data?.data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1, page: 1 };
  const totalAmount = savings.reduce((s, x) => s + (Number(x.amount) || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/savings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activityHistory'] });
      toast.success('Saving deleted successfully');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete saving');
    },
  });

  const handleEdit = (saving) => {
    setEditingSaving(saving);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSaving(null);
    setIsModalOpen(false);
  };

  const hasActiveFilters = Boolean(search || startDate || endDate || sortBy !== 'date' || order !== 'desc');
  const clearFilters = () => {
    setSearch('');
    setSortBy('date');
    setOrder('desc');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-rise">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400 mb-1">Deposits</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Savings{' '}
            {pagination.total > 0 && (
              <span className="text-base font-bold text-[var(--foreground-muted)] font-numeric">
                · ₹{totalAmount.toLocaleString('en-IN')} on this page · {pagination.total} total
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">Every deposit into the shared pot, logged.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg focus-ring"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
          Add deposit
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-surface rounded-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-6 pb-0">
          <FilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            sortBy={sortBy}
            onSortByChange={(v) => { setSortBy(v); setPage(1); }}
            order={order}
            onOrderChange={(v) => { setOrder(v); setPage(1); }}
            sortOptions={SORT_OPTIONS}
            startDate={startDate}
            onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
            endDate={endDate}
            onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
          {isFetching && !isLoading && (
            <div className="h-0.5 bg-[var(--surface-hover)] rounded-full overflow-hidden mb-2" role="status" aria-label="Refreshing">
              <div className="h-full w-1/3 gradient-primary rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 space-y-3" role="status" aria-label="Loading savings">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
            <span className="sr-only">Loading savings…</span>
          </div>
        ) : isError ? (
          <div className="p-12 text-center" role="alert">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-rose-500" aria-hidden="true" />
            </div>
            <h3 className="font-bold text-[var(--foreground)]">Couldn&apos;t load savings</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{error?.response?.data?.message || 'Please try again.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border-hairline)] hover:bg-[var(--surface-hover)] transition-colors focus-ring"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" /> Retry
            </button>
          </div>
        ) : savings.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4 animate-float-slow">
              <PiggyBank className="w-8 h-8 text-primary-500" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-[var(--foreground)]">No savings found</h3>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {hasActiveFilters ? 'Try adjusting your filters.' : 'Get started by adding your first deposit.'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="mt-3 text-sm font-semibold text-primary-600 dark:text-primary-300 hover:underline focus-ring rounded">
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className={`overflow-x-auto thin-scroll ${isFetching ? 'opacity-70' : ''} transition-opacity`}>
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[var(--border-hairline)]">
                  {['Date', 'Contributor', 'Amount', 'Type', 'Goal', 'Method'].map((h) => (
                    <th key={h} scope="col" className="px-6 py-3 text-left text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-[0.08em]">{h}</th>
                  ))}
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {savings.map((saving) => (
                  <tr
                    key={saving._id}
                    className="border-b border-[var(--border-hairline)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-muted)] font-numeric">
                      {new Date(saving.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar user={saving.user} size="sm" />
                        <div className="ml-3 text-sm font-medium text-[var(--foreground)]">{saving.user?.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-numeric font-bold text-emerald-600 dark:text-emerald-400">
                      +₹{Number(saving.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-1 inline-flex text-[11px] font-bold rounded-full uppercase tracking-wide ${
                          saving.type === 'Monthly'
                            ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}
                      >
                        {saving.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-muted)] max-w-[160px] truncate">
                      {saving.goal?.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--foreground-muted)]">{saving.paymentMethod}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(saving)}
                          aria-label={`Edit saving of ₹${saving.amount}`}
                          title="Edit"
                          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all hover:scale-110 focus-ring"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(saving)}
                          aria-label={`Delete saving of ₹${saving.amount}`}
                          title="Delete"
                          className="p-2 rounded-lg text-[var(--foreground-muted)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all hover:scale-110 focus-ring"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onPageChange={setPage} />
      </motion.div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSaving ? 'Edit Deposit' : 'Add Deposit'}>
        <SavingForm onClose={handleCloseModal} defaultValues={editingSaving} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
        isPending={deleteMutation.isPending}
        title="Delete saving?"
        message={`Delete the ₹${Number(deleteTarget?.amount || 0).toLocaleString('en-IN')} deposit${deleteTarget?.user?.name ? ` by ${deleteTarget.user.name}` : ''}? This cannot be undone.`}
        confirmLabel="Delete saving"
      />
    </div>
  );
};

export default Savings;
