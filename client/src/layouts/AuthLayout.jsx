import { Outlet } from 'react-router-dom';
import { Wallet as WalletIcon, PiggyBank, Target, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const perks = [
  { icon: PiggyBank, text: 'Shared ledger for the whole household' },
  { icon: Target, text: 'Goals with real progress tracking' },
  { icon: ShieldCheck, text: 'Secure OTP-verified accounts' },
];

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] ambient-mesh flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="orb w-[480px] h-[280px] bg-primary-400/15 top-[-80px] left-1/2 -translate-x-1/2" aria-hidden="true" />
      <div className="orb w-72 h-72 bg-emerald-400/10 bottom-[-100px] left-[8%]" aria-hidden="true" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mx-auto h-14 w-14 gradient-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30"
        >
          <WalletIcon className="h-7 w-7 text-white" strokeWidth={2.25} aria-hidden="true" />
        </motion.div>
        <h1 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Ledger<span className="gradient-text">Pro</span>
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--foreground-muted)]">
          Your household savings, tracked together.
        </p>
        <div className="mt-4 hidden sm:flex justify-center gap-4 text-[11px] font-semibold text-[var(--foreground-muted)]">
          {perks.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-primary-500" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="card-surface glass-panel py-8 px-5 rounded-3xl sm:px-10 shadow-2xl"
        >
          <Outlet />
        </motion.div>
        <p className="mt-4 text-center text-xs text-[var(--foreground-muted)]">
          Not a bank — records deposits you make elsewhere.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
