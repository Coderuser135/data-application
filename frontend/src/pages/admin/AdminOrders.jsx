import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { fetchAllOrders, updateOrderStatus } from '@/redux/slices/orderSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const TIMELINE_STEPS = ['pending', 'confirmed', 'shipped', 'delivered'];

export default function AdminOrders() {
  const dispatch = useDispatch();
  const { adminItems, loading } = useSelector((state) => state.orders);
  const [query, setQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { dispatch(fetchAllOrders()); }, [dispatch]);

  const filtered = (adminItems || []).filter((o) => {
    const matchesQuery = !query || o.order_number?.toLowerCase().includes(query.toLowerCase()) || o.user_id?.full_name?.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  async function handleStatusChange(orderId, newStatus) {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
    } catch (err) { console.error(err); }
  }

  function getTimelineIndex(status) { return TIMELINE_STEPS.indexOf(status); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-950 dark:text-white">Orders</h1>
        <p className="mt-1 text-sm text-surface-500">Manage supplement store orders</p>
      </div>

      <Card>
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by order number or customer..." className="w-full rounded-xl border border-surface-300 bg-white py-3 pl-12 pr-4 text-sm text-ink-900 outline-none focus:border-brand-500 dark:border-surface-700 dark:bg-surface-950 dark:text-white" />
        </div>
        <div className="mt-3 flex gap-2">
          {['all', ...ORDER_STATUSES].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-4 py-2 text-xs font-semibold capitalize transition ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500 dark:bg-surface-800'}`}>{s}</button>
          ))}
        </div>
      </Card>

      {filtered.length > 0 ? (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left text-xs text-surface-500 dark:border-surface-800">
                  <th className="px-5 py-4 font-medium">Order #</th>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Payment</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-surface-100 last:border-0 dark:border-surface-800">
                    <td className="px-5 py-4 font-medium text-ink-900 dark:text-white">{o.order_number}</td>
                    <td className="px-5 py-4 text-surface-600 dark:text-surface-300">{o.user_id?.full_name || '—'}</td>
                    <td className="px-5 py-4 text-surface-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-4 font-semibold">{formatCurrency(o.total_amount)}</td>
                    <td className="px-5 py-4"><Badge tone={o.payment_status === 'success' ? 'success' : 'warning'}>{o.payment_status}</Badge></td>
                    <td className="px-5 py-4"><Badge tone={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'info'}>{o.status}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : !loading ? <EmptyState title="No orders found" /> : null}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-800 dark:bg-surface-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-800">
              <h2 className="font-display text-lg font-bold text-ink-950 dark:text-white">{selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-surface-50 p-4 dark:bg-surface-800">
                <p className="text-sm font-medium text-ink-900 dark:text-white">{selectedOrder.user_id?.full_name || '—'}</p>
                <p className="text-xs text-surface-500">{selectedOrder.user_id?.email || ''}</p>
                <p className="mt-2 text-xs text-surface-500">{selectedOrder.shipping_address || 'No address'}</p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Items</h4>
                <div className="space-y-2">
                  {(selectedOrder.order_items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-surface-600 dark:text-surface-300">{item.product_name_snapshot} × {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-surface-200 pt-3 text-sm font-bold dark:border-surface-700">
                  <span>Total</span><span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Tracking Timeline</h4>
                <div className="flex items-center justify-between">
                  {TIMELINE_STEPS.map((status, i) => {
                    const currentIdx = getTimelineIndex(selectedOrder.status);
                    const isDone = i <= currentIdx && selectedOrder.status !== 'cancelled';
                    return (
                      <div key={status} className="flex flex-1 flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isDone ? 'bg-brand-600 text-white' : 'bg-surface-200 text-surface-500 dark:bg-surface-800'}`}>{i + 1}</div>
                        <span className="mt-1 text-[10px] capitalize text-surface-500">{status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(selectedOrder.id, s)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${selectedOrder.status === s ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-800'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
