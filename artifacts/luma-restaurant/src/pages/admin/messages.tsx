import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin-layout';
import { apiRequest, formatDateTime } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
};

const statuses = ['unread', 'read', 'replied'];

export default function AdminMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    apiRequest<ContactMessage[]>('/contact').then((data) => { setMessages(data); setStatus('ready'); }).catch(() => setStatus('error'));
  }, [user]);

  const updateStatus = async (id: number, nextStatus: string) => {
    setBusyId(id);
    try {
      await apiRequest(`/contact/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      setMessages((current) => current.map((message) => (message.id === id ? { ...message, status: nextStatus } : message)));
    } finally {
      setBusyId(null);
    }
  };

  return <AdminShell title="Messages">
    {status === 'loading' && <p className="text-sm text-[#c9b99f]/60 font-mono-custom text-[10px] uppercase tracking-[.12em]">Loading…</p>}
    {status === 'error' && <p className="text-sm text-[#df7c5b]">Could not load messages.</p>}
    {status === 'ready' && messages.length === 0 && <p className="text-sm text-[#c9b99f]/60">No messages yet.</p>}
    {status === 'ready' && messages.length > 0 && <div className="divide-y hairline">
      {messages.map((message) => (
        <div key={message.id} data-testid={`row-message-${message.id}`} className="py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setOpenId((current) => (current === message.id ? null : message.id))} data-testid={`button-toggle-message-${message.id}`} className="text-left">
              <p className="text-[#f1e4c6]">{message.name} <span className="text-[#c9b99f]/50 text-xs">· {message.email}</span></p>
              <p className="text-sm text-[#c9b99f]/70 mt-1">{message.subject}</p>
            </button>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-[#c9b99f]/50">{formatDateTime(message.createdAt)}</span>
              <select value={message.status} disabled={busyId === message.id} onChange={(event) => updateStatus(message.id, event.target.value)} data-testid={`select-message-status-${message.id}`} className="bg-transparent border-b border-[#e8d9bb]/25 py-1 text-[#f1e4c6] text-xs capitalize">
                {statuses.map((value) => <option key={value} className="bg-[#241729]" value={value}>{value}</option>)}
              </select>
            </div>
          </div>
          {openId === message.id && <div className="mt-4 bg-[#30203a] border hairline p-4 text-sm text-[#c9b99f]/80 leading-6">
            {message.message}
            {message.phone && <p className="mt-3 text-xs text-[#c9b99f]/50">Phone: {message.phone}</p>}
          </div>}
        </div>
      ))}
    </div>}
  </AdminShell>;
}
