import type { FormEvent } from 'react';

export type ApiResponse<T> = { success: boolean; message?: string; data: T };

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = window.localStorage.getItem('luma_token');
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T> & { error?: string };
  if (!response.ok || !body.success) throw new Error(body.message || body.error || 'Something went wrong');
  return body.data;
}

export function formValues(event: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}

export function formatPrice(price: number) {
  return `Rs ${Math.round(price).toLocaleString('en-PK')}`;
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-PK', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
