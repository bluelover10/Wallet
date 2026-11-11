import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { toLocalDateInput, todayLocalInput } from '../utils/format';

const withdrawalFormSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  reason: z.string().trim().min(1, 'Reason is required').max(200, 'Reason too long'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().trim().max(1000, 'Notes too long').optional(),
});

const inputCls =
  'mt-1 block w-full px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-rose-500 transition-colors';
const errCls = 'mt-1 text-xs text-rose-500 font-medium';
const labelCls = 'block text-sm font-semibold text-[var(--foreground)] mb-1';

const WithdrawalForm = ({ onClose, defaultValues = null }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: defaultValues?.amount || '',
      reason: defaultValues?.reason || '',
      date: defaultValues?.date ? toLocalDateInput(new Date(defaultValues.date)) : todayLocalInput(),
      notes: defaultValues?.notes || '',
    },
  });

  const watchedDate = useWatch({ control, name: 'date' });
  const formattedDate = watchedDate
    ? new Date(`${watchedDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';

  const mutation = useMutation({
    mutationFn: async (formValues) => {
      if (defaultValues) {
        return await api.put(`/withdrawals/${defaultValues._id}`, formValues);
      }
      return await api.post('/withdrawals', formValues);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityHistory'] });
      toast.success(`Withdrawal ${defaultValues ? 'updated' : 'added'} successfully!`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save withdrawal');
    },
  });

  const onSubmit = (values) => mutation.mutate(values);
  const isPending = mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="wd-amount" className={labelCls}>Amount (₹)</label>
        <input id="wd-amount" type="number" step="0.01" min="0" inputMode="decimal" {...register('amount')} className={inputCls} />
        {errors.amount && <p role="alert" className={errCls}>{errors.amount.message}</p>}
      </div>

      <div>
        <label htmlFor="wd-reason" className={labelCls}>Reason</label>
        <input id="wd-reason" type="text" placeholder="e.g. Emergency, Shopping" {...register('reason')} className={inputCls} />
        {errors.reason && <p role="alert" className={errCls}>{errors.reason.message}</p>}
      </div>

      <div>
        <label htmlFor="wd-date" className={labelCls}>Date</label>
        <input id="wd-date" type="date" {...register('date')} className={inputCls} />
        {errors.date && <p role="alert" className={errCls}>{errors.date.message}</p>}
        {!errors.date && formattedDate && (
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">{formattedDate}</p>
        )}
      </div>

      <div>
        <label htmlFor="wd-notes" className={labelCls}>Notes (Optional)</label>
        <textarea id="wd-notes" {...register('notes')} rows="2" maxLength={1000} className={inputCls} />
        {errors.notes && <p role="alert" className={errCls}>{errors.notes.message}</p>}
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors focus-ring disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isPending} aria-busy={isPending}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-rose-500 to-rose-600 btn-press shadow-md shadow-rose-500/25 hover:shadow-lg rounded-xl flex items-center disabled:opacity-60 focus-ring">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
          {defaultValues ? 'Update Withdrawal' : 'Withdraw Funds'}
        </button>
      </div>
    </form>
  );
};

export default WithdrawalForm;
