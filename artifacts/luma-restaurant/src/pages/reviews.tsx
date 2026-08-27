import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Shell, PageIntro } from '@/components/layout';
import { apiRequest, formValues, formatDate } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Review = {
  id: number;
  customerName: string;
  menuItemName?: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

type MenuItemOption = { id: number; name: string };

function Stars({ rating }: { rating: number }) {
  return <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((value) => (
      <Star key={value} size={14} className={value <= rating ? 'text-[#e9bf83] fill-[#e9bf83]' : 'text-[#c9b99f]/30'} />
    ))}
  </div>;
}

function ReviewForm({ menuItems, onSubmitted }: { menuItems: MenuItemOption[]; onSubmitted: () => void }) {
  const [rating, setRating] = useState(5);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSending(true);
    const values = formValues(event);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          customerName: values.customerName,
          menuItemId: values.menuItemId ? Number(values.menuItemId) : undefined,
          rating,
          comment: values.comment,
        }),
      });
      form.reset();
      setRating(5);
      onSubmitted();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'We could not submit your review');
    } finally {
      setSending(false);
    }
  };

  return <form onSubmit={submit} className="border-t hairline pt-7 space-y-6">
    <label className="block"><span className="eyebrow block mb-3">Your name</span><input required name="customerName" placeholder="Your name" data-testid="input-review-name" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label>
    {menuItems.length > 0 && <label className="block"><span className="eyebrow block mb-3">Which dish? (optional)</span><select name="menuItemId" data-testid="select-review-dish" defaultValue="" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] text-sm"><option className="bg-[#241729]" value="">General feedback</option>{menuItems.map((item) => <option key={item.id} className="bg-[#241729]" value={item.id}>{item.name}</option>)}</select></label>}
    <div>
      <span className="eyebrow block mb-3">Your rating</span>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} data-testid={`button-rating-${value}`} aria-label={`${value} stars`} className="p-1">
            <Star size={22} className={value <= rating ? 'text-[#e9bf83] fill-[#e9bf83]' : 'text-[#c9b99f]/30'} />
          </button>
        ))}
      </div>
    </div>
    <label className="block"><span className="eyebrow block mb-3">Your review</span><textarea required name="comment" rows={4} data-testid="input-review-comment" placeholder="Tell us what you thought..." className="w-full resize-none bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label>
    {error && <p role="alert" className="text-sm text-[#df7c5b]">{error}</p>}
    <button type="submit" disabled={sending} data-testid="button-submit-review" className="button-primary disabled:opacity-50">{sending ? 'Sending…' : 'Submit review'} {!sending && <ArrowRight size={14} />}</button>
    <p className="text-[11px] text-[#c9b99f]/50">Reviews are checked before they appear publicly.</p>
  </form>;
}

export default function Reviews() {
  const { user, loading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [notice, setNotice] = useState('');

  const load = () => {
    setStatus('loading');
    Promise.all([
      apiRequest<Review[]>('/reviews'),
      apiRequest<MenuItemOption[]>('/menu').catch(() => []),
    ]).then(([reviewData, menuData]) => {
      setReviews(reviewData);
      setMenuItems(menuData.map((item) => ({ id: item.id, name: item.name })));
      setStatus('ready');
    }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const average = useMemo(() => {
    if (!reviews.length) return 0;
    return Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;
  }, [reviews]);

  return <Shell><main>
    <PageIntro eyebrow="Reviews · in their words" title={<>What the<br /><span className="serif-italic text-[#df7c5b]">table says.</span></>} intro="Notes from guests who've pulled up a chair. Had a dish or an evening worth mentioning? We'd love to hear about it." />
    <section className="px-5 md:px-10 pb-24">
      <div className="mx-auto max-w-[1360px] grid md:grid-cols-[1.3fr_.7fr] gap-16">
        <div>
          {reviews.length > 0 && <div className="flex items-center gap-4 border-b hairline pb-8 mb-2">
            <span className="font-display text-5xl text-[#f1e4c6]">{average}</span>
            <div><Stars rating={Math.round(average)} /><p className="text-xs text-[#c9b99f]/60 mt-1">from {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p></div>
          </div>}
          {status === 'loading' && <div className="py-20 text-center text-[#c9b99f]/65 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading reviews…</div>}
          {status === 'error' && <div className="py-20 text-center"><p className="font-display text-3xl text-[#f1e4c6]">Reviews are unavailable right now.</p></div>}
          {status === 'ready' && reviews.length === 0 && <div className="py-20 text-center"><p className="font-display text-3xl text-[#f1e4c6]">No reviews yet — be the first.</p></div>}
          {status === 'ready' && reviews.length > 0 && <div className="divide-y hairline">
            {reviews.map((review) => (
              <article key={review.id} data-testid={`card-review-${review.id}`} className="py-7 first:pt-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl text-[#f1e4c6]">{review.customerName}</p>
                    {review.menuItemName && <p className="text-xs text-[#e9bf83] font-mono-custom uppercase tracking-[.1em] mt-1">{review.menuItemName}</p>}
                  </div>
                  <Stars rating={review.rating} />
                </div>
                <p className="mt-4 text-sm text-[#c9b99f]/75 leading-6">{review.comment}</p>
                <p className="mt-3 text-[11px] text-[#c9b99f]/45 font-mono-custom uppercase tracking-[.08em]">{formatDate(review.createdAt)}</p>
              </article>
            ))}
          </div>}
        </div>
        <aside>
          <div className="eyebrow mb-2">Leave a review</div>
          {loading ? null : user ? (
            <ReviewForm menuItems={menuItems} onSubmitted={() => { setNotice('Thanks — your review is awaiting approval.'); load(); window.setTimeout(() => setNotice(''), 4000); }} />
          ) : (
            <div className="border-t hairline pt-7">
              <p className="text-sm text-[#c9b99f]/70 leading-6">Sign in from the menu above to leave a review — it only takes a moment.</p>
            </div>
          )}
          {notice && <p role="status" data-testid="status-review-submitted" className="mt-5 text-sm text-[#e9bf83]">{notice}</p>}
        </aside>
      </div>
    </section>
  </main></Shell>;
}
