import { useState, useEffect } from 'react';
import { Dumbbell, Menu, X, LayoutDashboard, User, CreditCard, Ruler, ShoppingBag, ShoppingCart, Package, Bell, Settings, LogOut, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

function getPageTitle(pathname) {
  const item = navItems.find((nav) => pathname === nav.to || pathname.startsWith(`${nav.to}/`));
  return item?.label || 'Dashboard';
}

export default function UserLayout() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector((state) => state.auth.profile);
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0));
  const unreadCount = useSelector((state) => state.notifications.unreadCount);
  const pageTitle = getPageTitle(location.pathname);
  const displayName = profile?.full_name || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  useEffect(() => {
    setOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await dispatch(signOut());
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-[#08090c] text-white selection:bg-brand-500/30">
      <aside className={`user-sidebar fixed inset-y-0 left-0 z-50 hidden border-r border-white/[0.08] bg-[#11131b] lg:flex lg:flex-col ${collapsed ? 'w-[84px]' : 'w-[286px]'}`}>
        <div className={`flex h-[72px] shrink-0 items-center border-b border-white/[0.08] ${collapsed ? 'justify-center px-3' : 'justify-between px-5'}`}>
          <Link to="/" className="group flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-[0_0_24px_rgba(220,38,38,0.24)] transition group-hover:scale-105"><Dumbbell size={20} strokeWidth={2.5} /></span>
            {!collapsed && <span className="font-display whitespace-nowrap text-[17px] font-extrabold tracking-tight text-white">IRON<span className="text-brand-500">FORGE</span></span>}
          </Link>
          {!collapsed && <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"><PanelLeftClose size={17} /></button>}
        </div>

        {collapsed && <button type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="mx-auto mt-4 rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"><PanelLeftOpen size={17} /></button>}

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Main menu</p>}
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} title={collapsed ? item.label : undefined} className={({ isActive }) => `group relative flex items-center rounded-xl transition-all duration-200 ${collapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-3'} ${isActive ? 'bg-brand-500 text-white shadow-[0_8px_24px_rgba(220,38,38,0.18)]' : 'text-slate-400 hover:bg-white/[0.055] hover:text-white'}`}>
                <item.icon size={19} strokeWidth={2} className="shrink-0" />
                {!collapsed && <span className="text-[14px] font-semibold tracking-[-0.01em]">{item.label}</span>}
                {!collapsed && item.label === 'Cart' && cartCount > 0 && <span className="ml-auto min-w-5 rounded-full bg-white/15 px-1.5 py-0.5 text-center text-[10px] font-bold">{cartCount}</span>}
                {!collapsed && item.label === 'Notifications' && unreadCount > 0 && <span className="ml-auto min-w-5 rounded-full bg-white/15 px-1.5 py-0.5 text-center text-[10px] font-bold">{unreadCount}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-3">
          <div className={`flex items-center rounded-xl bg-white/[0.035] ${collapsed ? 'justify-center p-2' : 'gap-3 p-3'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white">{initials}</span>
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{displayName}</p><p className="text-[11px] text-slate-500">Member account</p></div>}
          </div>
        </div>
      </aside>

      <aside className={`fixed inset-y-0 left-0 z-[60] w-[286px] transform border-r border-white/[0.08] bg-[#11131b] transition-transform duration-300 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center justify-between border-b border-white/[0.08] px-5">
          <Link to="/" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><Dumbbell size={20} /></span><span className="font-display text-[17px] font-extrabold text-white">IRON<span className="text-brand-500">FORGE</span></span></Link>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="overflow-y-auto px-3 py-5" style={{ maxHeight: 'calc(100vh - 72px)' }}>
          <div className="space-y-1">{navItems.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition ${isActive ? 'bg-brand-500 text-white' : 'text-slate-400 hover:bg-white/[0.055] hover:text-white'}`}><item.icon size={19} /><span>{item.label}</span></NavLink>)}</div>
        </nav>
      </aside>
      {open && <button type="button" aria-label="Close sidebar" onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] lg:hidden" />}

      <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[286px]'}`}>
        <header className="user-topbar sticky top-0 z-40 h-[72px] border-b border-white/[0.08] bg-[#08090c]/90 backdrop-blur-xl">
          <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-2.5 text-slate-400 hover:bg-white/[0.06] hover:text-white lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
              <div className="min-w-0"><p className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-brand-500 sm:block">IronForge Gym</p><h1 className="truncate font-display text-lg font-extrabold tracking-tight text-white sm:text-xl">{pageTitle}</h1></div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Link to="/user/notifications" aria-label="Notifications" className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><Bell size={19} />{unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-extrabold text-white">{unreadCount}</span>}</Link>
              <Link to="/user/cart" aria-label="Cart" className="relative rounded-xl p-2.5 text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><ShoppingCart size={19} />{cartCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-extrabold text-white">{cartCount}</span>}</Link>
              <div className="relative ml-1 border-l border-white/[0.08] pl-2 sm:pl-3">
                <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-white/[0.06]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white">{initials}</span><span className="hidden max-w-[110px] truncate text-sm font-bold text-white md:block">{displayName}</span><ChevronDown size={16} className={`hidden text-slate-500 transition md:block ${profileOpen ? 'rotate-180' : ''}`} /></button>
                {profileOpen && <div className="absolute right-0 top-12 w-48 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#151821] p-1.5 shadow-2xl"><Link to="/user/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] hover:text-white"><User size={17} /> Profile</Link><button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10"><LogOut size={17} /> Sign out</button></div>}
              </div>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-72px)] bg-[#08090c] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="mx-auto w-full max-w-[1440px]"><Outlet /></div></main>
        <footer className="border-t border-white/[0.08] bg-[#08090c] px-4 py-5 text-center text-xs text-slate-500 sm:px-6">© {new Date().getFullYear()} IronForge Gym · Secure payments powered by Razorpay</footer>
      </div>
    </div>
  );
}
