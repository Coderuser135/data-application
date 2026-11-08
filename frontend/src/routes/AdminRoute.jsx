import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function RouteLoader() {
  return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;
}

export default function AdminRoute({ children }) {
  const user = useSelector((state) => state.auth.user);
  const initializing = useSelector((state) => state.auth.initializing);

  if (initializing) return <RouteLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/user/dashboard" replace />;
  return children;
}
