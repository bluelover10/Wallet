import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  isPending = false,
  tone = 'danger',
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}>
    <div className="flex gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          tone === 'danger'
            ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
            : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
        }`}
      >
        <AlertTriangle className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-sm text-[var(--foreground-muted)] leading-relaxed pt-2">{message}</p>
    </div>
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-[var(--surface-hover)] transition-colors focus-ring disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isPending}
        className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl btn-press focus-ring disabled:opacity-60 flex items-center ${
          tone === 'danger'
            ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/25'
            : 'gradient-primary shadow-md shadow-primary-500/25'
        }`}
      >
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
