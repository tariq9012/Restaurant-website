import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowRight, Instagram, Menu as MenuIcon, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { apiRequest, formValues } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/menu', label: 'The menu' },
  { href: '/about', label: 'Our story' },
  { href: '/reservations', label: 'Reservations' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/contact', label: 'Find us' },
];

export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    const observeAll = () => document.querySelectorAll('.reveal:not(.visible)').forEach((item) => observer.observe(item));
    observeAll();
    const mutationObserver = new MutationObserver(() => observeAll());
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutationObserver.disconnect(); };
  }, []);
}

export function Field({ label, name, type = 'text', placeholder, required = true, defaultValue }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean; defaultValue?: string }) {
  return <label className="block"><span className="eyebrow block mb-3">{label}</span><input required={required} name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} data-testid={`input-${name}`} className="w-full bg-transparent border-b border-[#e8d9bb]/25 py-3 text-[#f1e4c6] placeholder:text-[#c9b99f]/40 text-sm" /></label>;
}

export function PageIntro({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro: string }) {
  return <section className="px-5 md:px-10 pt-40 pb-20 md:pt-48 md:pb-28"><div className="mx-auto max-w-[1360px]"><div className="eyebrow reveal">{eyebrow}</div><h1 className="font-display text-[clamp(4rem,10vw,9rem)] leading-[.8] tracking-[-.04em] text-[#f1e4c6] mt-8 max-w-[900px] reveal delay-1">{title}</h1><p className="max-w-[510px] mt-9 text-[#c9b99f]/75 text-[15px] leading-7 reveal delay-2">{intro}</p></div></section>;
}

function AuthControls() {
  const { user, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSending(true);
    const values = formValues(event);
    try {
      const result = await apiRequest<{ user: { id: number; name: string; email: string; role: string }; token: string }>(registering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(registering ? { name: values.name, email: values.email, password: values.password } : { email: values.email, password: values.password }),
      });
      login(result.user, result.token);
      setOpen(false);
      form.reset();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'We could not sign you in');
    } finally {
      setSending(false);
    }
  };

  if (user) return <div className="flex items-center gap-4">
    {user.role === 'admin' && <Link href="/admin" data-testid="link-admin" className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#e8d9bb]/70 hover:text-[#f1e4c6]">Admin</Link>}
    <button onClick={logout} data-testid="button-sign-out" className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#e9bf83]">Hi, {user.name.split(' ')[0]} · Sign out</button>
  </div>;
  return <>
    <button onClick={() => { setOpen(true); setError(''); }} data-testid="button-open-sign-in" className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#e8d9bb]/70 hover:text-[#f1e4c6]">Sign in</button>
    {open && <div className="fixed inset-0 z-50 bg-[#241729]/90 flex items-center justify-center p-5" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <div className="w-full max-w-md bg-[#30203a] border border-[#e8d9bb]/20 p-8 md:p-10 relative">
        <button aria-label="Close sign in" onClick={() => setOpen(false)} className="absolute right-5 top-5 text-[#c9b99f]"><X size={18} /></button>
        <div className="eyebrow">{registering ? 'Join the table' : 'Welcome back'}</div>
        <h2 className="font-display text-4xl text-[#f1e4c6] mt-5">{registering ? 'Make an account.' : 'Sign in to Luma.'}</h2>
        <form onSubmit={submit} className="mt-8 space-y-6">
          {registering && <Field label="Your name" name="name" placeholder="Your name" />}
          <Field label="Email address" name="email" type="email" placeholder="you@example.com" />
          <Field label="Password" name="password" type="password" placeholder="At least 8 characters" />
          {error && <p role="alert" className="text-sm text-[#df7c5b]">{error}</p>}
          <button type="submit" disabled={sending} className="button-primary disabled:opacity-50">{sending ? 'Working…' : registering ? 'Create account' : 'Sign in'} {!sending && <ArrowRight size={14} />}</button>
        </form>
        <button onClick={() => { setRegistering((value) => !value); setError(''); }} className="mt-7 text-[#e9bf83] font-mono-custom text-[10px] uppercase tracking-[.12em] border-b border-[#e9bf83]/50 pb-1">{registering ? 'Already have an account? Sign in' : 'New to Luma? Create an account'}</button>
      </div>
    </div>}
  </>;
}

