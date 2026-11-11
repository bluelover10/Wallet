import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../services/api';
import { toLocalDateInput } from '../utils/format';

const goalFormSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(150),
  targetAmount: z.coerce.number().positive('Target amount must be greater than 0'),
  deadline: z.string().min(1, 'Deadline is required'),
  description: z.string().trim().max(1000, 'Description too long').optional(),
  status: z.enum(['In Progress', 'Achieved', 'Cancelled']),
});

const inputCls =
  'mt-1 block w-full px-3 py-2.5 text-sm border border-[var(--border-hairline)] rounded-xl bg-[var(--surface)] text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors';
const errCls = 'mt-1 text-xs text-rose-500 font-medium';
const labelCls = 'block text-sm font-semibold text-[var(--foreground)] mb-1';

const GoalForm = ({ onClose, defaultValues = null }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      targetAmount: defaultValues?.targetAmount || '',
      deadline: defaultValues?.deadline ? toLocalDateInput(new Date(defaultValues.deadline)) : '',
      description: defaultValues?.description || '',
      status: defaultValues?.status || 'In Progress',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (defaultValues) {
        return await api.put(`/goals/${defaultValues._id}`, data);
      }
      return await api.post('/goals', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goalsForSelect'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['activityHistory'] });
      toast.success(`Goal ${defaultValues ? 'updated' : 'created'} successfully!`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Something went wrong');
    },
  });

  const onSubmit = (values) => {
    if (values.deadline) {
      const d = new Date(`${values.deadline}T00:00:00`);
      if (Number.isNaN(d.getTime())) {
        toast.error('Invalid deadline date');
        return;
      }
      if (!defaultValues && d < new Date(new Date().setHours(0, 0, 0, 0))) {
        toast.error('Deadline cannot be in the past');
        return;
      }
    }
    mutation.mutate(values);
  };
  const isPending = mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="goal-name" className={labelCls}>Goal Name</label>
        <input id="goal-name" type="text" placeholder="e.g. Vacation" {...register('name')} className={inputCls} />
        {errors.name && <p role="alert" className={errCls}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-target" className={labelCls}>Target Amount (₹)</label>
          <input id="goal-target" type="number" step="0.01" min="0" inputMode="decimal" {...register('targetAmount')} className={inputCls} />
          {errors.targetAmount && <p role="alert" className={errCls}>{errors.targetAmount.message}</p>}
        </div>
        <div>
          <label htmlFor="goal-deadline" className={labelCls}>Deadline</label>
          <input id="goal-deadline" type="date" {...register('deadline')} min={toLocalDateInput(new Date())} className={inputCls} />
          {errors.deadline && <p role="alert" className={errCls}>{errors.deadline.message}</p>}
        </div>
      </div>

      {defaultValues && (
        <div>
          <label htmlFor="goal-status" className={labelCls}>Status</label>
          <select id="goal-status" {...register('status')} className={inputCls}>
            <option value="In Progress">In Progress</option>
            <option value="Achieved">Achieved</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {errors.status && <p role="alert" className={errCls}>{errors.status.message}</p>}
        </div>
      )}

      <div>
        <label htmlFor="goal-desc" className={labelCls}>Description (Optional)</label>
        <textarea id="goal-desc" {...register('description')} rows="2" maxLength={1000} className={inputCls} />
        {errors.description && <p role="alert" className={errCls}>{errors.description.message}</p>}
      </div>

      <div className="pt-4 flex justify-end space-x-3">
        <button type="button" onClick={onClose} disabled={isPending}
          className="px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors focus-ring disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={isPending} aria-busy={isPending}
          className="px-5 py-2.5 text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg rounded-xl flex items-center disabled:opacity-60 focus-ring">
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
          {defaultValues ? 'Update Goal' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
};

export default GoalForm;
