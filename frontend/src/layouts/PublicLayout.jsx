import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

function RouteLoader() {
  return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
}

export default function PublicLayout() {
  const user = useSelector((state) => state.auth.user);
  const initializing = useSelector((state) => state.auth.initializing);

  if (initializing) return <RouteLoader />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  return <div className="min-h-screen bg-surface-50 dark:bg-surface-950"><PublicNavbar /><main><Outlet /></main><PublicFooter /></div>;
}
