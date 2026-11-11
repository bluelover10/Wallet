import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFound = ({ title = 'Page not found', message = "The page you're looking for doesn't exist or was moved." }) => (
  <div className="card-surface rounded-2xl p-12 text-center max-w-lg mx-auto my-10 animate-rise">
    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4 animate-float-slow">
      <Compass className="w-8 h-8 text-primary-500" aria-hidden="true" />
    </div>
    <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
    <p className="mt-2 text-sm text-[var(--foreground-muted)]">{message}</p>
    <div className="mt-6 flex justify-center gap-3">
      <Link
        to="/dashboard"
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press focus-ring"
      >
        Go to dashboard
      </Link>
    </div>
  </div>
);

export default NotFound;
