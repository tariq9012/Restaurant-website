import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, LayoutDashboard, MessageSquare, ShoppingBag, Star, UtensilsCrossed, CalendarCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/reservations', label: 'Reservations', icon: CalendarCheck },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return <div className="min-h-dvh bg-[#241729] flex items-center justify-center">
      <p className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#c9b99f]/60">Loading…</p>
    </div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="min-h-dvh bg-[#241729] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="eyebrow">Admin access required</div>
        <h1 className="font-display text-4xl text-[#f1e4c6] mt-5">This area is for staff only.</h1>
        <p className="mt-4 text-sm text-[#c9b99f]/70 leading-6">Sign in with an admin account from the site's header, then come back to this page.</p>
        <Link href="/" data-testid="link-admin-back-home" className="mt-8 inline-flex items-center gap-3 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] border-b border-[#e9bf83]/50 pb-2">Back to the site <ArrowRight size={14} /></Link>
      </div>
    </div>;
  }

  return <div className="min-h-dvh bg-[#241729] text-[#f1e4c6]">
    <div className="flex flex-col md:flex-row">
      <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r hairline px-5 md:px-6 py-6 md:min-h-dvh">
        <Link href="/" data-testid="link-admin-logo" className="text-[#f1e4c6] no-underline flex items-center gap-3">
          <span className="w-8 h-8 border border-[#df7c5b] rounded-full flex items-center justify-center text-[#df7c5b] font-display text-xl leading-none">L</span>
          <span className="font-mono-custom text-xs tracking-[.2em] uppercase">Luma admin</span>
        </Link>
        <nav className="mt-10 flex md:flex-col gap-1 overflow-x-auto">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return <Link key={item.href} href={item.href} data-testid={`link-admin-nav-${item.label.toLowerCase()}`} className={`flex items-center gap-3 px-3 py-2.5 text-[11px] uppercase tracking-[.1em] whitespace-nowrap transition-colors ${active ? 'bg-[#30203a] text-[#e9bf83]' : 'text-[#e8d9bb]/70 hover:text-[#f1e4c6]'}`}>
              <Icon size={15} /> {item.label}
            </Link>;
          })}
        </nav>
        <div className="mt-10 pt-5 border-t hairline hidden md:block">
          <p className="text-xs text-[#c9b99f]/60">Signed in as</p>
          <p className="text-sm text-[#f1e4c6] mt-1">{user.name}</p>
          <button onClick={logout} data-testid="button-admin-sign-out" className="mt-4 font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#e9bf83]">Sign out</button>
        </div>
      </aside>
      <main className="flex-1 px-5 md:px-10 py-8 md:py-12 max-w-[1400px]">
        <h1 className="font-display text-4xl md:text-5xl text-[#f1e4c6]">{title}</h1>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  </div>;
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return <div className="border hairline p-5 md:p-6">
    <p className="eyebrow">{label}</p>
    <p className="font-display text-4xl text-[#f1e4c6] mt-3">{value}</p>
  </div>;
}
