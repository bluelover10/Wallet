import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for diagnostics without leaking to UI
    console.error('UI crashed:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="card-surface rounded-2xl p-10 text-center max-w-lg mx-auto my-10 animate-rise" role="alert">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-rose-500" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Something went wrong</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            This section failed to render. Your data is safe — try again.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white gradient-primary btn-press focus-ring"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border-hairline)] hover:bg-[var(--surface-hover)] transition-colors focus-ring"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
