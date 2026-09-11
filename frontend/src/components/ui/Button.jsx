import { Loader2 } from 'lucide-react';

export default function Button({ children, variant = 'primary', size = 'md', loading = false, className = '', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/20',
    secondary: 'bg-surface-100 text-ink-900 hover:bg-surface-200 dark:bg-surface-800 dark:text-white dark:hover:bg-surface-700',
    outline: 'border border-surface-300 text-ink-800 hover:border-brand-600 hover:text-brand-600 dark:border-surface-700 dark:text-surface-100',
    ghost: 'text-ink-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-5 py-3 text-sm', lg: 'px-6 py-3.5 text-base' };
  return (
    <button disabled={loading || props.disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
