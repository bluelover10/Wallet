import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const RESEND_COOLDOWN = 30;

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, '');
    const newCode = [...code];

    if (digits.length > 1) {
      const pasted = digits.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || '';
      }
      setCode(newCode);
      const firstEmpty = newCode.findIndex((d) => !d);
      inputRefs.current[firstEmpty === -1 ? 5 : firstEmpty]?.focus();
    } else {
      newCode[index] = digits.slice(-1);
      setCode(newCode);
      if (digits && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = code.join('');
    if (otp.length !== 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    try {
      setLoading(true);
      await verifyOtp(email, otp);
      toast.success('Account verified successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    try {
      setResending(true);
      await resendOtp(email);
      toast.success('A new OTP has been sent.');
      setCooldown(RESEND_COOLDOWN);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="animate-rise">
      <h2 className="text-center text-lg font-bold text-[var(--foreground)] mb-1">
        Verify your account
      </h2>
      <p className="text-center text-sm text-[var(--foreground-muted)] mb-6" id="otp-desc">
        Enter the 6-digit code sent to <span className="font-medium text-[var(--foreground)]">{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="otp-desc">
        <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              aria-label={`Digit ${index + 1}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => {
                if (index !== 0) return;
                const text = e.clipboardData.getData('text');
                if (/\d{6}/.test(text)) {
                  e.preventDefault();
                  handleChange(0, text);
                }
              }}
              className="w-12 h-12 text-center text-xl font-bold border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] focus-ring focus:border-primary-500 transition-all focus:scale-105 font-numeric"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || code.some((d) => !d)}
          aria-busy={loading}
          className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : 'Verify account'}
        </button>
      </form>

      <div className="text-center mt-4 space-y-2">
        <p className="text-sm text-[var(--foreground-muted)]">
          Didn&apos;t get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50 focus-ring rounded"
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
          </button>
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors focus-ring rounded">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
