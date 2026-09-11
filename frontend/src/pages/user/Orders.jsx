import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchMyOrders } from '@/redux/slices/orderSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function Orders() {
  const dispatch = useDispatch();
  const orders = useSelector((state) => state.orders.items);
  const loading = useSelector((state) => state.orders.loading);

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">My Orders</h1>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink-950 dark:text-white">{order.order_number}</p>
                  <p className="text-xs text-surface-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : order.status === 'cancelled' ? 'danger' : 'info'}>{order.status}</Badge>
                  <span className="font-display text-lg font-bold">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-surface-100 pt-3 dark:border-surface-800">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-surface-600 dark:text-surface-300">{item.product_name_snapshot} × {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : <EmptyState title="No orders yet" description="Shop supplements to place your first order." ><Link to="/user/store"><Button>Shop now</Button></Link></EmptyState>}
    </div>
  );
}
