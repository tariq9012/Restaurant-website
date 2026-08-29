import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ArrowDown, ArrowRight, Check, Clock3, Instagram, Mail, MapPin, Phone, Plus, Search, X } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AuthProvider } from '@/lib/auth-context';
import { apiRequest, formValues, formatPrice } from '@/lib/api';
import { Field, PageIntro, Shell } from '@/components/layout';
import Reviews from '@/pages/reviews';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminOrders from '@/pages/admin/orders';
import AdminReservations from '@/pages/admin/reservations';
import AdminMessages from '@/pages/admin/messages';
import AdminMenu from '@/pages/admin/menu';
import AdminReviews from '@/pages/admin/reviews';

const queryClient = new QueryClient();

type Dish = { id: number; name: string; description: string; price: number; category: string; image?: string; note?: string };
const dishes: Dish[] = [
  { id: 1, name: 'Coal-roasted cauliflower', description: 'tahini, pomegranate, smoked almond, mint', price: 16, category: 'Small plates', image: '/images/plate-cauliflower.jpg', note: "Luma's signature" },
  { id: 2, name: 'Ember-grilled market fish', description: 'preserved lemon, fennel, green olive, herbs', price: 34, category: 'From the fire', image: '/images/plate-fish.jpg' },
  { id: 3, name: 'Sourdough & cultured butter', description: 'flaky sea salt, charred onion ash', price: 8, category: 'Small plates' },
  { id: 4, name: 'Blistered padrón peppers', description: 'anchovy garum, almond, lemon leaf', price: 13, category: 'Small plates' },
  { id: 5, name: 'Fire-roasted lamb shoulder', description: 'young garlic, smoked yoghurt, grilled flatbread', price: 39, category: 'From the fire', note: 'For two · 45 min' },
  { id: 6, name: 'Crisped potatoes', description: 'fermented chilli, rosemary, aged pecorino', price: 11, category: 'From the fire' },
  { id: 7, name: 'Burnt honey custard', description: 'roasted fig, olive oil, oat crumble', price: 12, category: 'To finish' },
  { id: 8, name: 'Citrus, salt & cream', description: 'blood orange, mascarpone, toasted fennel pollen', price: 11, category: 'To finish' },
];

