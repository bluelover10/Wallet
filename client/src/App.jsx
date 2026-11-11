import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyOtp = lazy(() => import('./pages/VerifyOtp'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Savings = lazy(() => import('./pages/Savings'));
const Withdrawals = lazy(() => import('./pages/Withdrawals'));
const Goals = lazy(() => import('./pages/Goals'));
const History = lazy(() => import('./pages/History'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));

const PageFallback = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-label="Loading page">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[var(--background)]" role="status" aria-label="Loading">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" aria-hidden="true" />
    <span className="sr-only">Loading…</span>
  </div>
);

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/verify-otp" element={
                <PublicRoute>
                  <VerifyOtp />
                </PublicRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Route>
            
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/withdrawals" element={<Withdrawals />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/history" element={<History />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!font-sans',
          duration: 3500,
          style: {
            background: 'var(--surface)',
            color: 'var(--foreground)',
            border: '1px solid var(--border-hairline)',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.08)',
            fontSize: '14px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#FFFFFF' } },
          error: { iconTheme: { primary: '#F43F5E', secondary: '#FFFFFF' } },
        }}
      />
    </AuthProvider>
  );
}

export default App;
