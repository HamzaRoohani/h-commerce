import { apiFetch } from './api';
import type { User } from '@/types/user';

type SessionResponse = { accessToken: string; user: User };

export function registerRequest(input: { name: string; email: string; password: string }) {
  return apiFetch<SessionResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginRequest(input: { email: string; password: string }) {
  return apiFetch<SessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

let inFlightRefresh: Promise<SessionResponse> | null = null;

/**
 * Deduplicates concurrent callers onto one in-flight request. Refresh
 * tokens rotate on every use (§6.5) — two near-simultaneous calls (React
 * Strict Mode double-invoking an effect, two tabs refreshing at once) would
 * otherwise race: the first rotates the cookie, the second presents the
 * now-stale token, and the server's reuse detection revokes the whole
 * session as a false positive.
 */
export function refreshRequest(): Promise<SessionResponse> {
  if (inFlightRefresh) return inFlightRefresh;

  inFlightRefresh = apiFetch<SessionResponse>('/auth/refresh', { method: 'POST' }).finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

export function logoutRequest() {
  return apiFetch<void>('/auth/logout', { method: 'POST' });
}

export function verifyEmailRequest(token: string) {
  return apiFetch<{ user: User }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function forgotPasswordRequest(email: string) {
  return apiFetch<{ message: string }>('/auth/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(input: { token: string; password: string }) {
  return apiFetch<{ message: string }>('/auth/reset', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function meRequest(accessToken: string) {
  return apiFetch<{ user: User }>('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