export function Header() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location]);
  return (
    <header className="absolute z-30 left-0 right-0 top-0 px-5 md:px-10 py-6">
      <div className="mx-auto max-w-[1360px] flex items-center justify-between">
        <Link href="/" data-testid="link-logo" className="text-[#f1e4c6] no-underline flex items-center gap-3">
          <span className="w-8 h-8 border border-[#df7c5b] rounded-full flex items-center justify-center text-[#df7c5b] font-display text-xl leading-none">L</span>
          <span className="font-mono-custom text-xs tracking-[.2em] uppercase">Luma</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={`text-[11px] uppercase tracking-[.12em] transition-colors ${location === item.href ? 'text-[#e9bf83]' : 'text-[#e8d9bb]/75 hover:text-[#f1e4c6]'}`}>{item.label}</Link>)}
        </nav>
        <div className="hidden md:flex items-center gap-5">
          <AuthControls />
          <span className="font-mono-custom text-[10px] uppercase tracking-[.12em] text-[#e8d9bb]/60">Wed–Sun · 5pm late</span>
          <Link href="/reservations" data-testid="link-header-reserve" className="button-primary">Book a table <ArrowRight size={14} /></Link>
        </div>
        <button aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setOpen(true)} className="md:hidden text-[#f1e4c6] p-2"><MenuIcon size={23} /></button>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-[#241729] px-6 py-7 flex flex-col">
        <div className="flex items-center justify-between">
          <Link href="/" data-testid="link-mobile-logo" className="text-[#f1e4c6] font-mono-custom text-xs tracking-[.2em] uppercase">Luma</Link>
          <button aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setOpen(false)} className="text-[#f1e4c6] p-2"><X size={23} /></button>
        </div>
        <nav className="mt-16 flex flex-col gap-5 overflow-y-auto">
          {navItems.map((item, index) => <Link key={item.href} href={item.href} data-testid={`link-mobile-${index}`} className="font-display text-4xl text-[#f1e4c6] hover:text-[#df7c5b] transition-colors">{item.label}</Link>)}
        </nav>
        <div className="mt-auto border-t hairline pt-5 flex justify-between items-end">
          <AuthControls />
          <span className="eyebrow">Melbourne · Naarm<br />Wed–Sun from 5pm</span>
          <Instagram size={18} className="text-[#e9bf83]" />
        </div>
      </div>}
    </header>
  );
}

export function Footer() {
  return <footer className="border-t hairline mt-24 px-5 md:px-10 py-12">
    <div className="mx-auto max-w-[1360px] grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
      <div><div className="font-display text-5xl text-[#f1e4c6]">Luma<span className="text-[#df7c5b]">.</span></div><p className="mt-3 text-sm text-[#c9b99f]/70 max-w-[220px]">A warm room, an open fire, and a little time to spare.</p></div>
      <div><div className="eyebrow mb-4">Visit</div><p className="text-sm leading-7 text-[#e8d9bb]/75">18 Flinders Lane<br />Melbourne · Naarm 3000</p></div>
      <div><div className="eyebrow mb-4">Hours</div><p className="text-sm leading-7 text-[#e8d9bb]/75">Wednesday–Sunday<br />5pm until late</p></div>
      <div><div className="eyebrow mb-4">Say hello</div><a href="mailto:hello@lumadining.com" data-testid="link-footer-email" className="block text-sm text-[#e8d9bb]/75 hover:text-[#e9bf83]">hello@lumadining.com</a><a href="https://instagram.com" data-testid="link-footer-instagram" className="mt-2 inline-flex items-center gap-2 text-sm text-[#e8d9bb]/75 hover:text-[#e9bf83]"><Instagram size={14} /> @lumadining</a></div>
    </div>
    <div className="mx-auto max-w-[1360px] mt-14 pt-4 border-t hairline flex justify-between text-[10px] uppercase tracking-[.1em] text-[#c9b99f]/45"><span>© 2024 Luma Dining Room</span><span>Eat slowly. Stay awhile.</span></div>
  </footer>;
}

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useReveal();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, [location]);
  return <div className="page-shell noise"><Header />{children}<Footer /></div>;
}
