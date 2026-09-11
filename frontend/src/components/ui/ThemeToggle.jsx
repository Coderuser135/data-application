import { Moon, Sun } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '@/redux/slices/themeSlice';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme.mode);
  return <button onClick={() => dispatch(toggleTheme())} className="rounded-xl p-2.5 text-surface-500 transition hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800" aria-label="Toggle theme">{mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>;
}
