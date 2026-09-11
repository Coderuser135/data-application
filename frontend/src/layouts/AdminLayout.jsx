import { useState } from 'react';
import { Dumbbell, Menu, X, LayoutDashboard, Users, UserPlus, CreditCard, Ruler, Package, ShoppingCart, Bell, Settings, LogOut, ClipboardList } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { signOut } from '@/redux/slices/authSlice';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/admissions', icon: UserPlus, label: 'Admissions' },
  { to: '/admin/users', icon: Users, label: 'Members' },
  { to: '/admin/membership-plans', icon: CreditCard, label: 'Plans' },
  { to: '/admin/memberships', icon: ClipboardList, label: 'Memberships' },
  { to: '/admin/body-measurements', icon: Ruler, label: 'Measurements' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.auth.profile);

  async function handleSignOut() { await dispatch(signOut()); navigate('/'); }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-ink-950 text-white dark:border-surface-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-surface-300 hover:bg-white/10 lg:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
            <Link to="/admin/dashboard" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Dumbbell size={18} /></span>
              <span className="font-display text-base font-bold">IRON<span className="text-brand-500">FORGE</span></span>
              <span className="ml-2 rounded-md bg-brand-600/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-brand-500">Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-600/20 text-sm font-bold text-brand-500 sm:flex">{profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
            <button onClick={handleSignOut} className="rounded-xl p-2.5 text-surface-300 hover:bg-red-500/10 hover:text-red-400"><LogOut size={18} /></button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <aside className={`fixed inset-y-0 left-0 z-30 mt-14 w-64 transform border-r border-surface-200 bg-white transition-transform dark:border-surface-800 dark:bg-surface-900 lg:sticky lg:top-14 lg:mt-0 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="space-y-1 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'}`}>
                <item.icon size={18} /> {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/30 lg:hidden" />}
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
