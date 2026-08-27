import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { AdminShell, StatCard } from '@/components/admin-layout';
import { apiRequest, formatDateTime, formatPrice } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type DashboardData = {
  stats: { users: number; menuItems: number; orders: number; reservations: number; revenue: number };
  recentOrders: { id: number; customerName: string; totalAmount: number; status: string; createdAt: string }[];
  recentReservations: { id: number; customerName: string; reservationDate: string; reservationTime: string; guests: number; status: string }[];
  recentMessages: { id: number; name: string; subject: string; status: string; createdAt: string }[];
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    apiRequest<DashboardData>('/admin/dashboard').then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load the dashboard'));
  }, [user]);

  return <AdminShell title="Dashboard">
    {error && <p className="text-sm text-[#df7c5b]">{error}</p>}
    {!data && !error && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {data && <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Revenue" value={formatPrice(data.stats.revenue)} />
        <StatCard label="Orders" value={data.stats.orders} />
        <StatCard label="Reservations" value={data.stats.reservations} />
        <StatCard label="Menu items" value={data.stats.menuItems} />
        <StatCard label="Accounts" value={data.stats.users} />
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div>
          <div className="flex items-center justify-between"><h2 className="eyebrow">Recent orders</h2><Link href="/admin/orders" data-testid="link-dashboard-orders" className="text-[10px] font-mono-custom uppercase tracking-[.1em] text-[#e9bf83]">View all</Link></div>
          <div className="mt-5 space-y-4">
            {data.recentOrders.length === 0 && <p className="text-sm text-[#c9b99f]/50">No orders yet.</p>}
            {data.recentOrders.map((order) => (
              <div key={order.id} data-testid={`row-dashboard-order-${order.id}`} className="border-t hairline pt-3">
                <div className="flex items-center justify-between"><span className="text-sm text-[#f1e4c6]">{order.customerName}</span><span className="text-xs text-[#e9bf83] font-mono-custom">{formatPrice(order.totalAmount)}</span></div>
                <div className="flex items-center justify-between mt-1"><span className="text-[11px] text-[#c9b99f]/50">{formatDateTime(order.createdAt)}</span><span className="text-[10px] uppercase tracking-[.08em] text-[#c9b99f]/70">{order.status.replace('_', ' ')}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"><h2 className="eyebrow">Recent reservations</h2><Link href="/admin/reservations" data-testid="link-dashboard-reservations" className="text-[10px] font-mono-custom uppercase tracking-[.1em] text-[#e9bf83]">View all</Link></div>
          <div className="mt-5 space-y-4">
            {data.recentReservations.length === 0 && <p className="text-sm text-[#c9b99f]/50">No reservations yet.</p>}
            {data.recentReservations.map((reservation) => (
              <div key={reservation.id} data-testid={`row-dashboard-reservation-${reservation.id}`} className="border-t hairline pt-3">
                <div className="flex items-center justify-between"><span className="text-sm text-[#f1e4c6]">{reservation.customerName}</span><span className="text-xs text-[#e9bf83] font-mono-custom">{reservation.guests} guests</span></div>
                <div className="flex items-center justify-between mt-1"><span className="text-[11px] text-[#c9b99f]/50">{new Date(reservation.reservationDate).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })} · {reservation.reservationTime}</span><span className="text-[10px] uppercase tracking-[.08em] text-[#c9b99f]/70">{reservation.status}</span></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between"><h2 className="eyebrow">Recent messages</h2><Link href="/admin/messages" data-testid="link-dashboard-messages" className="text-[10px] font-mono-custom uppercase tracking-[.1em] text-[#e9bf83]">View all</Link></div>
          <div className="mt-5 space-y-4">
            {data.recentMessages.length === 0 && <p className="text-sm text-[#c9b99f]/50">No messages yet.</p>}
            {data.recentMessages.map((message) => (
              <div key={message.id} data-testid={`row-dashboard-message-${message.id}`} className="border-t hairline pt-3">
                <div className="flex items-center justify-between"><span className="text-sm text-[#f1e4c6]">{message.name}</span><span className="text-[10px] uppercase tracking-[.08em] text-[#c9b99f]/70">{message.status}</span></div>
                <p className="text-[11px] text-[#c9b99f]/50 mt-1">{message.subject}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>}
  </AdminShell>;
}