function Home() {
  return <Shell>
    <main>
      <section className="min-h-[760px] h-[100dvh] max-h-[980px] relative flex items-end px-5 md:px-10 pb-16 md:pb-20">
        <img src="/images/hero-fire.jpg" alt="The glow of Luma's open hearth" className="absolute inset-0 w-full h-full object-cover object-center opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#241729] via-[#241729]/30 to-[#241729]/10" />
        <div className="relative z-10 mx-auto max-w-[1360px] w-full">
          <div className="max-w-[880px] reveal">
            <div className="eyebrow mb-6">A dining room by the fire · Melbourne</div>
            <h1 className="font-display text-[clamp(4.7rem,12vw,10.5rem)] leading-[.76] tracking-[-.045em] text-[#f1e4c6]">Come for<br /><span className="serif-italic text-[#df7c5b]">the glow.</span></h1>
            <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-5">
              <p className="text-[#e8d9bb]/75 text-sm max-w-[280px] leading-6">Seasonal food, live fire, and the unhurried pleasure of a table well shared.</p>
              <Link href="/reservations" data-testid="link-hero-reserve" className="button-primary w-fit">Reserve your table <ArrowRight size={14} /></Link>
            </div>
          </div>
          <div className="mt-12 flex items-center gap-3 text-[#e8d9bb]/60 reveal delay-1"><ArrowDown size={15} /><span className="font-mono-custom text-[10px] uppercase tracking-[.15em]">Take your time</span></div>
        </div>
      </section>
      <div className="border-y hairline overflow-hidden"><div className="whitespace-nowrap py-4 animate-[marquee_24s_linear_infinite] text-[10px] font-mono-custom uppercase tracking-[.2em] text-[#e9bf83]">Live fire <span className="mx-7 text-[#df7c5b]">✦</span> Seasonal produce <span className="mx-7 text-[#df7c5b]">✦</span> Warm hospitality <span className="mx-7 text-[#df7c5b]">✦</span> Melbourne · Naarm <span className="mx-7 text-[#df7c5b]">✦</span> Live fire <span className="mx-7 text-[#df7c5b]">✦</span> Seasonal produce <span className="mx-7 text-[#df7c5b]">✦</span> Warm hospitality</div></div>
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="mx-auto max-w-[1120px] grid md:grid-cols-[.65fr_1.35fr] gap-12 md:gap-28 items-start">
          <div className="reveal"><div className="eyebrow">01 / The room</div><div className="mt-20 hidden md:block w-20 h-px bg-[#df7c5b]" /></div>
          <div className="reveal delay-1"><h2 className="font-display text-5xl md:text-7xl leading-[.9] text-[#f1e4c6] max-w-[720px]">A little <span className="serif-italic text-[#df7c5b]">wildness</span><br />at the heart of the city.</h2><p className="mt-9 max-w-[490px] text-[#c9b99f]/80 leading-7 text-[15px]">Luma is a neighbourhood dining room built around a simple idea: the best meals carry a trace of where they came from. Our open hearth is the centre of everything — lending smoke, heat and a flicker of theatre to produce at its peak.</p><Link href="/about" data-testid="link-home-story" className="mt-8 inline-flex items-center gap-3 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] border-b border-[#e9bf83]/50 pb-2">Read our story <ArrowRight size={14} /></Link></div>
        </div>
      </section>
      <section className="px-5 md:px-10 pb-28 md:pb-40">
        <div className="mx-auto max-w-[1360px] grid md:grid-cols-[1.3fr_.7fr] gap-5 items-end">
          <div className="image-wash h-[500px] md:h-[650px] reveal"><img src="/images/room.jpg" alt="Luma's intimate dining room" className="w-full h-full object-cover" /><div className="absolute bottom-6 left-6 z-10"><span className="eyebrow">The dining room</span><p className="font-display text-3xl text-[#f1e4c6] mt-2">Stay until the<br />candles burn low.</p></div></div>
          <div className="reveal delay-1 pb-3"><div className="border-t hairline pt-4 flex justify-between"><span className="eyebrow">02 / The feeling</span><span className="font-mono-custom text-[10px] text-[#c9b99f]/55">A room for lingering</span></div><p className="font-display text-4xl md:text-5xl leading-[.95] text-[#e9bf83] mt-24 md:mt-48">No dress code.<br />No rush.<br /><span className="text-[#f1e4c6]">No small talk.</span></p></div>
        </div>
      </section>
      <section className="bg-[#d66f51] text-[#241729] px-5 md:px-10 py-24 md:py-32">
        <div className="mx-auto max-w-[1360px] grid md:grid-cols-[.6fr_1.4fr] gap-10">
          <div className="eyebrow text-[#241729]/70 reveal">03 / From the kitchen</div>
          <div className="reveal delay-1"><h2 className="font-display text-6xl md:text-8xl leading-[.8] tracking-[-.035em]">This week,<br /><span className="serif-italic">at the table.</span></h2><div className="mt-16 grid md:grid-cols-2 gap-10 border-t border-[#241729]/25 pt-5"><div><span className="font-mono-custom text-[10px] uppercase tracking-[.12em]">To begin</span><p className="font-display text-3xl mt-4">Charred sourdough</p><p className="text-sm mt-2 text-[#241729]/70">cultured butter · onion ash</p></div><div><span className="font-mono-custom text-[10px] uppercase tracking-[.12em]">From the fire</span><p className="font-display text-3xl mt-4">Market fish</p><p className="text-sm mt-2 text-[#241729]/70">preserved lemon · wild herbs</p></div></div><Link href="/menu" data-testid="link-home-menu" className="mt-12 inline-flex items-center gap-3 border-b border-[#241729]/50 pb-2 font-mono-custom text-[10px] uppercase tracking-[.12em]">See the full menu <ArrowRight size={14} /></Link></div>
        </div>
      </section>
      <section className="px-5 md:px-10 py-28 md:py-40">
        <div className="mx-auto max-w-[980px] text-center reveal"><div className="text-[#df7c5b] text-4xl mb-8">“</div><blockquote className="font-display text-5xl md:text-7xl leading-[.88] text-[#f1e4c6]">The kind of place you<br /><span className="serif-italic text-[#e9bf83]">remember in winter.</span></blockquote><p className="mt-8 font-mono-custom text-[10px] uppercase tracking-[.15em] text-[#c9b99f]/60">— Broadsheet Melbourne</p></div>
      </section>
      <section className="mx-5 md:mx-10 border-t hairline py-12 md:py-16">
        <div className="mx-auto max-w-[1360px] flex flex-col md:flex-row items-start md:items-end justify-between gap-8 reveal"><div><div className="eyebrow">Make an evening of it</div><h2 className="font-display text-5xl md:text-6xl text-[#f1e4c6] mt-5">Your table is waiting.</h2></div><Link href="/reservations" data-testid="link-home-final-reserve" className="button-ghost">Book with us <ArrowRight size={14} /></Link></div>
      </section>
    </main>
  </Shell>;
}

