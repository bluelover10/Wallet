import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import {
  LayoutDashboard,
  PiggyBank,
  ArrowDownToLine,
  Target,
  History,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  FileText,
  Wallet as WalletIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Savings', href: '/savings', icon: PiggyBank },
  { name: 'Withdrawals', href: '/withdrawals', icon: ArrowDownToLine },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'History', href: '/history', icon: History },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: UserIcon },
];

const BrandMark = () => (
  <div className="flex items-center">
    <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/20">
      <WalletIcon className="h-4 w-4 text-white" strokeWidth={2.25} />
    </div>
    <span className="ml-2.5 text-lg font-bold tracking-tight text-[var(--foreground)] dark:text-white">
      Ledger<span className="text-primary-600 dark:text-primary-300">Pro</span>
    </span>
  </div>
);

const NavLink = ({ item, isActive, onClick }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className={`group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? 'text-white'
        : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] dark:text-ink-300 dark:hover:bg-white/5 dark:hover:text-white'
    }`}
  >
    {isActive && (
      <motion.div
        layoutId="active-nav-pill"
        className="absolute inset-0 gradient-primary rounded-xl shadow-lg shadow-primary-500/25"
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />
    )}
    <item.icon className="relative h-[18px] w-[18px] flex-shrink-0" strokeWidth={2} />
    <span className="relative">{item.name}</span>
  </Link>
);

const ThemeToggle = ({ theme, toggleTheme, className = '' }) => (
  <button
    onClick={toggleTheme}
    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    aria-pressed={theme === 'dark'}
    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    className={`relative p-2 rounded-lg overflow-hidden focus-ring transition-colors ${className}`}
  >
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
        className="block"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </motion.span>
    </AnimatePresence>
  </button>
);

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      setSidebarOpen(false);
      navigate('/login', { replace: true });
    } catch {
      toast.error('Failed to sign out');
    }
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--background)] ambient-mesh relative">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex z-40 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="relative flex-1 flex flex-col max-w-xs w-full max-w-[85vw] bg-[var(--surface)] dark:bg-ink-900 border-r border-[var(--border-hairline)] dark:border-white/10"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <BrandMark />
                </div>
                <nav className="mt-6 px-3 space-y-1" aria-label="Mobile navigation">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      item={item}
                      isActive={location.pathname.startsWith(item.href)}
                      onClick={() => setSidebarOpen(false)}
                    />
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-[var(--border-hairline)] dark:border-white/10 p-4">
                <div className="flex items-center w-full">
                  <Avatar user={user} size="md" />
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-base font-medium text-[var(--foreground)] dark:text-white truncate">{user?.name}</p>
                    <button onClick={handleLogout} className="text-sm font-medium text-[var(--foreground-muted)] dark:text-ink-300 hover:text-[var(--foreground)] dark:hover:text-white transition-colors">
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface)] dark:bg-ink-900 border-r border-[var(--border-hairline)] dark:border-white/10">
            <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-5">
                <BrandMark />
              </div>
              <nav className="mt-8 flex-1 px-3 space-y-1">
                {navigation.map((item) => (
                  <NavLink key={item.name} item={item} isActive={location.pathname.startsWith(item.href)} />
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-[var(--border-hairline)] dark:border-white/10 p-4">
              <div className="flex items-center w-full">
                <Avatar user={user} size="md" />
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--foreground)] dark:text-white truncate">{user?.name}</p>
                  <button onClick={handleLogout} aria-label="Sign out" className="text-xs font-medium text-[var(--foreground-muted)] dark:text-ink-300 hover:text-[var(--foreground)] dark:hover:text-white transition-colors flex items-center mt-0.5">
                    <LogOut className="h-3 w-3 mr-1" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="text-[var(--foreground-muted)] dark:text-ink-300 hover:text-[var(--foreground)] dark:hover:text-white hover:bg-[var(--surface-hover)] dark:hover:bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex justify-between items-center bg-[var(--surface)] dark:bg-ink-900 border-b border-[var(--border-hairline)] dark:border-white/10 pb-2">
          <div className="flex items-center px-4">
            <BrandMark />
          </div>
          <div className="flex items-center gap-1 pr-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} className="text-[var(--foreground-muted)] dark:text-ink-300 hover:text-[var(--foreground)] dark:hover:text-white h-10 w-10 flex items-center justify-center" />
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-lg text-[var(--foreground-muted)] dark:text-ink-300 hover:text-[var(--foreground)] dark:hover:text-white focus-ring"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
