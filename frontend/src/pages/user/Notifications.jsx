import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, CheckCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/redux/slices/notificationSlice';
import { formatDate } from '@/utils/formatters';

export default function Notifications() {
  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.notifications.items);
  const loading = useSelector((state) => state.notifications.loading);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  useEffect(() => { dispatch(fetchNotifications()); }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Notifications</h1>
          <p className="mt-1 text-sm text-surface-500">{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : "You're all caught up"}</p>
        </div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={() => dispatch(markAllNotificationsRead())}><CheckCheck size={16} /> Mark all read</Button>}
      </div>
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.is_read ? 'opacity-60' : 'border-l-4 border-l-brand-600'}>
              <div className="flex items-start gap-3">
                <span className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${n.is_read ? 'bg-surface-100 text-surface-400 dark:bg-surface-800' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'}`}><Bell size={18} /></span>
                <div className="flex-1">
                  <p className="font-semibold text-ink-950 dark:text-white">{n.title}</p>
                  <p className="mt-1 text-sm text-surface-500">{n.message}</p>
                  <p className="mt-2 text-xs text-surface-400">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <button onClick={() => dispatch(markNotificationRead(n.id))} className="text-xs font-medium text-brand-600 hover:text-brand-700">Mark read</button>}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No notifications" description="You're all caught up." />}
    </div>
  );
}