function DishCard({ dish, add }: { dish: Dish; add: (dish: Dish) => void }) {
  return <article className="group border-t hairline pt-4 reveal" data-testid={`card-dish-${dish.id}`}>
    {dish.image && <div className="image-wash mb-5 aspect-[4/3]"><img src={dish.image} alt={dish.name} className="w-full h-full object-cover" /></div>}
    <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-3"><h3 className="font-display text-3xl text-[#f1e4c6]">{dish.name}</h3>{dish.note && <span className="hidden sm:inline-block eyebrow text-[#df7c5b]">{dish.note}</span>}</div><p className="text-sm text-[#c9b99f]/65 mt-2">{dish.description}</p></div><span className="font-mono-custom text-xs text-[#e9bf83] whitespace-nowrap">{formatPrice(dish.price)}</span></div>
    <button onClick={() => add(dish)} data-testid={`button-add-dish-${dish.id}`} className="mt-5 inline-flex items-center gap-2 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] opacity-70 group-hover:opacity-100 transition-opacity"><Plus size={14} /> Add to order</button>
  </article>;
}

function CheckoutForm({ order, onClose, onComplete, onRemove }: { order: Dish[]; onClose: () => void; onComplete: () => void; onRemove: (menuItemId: number) => void }) {
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [placed, setPlaced] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = formValues(event);
    setError('');
    setSending(true);
    const items = [...new Set(order.map((dish) => dish.id))].map((menuItemId) => ({
      menuItemId,
      quantity: order.filter((dish) => dish.id === menuItemId).length,
    }));
    try {
      await apiRequest('/orders', { method: 'POST', body: JSON.stringify({
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        customerPhone: values.customerPhone,
        orderType: values.orderType,
        deliveryAddress: values.deliveryAddress || undefined,
        items,
      }) });
      setPlaced(true);
      onComplete();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'We could not place your order');
    } finally {
      setSending(false);
    }
  };
  if (placed) return <div className="fixed inset-0 z-50 bg-[#241729]/90 flex items-center justify-center p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="w-full max-w-lg bg-[#30203a] border border-[#e8d9bb]/20 p-8 md:p-14 relative flex flex-col items-start">
      <button aria-label="Close" onClick={onClose} data-testid="button-close-order-confirmation" className="absolute right-5 top-5 text-[#f1e4c6]"><X size={18} /></button>
      <span className="w-14 h-14 rounded-full border border-[#df7c5b] flex items-center justify-center text-[#df7c5b]"><Check size={26} /></span>
      <h2 className="font-display text-5xl text-[#f1e4c6] mt-7">Order received.</h2>
      <p className="text-[#c9b99f]/75 text-sm leading-6 max-w-[380px] mt-5">Thank you — your order is confirmed and the kitchen is already on it. We'll have it ready and on its way to you shortly. A confirmation has been sent to your email.</p>
      <button onClick={onClose} data-testid="button-done-order-confirmation" className="button-primary mt-9">Back to the menu</button>
    </div>
  </div>;
  return <div className="fixed inset-0 z-50 bg-[#241729]/90 flex items-center justify-center p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#30203a] border border-[#e8d9bb]/20 relative">
      <div className="sticky top-0 z-10 bg-[#30203a] p-8 md:p-10 pb-0 border-b border-[#e8d9bb]/15">
        <button aria-label="Close order form" onClick={onClose} className="absolute right-5 top-5 text-[#f1e4c6]"><X size={18} /></button>
        <div className="eyebrow">The good part</div>
        <h2 className="font-display text-4xl text-[#f1e4c6] mt-5">Place your order.</h2>
        <p className="mt-3 text-sm text-[#c9b99f]/70">{order.length} {order.length === 1 ? 'dish' : 'dishes'} · {formatPrice(order.reduce((sum, dish) => sum + dish.price, 0))} before tax</p>
        <ul className="mt-6 divide-y divide-[#e8d9bb]/15 border-t border-[#e8d9bb]/15">
          {[...new Set(order.map((dish) => dish.id))].map((menuItemId) => {
            const dish = order.find((item) => item.id === menuItemId)!;
            const quantity = order.filter((item) => item.id === menuItemId).length;
            return <li key={menuItemId} className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm text-[#f1e4c6]">{quantity} × {dish.name}</span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono-custom text-xs text-[#e9bf83] whitespace-nowrap">{formatPrice(dish.price * quantity)}</span>
                <button type="button" aria-label={`Remove one ${dish.name}`} onClick={() => onRemove(menuItemId)} data-testid={`button-remove-order-${menuItemId}`} className="text-[#c9b99f]/60 hover:text-[#df7c5b]"><X size={14} /></button>
              </div>
            </li>;
          })}
        </ul>
      </div>
      <div className="p-8 md:p-10 pt-8">
        <form onSubmit={submit} className="space-y-6">
          <Field label="Your name" name="customerName" placeholder="Your name" />
          <Field label="Email address" name="customerEmail" type="email" placeholder="you@example.com" />
          <Field label="Phone number" name="customerPhone" type="tel" placeholder="+92 ..." />
          <label className="block"><span className="eyebrow block mb-3">How would you like it?</span><select required name="orderType" defaultValue="takeaway" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] text-sm"><option className="bg-[#241729]" value="takeaway">Takeaway</option><option className="bg-[#241729]" value="delivery">Delivery</option><option className="bg-[#241729]" value="dine_in">Dine in</option></select></label>
          <label className="block"><span className="eyebrow block mb-3">Delivery address (if needed)</span><textarea name="deliveryAddress" rows={2} placeholder="Leave blank for takeaway or dine in" className="w-full resize-none bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label>
          {error && <p role="alert" className="text-sm text-[#df7c5b]">{error}</p>}
          <button type="submit" disabled={sending} className="button-primary disabled:opacity-50">{sending ? 'Placing…' : 'Place order'} {!sending && <ArrowRight size={14} />}</button>
        </form>
      </div>
    </div>
  </div>;
}

function Menu() {
  const [category, setCategory] = useState('All dishes');
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<Dish[]>([]);
  const [notice, setNotice] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuDishes, setMenuDishes] = useState<Dish[]>(dishes);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState(['All dishes', 'Small plates', 'From the fire', 'To finish']);
  useEffect(() => {
    Promise.all([
      apiRequest<Array<{ name: string }>>('/categories'),
      apiRequest<Array<{ id: number; name: string; description: string; price: number; category: string; image?: string; isAvailable?: boolean }>>('/menu'),
    ]).then(([categoryData, menuData]) => {
      setCategories(['All dishes', ...categoryData.map((item) => item.name)]);
      setMenuDishes(menuData.map((item) => ({ ...item, price: Number(item.price) })));
    }).catch((error: unknown) => setLoadError(error instanceof Error ? error.message : 'The menu is unavailable right now'))
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => menuDishes.filter((dish) => (category === 'All dishes' || dish.category === category) && `${dish.name} ${dish.description}`.toLowerCase().includes(search.toLowerCase())), [category, search, menuDishes]);
  const add = (dish: Dish) => { setOrder((old) => [...old, dish]); setNotice(`${dish.name} added`); window.setTimeout(() => setNotice(''), 2200); };
  const removeOne = (menuItemId: number) => setOrder((old) => {
    const index = old.findIndex((dish) => dish.id === menuItemId);
    if (index === -1) return old;
    const next = [...old.slice(0, index), ...old.slice(index + 1)];
    if (next.length === 0) setCheckoutOpen(false);
    return next;
  });
  return <Shell><main><PageIntro eyebrow="The menu · changes with the season" title={<>Good things<br /><span className="serif-italic text-[#df7c5b]">take fire.</span></>} intro="A loose, generous menu shaped by what is growing, what is local, and what the embers are asking for. Come hungry; leave room for one more thing." />
    <section className="px-5 md:px-10 pb-24"><div className="mx-auto max-w-[1360px]"><div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-y hairline py-4"><div className="flex gap-5 overflow-x-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} data-testid={`button-filter-${item.toLowerCase().replaceAll(' ', '-')}`} className={`whitespace-nowrap font-mono-custom text-[10px] uppercase tracking-[.1em] ${category === item ? 'text-[#df7c5b]' : 'text-[#c9b99f]/55 hover:text-[#f1e4c6]'}`}>{item}</button>)}</div><label className="flex items-center gap-2 border-b border-[#e8d9bb]/20 pb-2 w-full md:w-56"><Search size={14} className="text-[#c9b99f]/50" /><input value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-menu-search" type="search" placeholder="Search the menu" className="bg-transparent text-sm text-[#f1e4c6] placeholder:text-[#c9b99f]/45 w-full" /></label></div>
      {loading ? <div className="py-24 text-center text-[#c9b99f]/65 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading the menu…</div> : loadError ? <div className="py-24 text-center"><p className="font-display text-4xl text-[#f1e4c6]">The kitchen is taking a moment.</p><p className="mt-4 text-sm text-[#c9b99f]/65">{loadError}</p></div> : filtered.length ? <div className="grid md:grid-cols-2 gap-x-10 gap-y-14 mt-14">{filtered.map((dish) => <DishCard key={dish.id} dish={dish} add={add} />)}</div> : <div className="py-24 text-center"><p className="font-display text-4xl text-[#f1e4c6]">Nothing by that name tonight.</p><button onClick={() => setSearch('')} data-testid="button-clear-menu-search" className="mt-5 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em]">Clear search</button></div>}
    </div></section>
    <section className="px-5 md:px-10 py-20 bg-[#30203a]"><div className="mx-auto max-w-[1360px] flex flex-col md:flex-row gap-10 md:items-center justify-between"><div><div className="eyebrow">A note from the kitchen</div><p className="font-display text-4xl md:text-5xl text-[#f1e4c6] mt-5 max-w-[680px]">“The menu is a conversation with the market. It may change before you arrive.”</p></div><div className="md:text-right"><Clock3 className="text-[#df7c5b] md:ml-auto" size={24} /><p className="mt-4 text-sm text-[#c9b99f]/70 leading-6">Please allow 45 minutes<br />for dishes marked for two.</p></div></div></section>
    {order.length > 0 && createPortal(<div className="fixed z-20 bottom-5 left-5 right-5 md:left-auto md:right-8 md:w-[360px] bg-[#e9bf83] text-[#241729] p-4 shadow-2xl flex items-center justify-between"><div><span className="font-mono-custom text-[10px] uppercase tracking-[.1em]">{order.length} {order.length === 1 ? 'dish' : 'dishes'} in your order</span><p className="font-display text-xl mt-1">{formatPrice(order.reduce((sum, dish) => sum + dish.price, 0))}</p></div><div className="flex items-center gap-4"><button onClick={() => setOrder([])} data-testid="button-clear-order" className="font-mono-custom text-[10px] uppercase border-b border-[#241729]/50 pb-1">Clear</button><button onClick={() => setCheckoutOpen(true)} data-testid="button-checkout-order" className="font-mono-custom text-[10px] uppercase border-b border-[#241729]/50 pb-1">Order now</button></div></div>, document.body)}
    {checkoutOpen && createPortal(<CheckoutForm order={order} onClose={() => setCheckoutOpen(false)} onRemove={removeOne} onComplete={() => setOrder([])} />, document.body)}
    {notice && createPortal(<div role="status" data-testid="status-dish-added" className="fixed z-30 top-24 right-5 bg-[#df7c5b] text-[#241729] px-4 py-3 font-mono-custom text-[10px] uppercase tracking-[.08em]">{notice}</div>, document.body)}
  </main></Shell>;
}

function About() {
  return <Shell><main><PageIntro eyebrow="Our story · Luma dining room" title={<>Keep the<br /><span className="serif-italic text-[#e9bf83]">flame.</span></>} intro="Luma started with a second-hand grill, a borrowed room and a belief that dinner should feel like an exhale. The room has grown. The idea has not." />
    <section className="px-5 md:px-10 pb-28"><div className="mx-auto max-w-[1360px] grid md:grid-cols-[1fr_1fr] gap-5"><div className="image-wash aspect-[4/5] max-h-[700px] reveal"><img src="/images/ingredient.jpg" alt="Seasonal ingredients on the kitchen counter" className="w-full h-full object-cover" /></div><div className="bg-[#d66f51] text-[#241729] p-8 md:p-14 flex flex-col justify-between min-h-[500px] reveal delay-1"><div className="eyebrow text-[#241729]/70">A room made by hand</div><p className="font-display text-5xl md:text-6xl leading-[.86] mt-20">The fire is not a technique.<br /><span className="serif-italic">It is our pace.</span></p><p className="text-sm leading-6 max-w-[370px] mt-14 text-[#241729]/75">We cook over red gum and ironbark, work with growers we know, and let the evening unfold at its own speed. A little smoke in the air is a good thing.</p></div></div></section>
    <section className="px-5 md:px-10 py-24 border-y hairline"><div className="mx-auto max-w-[1120px] grid md:grid-cols-[.5fr_1.5fr] gap-12"><div className="eyebrow reveal">Our way of doing things</div><div className="reveal delay-1"><div className="grid sm:grid-cols-2 gap-x-10 gap-y-14"><div><span className="font-mono-custom text-[#df7c5b] text-sm">01</span><h3 className="font-display text-3xl text-[#f1e4c6] mt-3">Buy less. Buy better.</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-3">We build menus around a handful of beautiful ingredients, not a list of techniques.</p></div><div><span className="font-mono-custom text-[#df7c5b] text-sm">02</span><h3 className="font-display text-3xl text-[#f1e4c6] mt-3">Let the seasons speak.</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-3">Our suppliers tell us what is ready. We listen, then change the menu.</p></div><div><span className="font-mono-custom text-[#df7c5b] text-sm">03</span><h3 className="font-display text-3xl text-[#f1e4c6] mt-3">Keep it warm.</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-3">Hospitality is the main course. Come as you are; stay as long as you like.</p></div><div><span className="font-mono-custom text-[#df7c5b] text-sm">04</span><h3 className="font-display text-3xl text-[#f1e4c6] mt-3">Waste nothing.</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-3">Ash becomes salt, peels become pickles, and yesterday's embers warm tomorrow's stock.</p></div></div></div></div></section>
    <section className="px-5 md:px-10 py-28"><div className="mx-auto max-w-[1360px] flex flex-col md:flex-row md:items-end justify-between gap-8 reveal"><div><div className="eyebrow">Come behind the curtain</div><h2 className="font-display text-5xl md:text-7xl text-[#f1e4c6] mt-5">Meet us at<br /><span className="serif-italic text-[#df7c5b]">the table.</span></h2></div><Link href="/contact" data-testid="link-about-contact" className="button-ghost">Get in touch <ArrowRight size={14} /></Link></div></section>
  </main></Shell>;
}

function Reservations() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSending(true);
    const values = formValues(event);
    try {
      await apiRequest('/reservations', { method: 'POST', body: JSON.stringify({
        customerName: values.name,
        email: values.email,
        phone: values.phone || 'Not provided',
        reservationDate: values.date,
        reservationTime: values.time,
        guests: Number(values.guests),
        specialRequest: [values.occasion, values.notes].filter(Boolean).join(' · ') || undefined,
      }) });
      setSubmitted(true);
      form.reset();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : 'We could not send your request';
      setError(message);
      window.alert(message);
    } finally {
      setSending(false);
    }
  };
  return <Shell><main><PageIntro eyebrow="Reservations · your table awaits" title={<>Make a night<br /><span className="serif-italic text-[#df7c5b]">of it.</span></>} intro="Choose a date, bring someone you like, and leave the rest to us. We hold tables for 15 minutes; after that, the fire keeps burning." />
    <section className="px-5 md:px-10 pb-24"><div className="mx-auto max-w-[1100px] grid md:grid-cols-[1.3fr_.7fr] gap-16"><div className="reveal">{submitted ? <div className="border border-[#e9bf83]/40 p-8 md:p-14 min-h-[480px] flex flex-col justify-center"><Check className="text-[#df7c5b]" size={28} /><h2 className="font-display text-5xl text-[#f1e4c6] mt-7">You're on the list.</h2><p className="text-[#c9b99f]/75 text-sm leading-6 max-w-[380px] mt-5">We've received your request and will be in touch shortly to confirm the details. Keep an eye on your inbox.</p><button onClick={() => setSubmitted(false)} data-testid="button-new-reservation" className="mt-9 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] w-fit border-b border-[#e9bf83]/50 pb-2">Make another request</button></div> : <form onSubmit={submit} className="border-t hairline pt-7"><div className="grid sm:grid-cols-2 gap-x-8 gap-y-9"><Field label="Your name" name="name" placeholder="How shall we call you?" /><Field label="Email address" name="email" type="email" placeholder="you@example.com" /><Field label="Preferred date" name="date" type="date" /><label className="block"><span className="eyebrow block mb-3">Guests</span><select name="guests" data-testid="select-guests" defaultValue="2" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] text-sm"><option className="bg-[#241729]" value="2">2 people</option><option className="bg-[#241729]" value="3">3 people</option><option className="bg-[#241729]" value="4">4 people</option><option className="bg-[#241729]" value="5">5 people</option><option className="bg-[#241729]" value="6">6+ people</option></select></label><label className="block"><span className="eyebrow block mb-3">Preferred time</span><select name="time" data-testid="select-time" defaultValue="7:00 pm" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] text-sm"><option className="bg-[#241729]">5:30 pm</option><option className="bg-[#241729]">6:30 pm</option><option className="bg-[#241729]">7:00 pm</option><option className="bg-[#241729]">8:00 pm</option><option className="bg-[#241729]">8:30 pm</option></select></label><Field label="Occasion (optional)" name="occasion" placeholder="Birthday, catch-up, just because" required={false} /></div><label className="block mt-9"><span className="eyebrow block mb-3">Anything we should know?</span><textarea name="notes" data-testid="input-reservation-notes" rows={3} placeholder="Dietary requirements, accessibility, high chair..." className="w-full resize-none bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label><button type="submit" data-testid="button-submit-reservation" className="button-primary mt-10">Request a table <ArrowRight size={14} /></button><p className="text-[11px] text-[#c9b99f]/50 mt-4">This is a request, not a confirmation. We will email you within 24 hours.</p></form>}</div>
      <aside className="reveal delay-1 md:pt-7"><div className="border-t hairline pt-5"><div className="eyebrow">Good to know</div><div className="mt-7 space-y-7"><div><h3 className="font-display text-2xl text-[#f1e4c6]">The details</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-2">Our dining room is intimate, so we recommend booking ahead. Walk-ins are always welcome at the bar.</p></div><div><h3 className="font-display text-2xl text-[#f1e4c6]">For groups</h3><p className="text-sm text-[#c9b99f]/70 leading-6 mt-2">For parties of 7 or more, send us a note and we'll make something special.</p></div></div></div></aside>
    </div></section>
  </main></Shell>;
}

function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSending(true);
    const values = formValues(event);
    try {
      await apiRequest('/contact', { method: 'POST', body: JSON.stringify({
        name: values['contact-name'],
        email: values['contact-email'],
        subject: values.subject,
        message: values.message,
      }) });
      setSent(true);
      form.reset();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : 'We could not send your message';
      setError(message);
      window.alert(message);
    } finally {
      setSending(false);
    }
  };
  return <Shell><main><PageIntro eyebrow="Find us · say hello" title={<>Come as<br /><span className="serif-italic text-[#e9bf83]">you are.</span></>} intro="We're tucked into the west end of Flinders Lane, where the city gets quiet. Follow the warm light and the smell of something good." />
    <section className="px-5 md:px-10 pb-28"><div className="mx-auto max-w-[1360px] grid md:grid-cols-[.8fr_1.2fr] gap-16"><div className="reveal"><div className="border-t hairline pt-5"><div className="eyebrow">The address</div><p className="font-display text-4xl text-[#f1e4c6] mt-6">18 Flinders Lane<br /><span className="serif-italic text-[#df7c5b]">Melbourne · Naarm</span></p><div className="mt-9 flex items-start gap-3 text-sm text-[#c9b99f]/70"><MapPin size={16} className="text-[#e9bf83] mt-1" /><span>Between Russell & Swanston<br />VIC 3000, Australia</span></div><a href="https://maps.google.com/?q=18+Flinders+Lane+Melbourne" target="_blank" rel="noreferrer" data-testid="link-directions" className="mt-8 inline-flex items-center gap-3 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] border-b border-[#e9bf83]/50 pb-2">Get directions <ArrowRight size={14} /></a></div><div className="border-t hairline pt-5 mt-16"><div className="eyebrow">Opening hours</div><div className="flex justify-between max-w-[320px] mt-6 text-sm text-[#e8d9bb]/75"><span>Wednesday–Sunday</span><span>5pm–late</span></div><div className="flex justify-between max-w-[320px] mt-3 text-sm text-[#c9b99f]/55"><span>Monday–Tuesday</span><span>Resting</span></div></div><div className="mt-14 flex gap-6"><a href="tel:+61370123456" data-testid="link-contact-phone" className="text-[#e9bf83] hover:text-[#f1e4c6]"><Phone size={18} /></a><a href="mailto:hello@lumadining.com" data-testid="link-contact-email" className="text-[#e9bf83] hover:text-[#f1e4c6]"><Mail size={18} /></a><a href="https://instagram.com" data-testid="link-contact-instagram" className="text-[#e9bf83] hover:text-[#f1e4c6]"><Instagram size={18} /></a></div></div><div className="reveal delay-1"><div className="eyebrow">Send a note</div>{sent ? <div className="border border-[#e9bf83]/40 p-8 md:p-12 mt-7 min-h-[420px] flex flex-col justify-center"><Check className="text-[#df7c5b]" size={28} /><h2 className="font-display text-5xl text-[#f1e4c6] mt-7">Message received.</h2><p className="text-[#c9b99f]/75 text-sm leading-6 mt-4">Thanks for reaching out. We'll get back to you soon.</p><button onClick={() => setSent(false)} data-testid="button-new-message" className="mt-8 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] w-fit border-b border-[#e9bf83]/50 pb-2">Send another note</button></div> : <form onSubmit={submit} className="mt-7 space-y-8"><div className="grid sm:grid-cols-2 gap-8"><Field label="Your name" name="contact-name" placeholder="Your name" /><Field label="Email address" name="contact-email" type="email" placeholder="you@example.com" /></div><label className="block"><span className="eyebrow block mb-3">What's on your mind?</span><select required name="subject" data-testid="select-contact-subject" defaultValue="" className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] text-sm"><option className="bg-[#241729]" value="" disabled>Choose a subject</option><option className="bg-[#241729]">A private dining enquiry</option><option className="bg-[#241729]">Working with us</option><option className="bg-[#241729]">Just saying hello</option></select></label><label className="block"><span className="eyebrow block mb-3">Your message</span><textarea required name="message" data-testid="input-contact-message" rows={6} placeholder="Tell us a little more..." className="w-full resize-none bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label><button type="submit" data-testid="button-submit-contact" className="button-primary">Send message <ArrowRight size={14} /></button></form>}</div></div></section>
    <section className="px-5 md:px-10"><div className="mx-auto max-w-[1360px] bg-[#d66f51] text-[#241729] p-8 md:p-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 reveal"><div><div className="eyebrow text-[#241729]/70">Prefer a proper hello?</div><h2 className="font-display text-5xl md:text-6xl mt-5">Book the table.</h2></div><Link href="/reservations" data-testid="link-contact-reserve" className="button-ghost border-[#241729]/50 text-[#241729] hover:border-[#241729]">Make a reservation <ArrowRight size={14} /></Link></div></section>
  </main></Shell>;
}

function Router() {
  return <ErrorBoundary><Switch>
    <Route path="/" component={Home} />
    <Route path="/menu" component={Menu} />
    <Route path="/about" component={About} />
    <Route path="/reservations" component={Reservations} />
    <Route path="/reviews" component={Reviews} />
    <Route path="/contact" component={Contact} />
    <Route path="/admin" component={AdminDashboard} />
    <Route path="/admin/orders" component={AdminOrders} />
    <Route path="/admin/reservations" component={AdminReservations} />
    <Route path="/admin/messages" component={AdminMessages} />
    <Route path="/admin/menu" component={AdminMenu} />
    <Route path="/admin/reviews" component={AdminReviews} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AuthProvider><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></AuthProvider></QueryClientProvider>;
}

export default App;
