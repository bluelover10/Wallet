import { useState } from 'react';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '•';

const Avatar = ({ user, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-20 w-20 text-xl',
  };
  const src = user?.avatar;
  const showImg = src && !failed;

  if (showImg) {
    return (
      <img
        src={src}
        alt={user?.name ? `${user.name}'s avatar` : 'User avatar'}
        onError={() => setFailed(true)}
        loading="lazy"
        className={`${sizes[size] || sizes.md} rounded-full object-cover ring-2 ring-primary-400/30 bg-[var(--surface-hover)] flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-hidden={user?.name ? 'false' : 'true'}
      title={user?.name || 'User'}
      className={`${sizes[size] || sizes.md} rounded-full flex items-center justify-center font-bold flex-shrink-0 gradient-primary text-white shadow-md shadow-primary-500/20 ${className}`}
    >
      {getInitials(user?.name)}
    </div>
  );
};

export default Avatar;
