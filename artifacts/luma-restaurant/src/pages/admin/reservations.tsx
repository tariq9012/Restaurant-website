import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin-layout';
import { apiRequest, formatDate } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Reservation = {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  specialRequest?: string | null;
  status: string;
};

const statuses = ['pending', 'confirmed', 'cancelled', 'completed'];

export default function AdminReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    apiRequest<Reservation[]>('/reservations').then((data) => { setReservations(data); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const updateStatus = async (id: number, nextStatus: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify({ status: nextStatus }) });
      setReservations((current) => current.map((reservation) => (reservation.id === id ? { ...reservation, status: nextStatus } : reservation)));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this reservation?')) return;
    setBusyId(id);
    try {
      await apiRequest(`/reservations/${id}`, { method: 'DELETE' });
      setReservations((current) => current.filter((reservation) => reservation.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return <AdminShell title="Reservations">
    {status === 'loading' && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {status === 'error' && <p className="text-sm text-[#df7c5b]">Could not load reservations.</p>}
    {status === 'ready' && reservations.length === 0 && <p className="text-sm text-[#c9b99f]/60">No reservations yet.</p>}
    {status === 'ready' && reservations.length > 0 && <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left eyebrow border-b hairline"><th className="pb-3 pr-4 font-normal">Guest</th><th className="pb-3 pr-4 font-normal">Date &amp; time</th><th className="pb-3 pr-4 font-normal">Party</th><th className="pb-3 pr-4 font-normal">Notes</th><th className="pb-3 pr-4 font-normal">Status</th><th className="pb-3 font-normal"></th></tr></thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id} data-testid={`row-reservation-${reservation.id}`} className="border-b hairline align-top">
              <td className="py-4 pr-4"><p className="text-[#f1e4c6]">{reservation.customerName}</p><p className="text-xs text-[#c9b99f]/50">{reservation.email}</p><p className="text-xs text-[#c9b99f]/50">{reservation.phone}</p></td>
              <td className="py-4 pr-4 text-[#c9b99f]/75">{formatDate(reservation.reservationDate)}<br /><span className="text-xs text-[#c9b99f]/50">{reservation.reservationTime}</span></td>
              <td className="py-4 pr-4 text-[#c9b99f]/75">{reservation.guests}</td>
              <td className="py-4 pr-4 text-[#c9b99f]/60 text-xs max-w-[220px]">{reservation.specialRequest || '—'}</td>
              <td className="py-4 pr-4">
                <select value={reservation.status} disabled={busyId === reservation.id} onChange={(event) => updateStatus(reservation.id, event.target.value)} data-testid={`select-reservation-status-${reservation.id}`} className="bg-transparent border-b border-[#e8d9bb]/25 py-1 text-[#f1e4c6] text-xs capitalize">
                  {statuses.map((value) => <option key={value} className="bg-[#241729]" value={value}>{value}</option>)}
                </select>
              </td>
              <td className="py-4">
                <button onClick={() => remove(reservation.id)} disabled={busyId === reservation.id} data-testid={`button-delete-reservation-${reservation.id}`} aria-label="Delete reservation" className="text-[#c9b99f]/60 hover:text-[#df7c5b] disabled:opacity-40"><Trash2 size={15} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>}
  </AdminShell>;
}
