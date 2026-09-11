import { useState, useEffect } from 'react';
import { Dumbbell, Menu, X, LayoutDashboard, User, CreditCard, Ruler, ShoppingBag, ShoppingCart, Package, Bell, Settings, LogOut } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { signOut } from '@/redux/slices/authSlice';
import { fetchUnreadCount } from '@/redux/slices/notificationSlice';

const navItems = [
  { to: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/user/gym', icon: Dumbbell, label: 'My Gym' },
  { to: '/user/membership', icon: CreditCard, label: 'Membership' },
  { to: '/user/body-progress', icon: Ruler, label: 'Body Progress' },
  { to: '/user/store', icon: ShoppingBag, label: 'Store' },
  { to: '/user/cart', icon: ShoppingCart, label: 'Cart' },
  { to: '/user/orders', icon: Package, label: 'Orders' },
  { to: '/user/payments', icon: CreditCard, label: 'Payments' },
  { to: '/user/notifications', icon: Bell, label: 'Notifications' },
  { to: '/user/profile', icon: User, label: 'Profile' },
  { to: '/user/settings', icon: Settings, label: 'Settings' },
];

export default function UserLayout() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const profile = useSelector((state) => state.auth.profile);
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0));
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => { dispatch(fetchUnreadCount()); }, [dispatch]);

  async function handleSignOut() {
    await dispatch(signOut());
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="sticky top-0 z-40 border-b border-surface-200 bg-white/90 backdrop-blur-xl dark:border-surface-800 dark:bg-surface-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 lg:hidden">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><Dumbbell size={18} /></span>
              <span className="font-display text-base font-bold text-ink-950 dark:text-white">IRON<span className="text-brand-500">FORGE</span></span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/user/notifications" className="relative rounded-xl p-2.5 text-surface-500 hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800">
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{unreadCount}</span>}
            </Link>
            <Link to="/user/cart" className="relative rounded-xl p-2.5 text-surface-500 hover:bg-surface-100 hover:text-brand-600 dark:hover:bg-surface-800">
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{cartCount}</span>}
            </Link>
            <div className="flex items-center gap-2.5 border-l border-surface-200 pl-3 dark:border-surface-800">
              <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 sm:flex">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <button onClick={handleSignOut} className="rounded-xl p-2.5 text-surface-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><LogOut size={18} /></button>
            </div>
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
        <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
