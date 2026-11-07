import { useState } from 'react';
import {
  Dumbbell,
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  Ruler,
  Package,
  ShoppingCart,
  Bell,
  Settings,
  LogOut,
  ClipboardList,
  UserRound,
  PanelsTopLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { signOut } from '@/redux/slices/authSlice';

const navGroups = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'GYM MANAGEMENT',
    items: [
      { to: '/admin/admissions', icon: UserPlus, label: 'Admissions' },
      { to: '/admin/users', icon: Users, label: 'Members' },
      { to: '/admin/membership-plans', icon: CreditCard, label: 'Membership Plans' },
      { to: '/admin/memberships', icon: ClipboardList, label: 'Memberships' },
      { to: '/admin/body-measurements', icon: Ruler, label: 'Body Measurements' },
    ],
  },
  {
    label: 'STORE & FINANCE',
    items: [
      { to: '/admin/products', icon: Package, label: 'Supplements' },
      { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
      { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    ],
  },
  {
    label: 'COMMUNICATION',
    items: [
      { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
      { to: '/admin/banners', icon: PanelsTopLeft, label: 'Website Banners' },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { to: '/admin/profile', icon: UserRound, label: 'My Profile' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.auth.profile);

  async function handleSignOut() {
    await dispatch(signOut());
    navigate('/');
  }

  return (
    <div className="admin-shell min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="admin-topbar sticky top-0 z-40 border-b border-surface-200 bg-ink-950 text-white dark:border-surface-800">
        <div className="mx-auto flex min-h-16 w-full max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={open}
              className="rounded-xl p-2 text-surface-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 lg:hidden"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-950/30">
                <Dumbbell size={20} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-extrabold leading-tight tracking-wide text-white sm:text-lg">
                  HEAVEN <span className="text-brand-500">GYM</span>
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-surface-400">
                  Management Portal
                </span>
              </span>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 border-r border-white/10 pr-4 md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/15 text-brand-400">
                <ShieldCheck size={16} />
              </span>
              <span className="text-xs font-semibold text-surface-300">Administrator</span>
            </div>
            <ThemeToggle />
            <Link
              to="/admin/profile"
              aria-label="Open admin profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-brand-600/20 text-sm font-bold text-brand-300 ring-2 ring-transparent transition hover:ring-brand-500/40"
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="Admin profile" className="h-full w-full object-cover" />
                : profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-xl p-2.5 text-surface-300 transition hover:bg-red-500/10 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[90rem] min-w-0">
        <aside
          className={`admin-sidebar fixed inset-y-0 left-0 z-30 mt-16 flex w-[17rem] flex-col border-r border-surface-200 bg-white transition-transform duration-200 dark:border-surface-800 dark:bg-surface-900 lg:sticky lg:top-16 lg:mt-0 lg:h-[calc(100vh-4rem)] lg:translate-x-0 ${open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
          aria-label="Admin navigation"
        >
          <div className="border-b border-surface-100 px-5 py-5 dark:border-surface-800">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-surface-400">Workspace</p>
            <p className="mt-1.5 text-sm font-bold text-ink-900 dark:text-white">Gym Administration</p>
            <p className="mt-1 text-xs text-surface-500">Manage your gym operations</p>
          </div>

          <nav className="admin-nav min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Main menu">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[0.16em] text-surface-400">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin/dashboard'}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) => `group flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 shadow-sm dark:bg-brand-500/10 dark:text-brand-400'
                          : 'text-surface-600 hover:bg-surface-100 hover:text-ink-950 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-white'
                      }`}
                    >
                      <item.icon size={17} className="shrink-0 opacity-80 group-hover:opacity-100" />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronRight size={14} className="shrink-0 opacity-0 transition group-[.active]:opacity-70" />
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-surface-100 p-4 dark:border-surface-800">
            <div className="flex items-center gap-3 rounded-xl bg-surface-50 p-3 dark:bg-surface-800/70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-600/15 text-sm font-bold text-brand-600 dark:text-brand-400">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  : profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-ink-900 dark:text-white">
                  {profile?.full_name || 'Administrator'}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-surface-500">Admin account</span>
              </span>
            </div>
          </div>
        </aside>

        {open && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 bg-ink-950/55 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <main className="admin-content w-full min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
