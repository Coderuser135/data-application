import { Outlet } from 'react-router-dom';
import PublicNavbar from '@/components/public/PublicNavbar';
import PublicFooter from '@/components/public/PublicFooter';

export default function PublicLayout() {
  return <div className="min-h-screen bg-surface-50 dark:bg-surface-950"><PublicNavbar /><main><Outlet /></main><PublicFooter /></div>;
}
