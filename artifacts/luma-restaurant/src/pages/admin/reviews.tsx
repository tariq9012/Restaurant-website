import { useEffect, useState } from 'react';
import { Star, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin-layout';
import { apiRequest, formatDateTime } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type AdminReview = {
  id: number;
  customerName: string;
  menuItemName?: string | null;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
};

export default function AdminReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = () => {
    apiRequest<AdminReview[]>('/admin/reviews').then((data) => { setReviews(data); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(() => { if (user?.role === 'admin') load(); }, [user]);

  const setApproved = async (id: number, isApproved: boolean) => {
    setBusyId(id);
    try {
      await apiRequest(`/reviews/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ isApproved }) });
      setReviews((current) => current.map((review) => (review.id === id ? { ...review, isApproved } : review)));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setBusyId(id);
    try {
      await apiRequest(`/reviews/${id}`, { method: 'DELETE' });
      setReviews((current) => current.filter((review) => review.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return <AdminShell title="Reviews">
    {status === 'loading' && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {status === 'error' && <p className="text-sm text-[#df7c5b]">Could not load reviews.</p>}
    {status === 'ready' && reviews.length === 0 && <p className="text-sm text-[#c9b99f]/60">No reviews yet.</p>}
    {status === 'ready' && reviews.length > 0 && <div className="divide-y hairline">
      {reviews.map((review) => (
        <div key={review.id} data-testid={`row-admin-review-${review.id}`} className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[#f1e4c6]">{review.customerName}</p>
                <span className={`text-[10px] uppercase tracking-[.08em] px-2 py-0.5 border ${review.isApproved ? 'text-[#e9bf83] border-[#e9bf83]/40' : 'text-[#c9b99f]/60 border-[#c9b99f]/30'}`}>{review.isApproved ? 'Approved' : 'Pending'}</span>
              </div>
              {review.menuItemName && <p className="text-xs text-[#c9b99f]/50 mt-1">{review.menuItemName}</p>}
              <div className="flex items-center gap-1 mt-2">{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={12} className={value <= review.rating ? 'text-[#e9bf83] fill-[#e9bf83]' : 'text-[#c9b99f]/30'} />)}</div>
              <p className="text-sm text-[#c9b99f]/75 leading-6 mt-2 max-w-xl">{review.comment}</p>
              <p className="text-[11px] text-[#c9b99f]/45 mt-2">{formatDateTime(review.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              {review.isApproved ? (
                <button onClick={() => setApproved(review.id, false)} disabled={busyId === review.id} data-testid={`button-hide-review-${review.id}`} className="text-[10px] uppercase tracking-[.08em] text-[#c9b99f]/70 disabled:opacity-40">Hide</button>
              ) : (
                <button onClick={() => setApproved(review.id, true)} disabled={busyId === review.id} data-testid={`button-approve-review-${review.id}`} className="text-[10px] uppercase tracking-[.08em] text-[#e9bf83] disabled:opacity-40">Approve</button>
              )}
              <button onClick={() => remove(review.id)} disabled={busyId === review.id} data-testid={`button-delete-review-${review.id}`} aria-label="Delete review" className="text-[#c9b99f]/60 hover:text-[#df7c5b] disabled:opacity-40"><Trash2 size={15} /></button>
            </div>
          </div>
        </div>
      ))}
    </div>}
  </AdminShell>;
}
