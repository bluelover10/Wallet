import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Loader2, Save, Camera, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import Avatar from '../components/Avatar';

const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB — must match the server's limit (Cloudinary)

const Settings = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const avatarInputRef = useRef(null);

  // Sync fields once async user loads (e.g. direct refresh on /settings)
  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user?.name, user?.email]);

  const avatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.put('/users/profile/avatar', formData);
      return res.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, avatar: data.avatar }));
      toast.success('Profile picture updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile picture');
    },
  });

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later

    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Please use PNG, JPEG, JPG, or WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error('Image is too large. Please use a file under 5MB.');
      return;
    }

    avatarMutation.mutate(file);
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.put('/users/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      setUser((prev) => ({ ...prev, name: data.name, email: data.email, avatar: data.avatar || prev?.avatar }));
      toast.success('Profile updated successfully!');
      setPassword(''); // clear password field
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || trimmedName.length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!trimmedEmail) {
      toast.error('Email is required');
      return;
    }
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const data = { name: trimmedName, email: trimmedEmail };
    if (password) data.password = password;
    mutation.mutate(data);
  };

  const loading = mutation.isPending;

  const inputClasses = "block w-full pl-10 px-3 py-2.5 border border-[var(--border-hairline)] rounded-xl bg-transparent text-[var(--foreground)] focus-ring focus:border-primary-500 transition-colors";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="animate-rise">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Account <span className="gradient-text">settings</span>
        </h1>
        <p className="mt-1.5 text-sm text-[var(--foreground-muted)]">Update your profile information and manage your account.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="card-surface rounded-3xl overflow-hidden relative"
      >
        <div className="h-24 gradient-mesh-hero relative overflow-hidden" aria-hidden="true">
          <div className="orb w-48 h-48 bg-white/20 -top-10 -left-10" />
          <div className="orb w-40 h-40 bg-emerald-300/30 top-4 right-10" />
        </div>
        <div className="p-6 sm:p-10 pt-0 -mt-10 relative">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
            <div className="relative group w-fit">
              <Avatar user={user} size="lg" className="ring-4 ring-[var(--surface)] shadow-xl" />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarMutation.isPending}
                aria-label="Change profile picture"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 group-hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all disabled:opacity-100 disabled:bg-black/40 focus-ring"
              >
                {avatarMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
                aria-label="Upload profile picture"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[var(--foreground)] truncate">{user?.name || 'Your profile'}</h2>
              <p className="text-[var(--foreground-muted)] truncate">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:text-primary-500 transition-colors disabled:opacity-50 focus-ring rounded"
                >
                  Change photo
                </button>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <ShieldCheck className="w-3 h-3" aria-hidden="true" /> Verified account
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                  <Sparkles className="w-3 h-3" aria-hidden="true" /> {user?.role || 'member'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div>
              <label htmlFor="settings-name" className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  <User className="h-4 w-4 text-[var(--foreground-muted)]" />
                </div>
                <input
                  id="settings-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={inputClasses}
                />
              </div>
            </div>

            <div>
              <label htmlFor="settings-email" className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                  <Mail className="h-4 w-4 text-[var(--foreground-muted)]" />
                </div>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-hairline)]">
              <h3 className="text-base font-bold text-[var(--foreground)] mb-1">Change password</h3>
              <p className="text-sm text-[var(--foreground-muted)] mb-4">Leave this blank if you do not want to change your password.</p>

              <div>
                <label htmlFor="settings-password" className="block text-sm font-semibold text-[var(--foreground)] mb-1.5">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                    <Lock className="h-4 w-4 text-[var(--foreground-muted)]" />
                  </div>
                  <input
                    id="settings-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    autoComplete="new-password"
                    className={`${inputClasses} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors focus-ring rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="inline-flex items-center px-6 py-3 rounded-xl text-sm font-semibold text-white gradient-primary btn-press shadow-md shadow-primary-500/25 hover:shadow-lg hover:shadow-primary-500/30 focus-ring transition-shadow disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4 mr-2" aria-hidden="true" />}
                Save changes
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
