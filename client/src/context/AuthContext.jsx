import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get('/auth/me', { _skipAuthRedirect: true });
        setUser(data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();

    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email: String(email).trim().toLowerCase(), password });
    setUser(data);
    return data;
  };

  // Registers a new (unverified) account. Does NOT log the user in —
  // the backend returns { email } so the caller can route to the OTP
  // verification step. The OTP itself is never sent to the frontend;
  // it's only logged server-side and stored in MongoDB.
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name: String(name).trim(), email: String(email).trim().toLowerCase(), password });
    return data;
  };

  // Submits the 6-digit OTP for a pending registration/login. On success
  // the backend sets the auth cookie and returns the logged-in user.
  const verifyOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email: String(email).trim().toLowerCase(), otp: String(otp).trim() });
    setUser(data);
    return data;
  };

  // Requests a fresh OTP be issued for an unverified account.
  const resendOtp = async (email) => {
    const { data } = await api.post('/auth/resend-otp', { email: String(email).trim().toLowerCase() });
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOtp, resendOtp, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
