import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { toLocalDateInput, todayLocalInput, MONTHS } from '../utils/format';

const savingFormSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  month: z.enum(MONTHS, { message: 'Select a valid month' }),
  year: z.coerce.number().int().min(2000, 'Year must be ≥ 2000').max(2100, 'Year must be ≤ 2100'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card', 'Wallet', 'Other']),
  type: z.enum(['Monthly', 'Extra']),
  goal: z.string().optional(),
  notes: z.string().trim().max(1000, 'Notes too long').optional(),
});

const fetchGoalsForSelect = async () => {
  const { data } = await api.get('/goals?status=In Progress&archived=false');
  return data;
};

const inputCls =
  'mt-1 block w-full px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors';
const errCls = 'mt-1 text-xs text-rose-500 font-medium';
const labelCls = 'block text-sm font-semibold text-[var(--foreground)] mb-1';

const SavingForm = ({ onClose, defaultValues = null }) => {
  const queryClient = useQueryClient();

  const { data: goals, isLoading: goalsLoading, isError: goalsError } = useQuery({
    queryKey: ['goalsForSelect'],
    queryFn: fetchGoalsForSelect,
    staleTime: 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(savingFormSchema),
    defaultValues: {
      amount: defaultValues?.amount || '',
      date: defaultValues?.date ? toLocalDateInput(new Date(defaultValues.date)) : todayLocalInput(),
      month: defaultValues?.month || MONTHS[new Date().getMonth()],
      year: defaultValues?.year || new Date().getFullYear(),
      paymentMethod: defaultValues?.paymentMethod || 'UPI',
      type: defaultValues?.type || 'Monthly',
      goal: defaultValues?.goal?._id || defaultValues?.goal || '',
      notes: defaultValues?.notes || '',
    },
  });

  const watchedDate = useWatch({ control, name: 'date' });
  const formattedDate = watchedDate
    ? new Date(`${watchedDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const mutation = useMutation({
    mutationFn: async (formValues) => {
      const payload = { ...formValues, goal: formValues.goal || null };
      if (defaultValues) {
        return await api.put(`/savings/${defaultValues._id}`, payload);
      }
      return await api.post('/savings', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['activityHistory'] });
      toast.success(`Saving ${defaultValues ? 'updated' : 'added'} successfully!`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    },
  });

  const onSubmit = (values) => mutation.mutate(values);
  const isPending = mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="saving-amount" className={labelCls}>Amount (₹)</label>
        <input id="saving-amount" type="number" step="0.01" min="0" inputMode="decimal" {...register('amount')} className={inputCls} />
        {errors.amount && <p role="alert" className={errCls}>{errors.amount.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="saving-type" className={labelCls}>Type</label>
          <select id="saving-type" {...register('type')} className={inputCls}>
            <option value="Monthly">Monthly</option>
            <option value="Extra">Extra</option>
          </select>
          {errors.type && <p role="alert" className={errCls}>{errors.type.message}</p>}
        </div>
        <div>
          <label htmlFor="saving-method" className={labelCls}>Payment Method</label>
          <select id="saving-method" {...register('paymentMethod')} className={inputCls}>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Wallet">Wallet</option>
            <option value="Other">Other</option>
          </select>
          {errors.paymentMethod && <p role="alert" className={errCls}>{errors.paymentMethod.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="saving-date" className={labelCls}>Date</label>
          <input id="saving-date" type="date" {...register('date')} className={inputCls} />
          {errors.date && <p role="alert" className={errCls}>{errors.date.message}</p>}
          {!errors.date && formattedDate && (
            <p className="mt-1 text-xs text-[var(--foreground-muted)]">{formattedDate}</p>
          )}
        </div>
        <div>
          <label htmlFor="saving-month" className={labelCls}>Month</label>
          <select id="saving-month" {...register('month')} className={inputCls}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          {errors.month && <p role="alert" className={errCls}>{errors.month.message}</p>}
        </div>
        <div>
          <label htmlFor="saving-year" className={labelCls}>Year</label>
          <input id="saving-year" type="number" min={2000} max={2100} {...register('year')} className={inputCls} />
          {errors.year && <p role="alert" className={errCls}>{errors.year.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="saving-goal" className={labelCls}>Link to Goal (Optional)</label>
        <select id="saving-goal" {...register('goal')} className={inputCls} disabled={goalsLoading}>
          <option value="">No goal</option>
          {goals?.map((g) => (
            <option key={g._id} value={g._id}>{g.name}</option>
          ))}
        </select>
        {goalsLoading && <p className="mt-1 text-xs text-[var(--foreground-muted)]">Loading goals…</p>}
        {goalsError && <p className="mt-1 text-xs text-rose-500">Couldn&apos;t load goals — you can still save without one.</p>}
      </div>

      <div>
        <label htmlFor="saving-notes" className={labelCls}>Notes (Optional)</label>
        <textarea id="saving-notes" {...register('notes')} rows="2" maxLength={1000} className={inputCls} />
        {errors.notes && <p role="alert" className={errCls}>{errors.notes.message}</p>}
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors focus-ring disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isPending} aria-busy={isPending}
          className="px-5 py-2.5 text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 rounded-xl flex items-center disabled:opacity-60 focus-ring">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
          {defaultValues ? 'Update Deposit' : 'Save Deposit'}
        </button>
      </div>
    </form>
  );
};

export default SavingForm;
