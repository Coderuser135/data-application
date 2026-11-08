import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ label, error, className = '', type = 'text', ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="block space-y-2">
      {label && <span className="text-sm font-medium text-ink-700 dark:text-surface-200">{label}</span>}
      <span className="relative block">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-700 dark:bg-surface-950 dark:text-white ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center justify-center px-4 text-surface-500 transition hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
