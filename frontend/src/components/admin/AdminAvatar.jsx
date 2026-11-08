export default function AdminAvatar({ name, src, className = '' }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-100 font-semibold text-surface-700 dark:bg-surface-800 dark:text-surface-200 ${className}`}>
      {src ? (
        <img src={src} alt={name ? `${name} profile` : 'Profile'} className="h-full w-full object-cover" />
      ) : initial}
    </span>
  );
}
