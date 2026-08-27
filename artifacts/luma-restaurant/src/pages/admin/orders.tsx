import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin-layout';
import { apiRequest, formatDateTime, formatPrice } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Order = {
  id: number;
  customerName: string;
  customerEmail: string;
  orderType: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  status: string;
  createdAt: string;
};

const statuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    apiRequest<Order[]>('/orders').then((data) => { setOrders(data); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const updateStatus = async (id: number, nextStatus: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)));
    } catch {
      // Keep the previous status displayed; the dropdown will simply revert on next load.
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this order? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await apiRequest(`/orders/${id}`, { method: 'DELETE' });
      setOrders((current) => current.filter((order) => order.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return <AdminShell title="Orders">
    {status === 'loading' && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {status === 'error' && <p className="text-sm text-[#df7c5b]">Could not load orders.</p>}
    {status === 'ready' && orders.length === 0 && <p className="text-sm text-[#c9b99f]/60">No orders yet.</p>}
    {status === 'ready' && orders.length > 0 && <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left eyebrow border-b hairline"><th className="pb-3 pr-4 font-normal">Customer</th><th className="pb-3 pr-4 font-normal">Type</th><th className="pb-3 pr-4 font-normal">Total</th><th className="pb-3 pr-4 font-normal">Placed</th><th className="pb-3 pr-4 font-normal">Status</th><th className="pb-3 font-normal"></th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} data-testid={`row-order-${order.id}`} className="border-b hairline">
              <td className="py-4 pr-4"><p className="text-[#f1e4c6]">{order.customerName}</p><p className="text-xs text-[#c9b99f]/50">{order.customerEmail}</p></td>
              <td className="py-4 pr-4 text-[#c9b99f]/75 capitalize">{order.orderType.replace('_', ' ')}</td>
              <td className="py-4 pr-4 text-[#e9bf83] font-mono-custom">{formatPrice(order.totalAmount)}</td>
              <td className="py-4 pr-4 text-[#c9b99f]/60 text-xs">{formatDateTime(order.createdAt)}</td>
              <td className="py-4 pr-4">
                <select value={order.status} disabled={busyId === order.id} onChange={(event) => updateStatus(order.id, event.target.value)} data-testid={`select-order-status-${order.id}`} className="bg-transparent border-b border-[#e8d9bb]/25 py-1 text-[#f1e4c6] text-xs capitalize">
                  {statuses.map((value) => <option key={value} className="bg-[#241729]" value={value}>{value.replace('_', ' ')}</option>)}
                </select>
              </td>
              <td className="py-4">
                <button onClick={() => remove(order.id)} disabled={busyId === order.id} data-testid={`button-delete-order-${order.id}`} aria-label="Delete order" className="text-[#c9b99f]/60 hover:text-[#df7c5b] disabled:opacity-40"><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>}
  </AdminShell>;
}
