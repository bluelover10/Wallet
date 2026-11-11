import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Please enter email and password');
      return;
    }
    try {
      setLoading(true);
      await login(trimmedEmail, password);
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const resData = error.response?.data;
      if (error.response?.status === 403 && resData?.requiresVerification) {
        toast.error(resData.message || 'Please verify your account first.');
        navigate('/verify-otp', { state: { email: resData.email || trimmedEmail } });
        return;
      }
      toast.error(resData?.message || error.normalizedMessage || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'appearance-none block w-full pl-10 pr-10 py-2.5 border border-[var(--border-hairline)] rounded-xl placeholder-[var(--foreground-muted)] bg-transparent focus-ring focus:border-primary-500 sm:text-sm text-[var(--foreground)] transition-colors';

  return (
    <form className="space-y-5 animate-rise" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="login-email" className="block text-sm font-semibold text-[var(--foreground)]">
          Email address
        </label>
        <div className="mt-1.5 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" aria-hidden="true" />
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-semibold text-[var(--foreground)]">
          Password
        </label>
        <div className="mt-1.5 relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" aria-hidden="true" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors focus-ring rounded"
          >
            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Sign in'}
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-[var(--foreground-muted)]">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors focus-ring rounded">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
};

export default Login;
