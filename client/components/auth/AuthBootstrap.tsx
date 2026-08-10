'use client';

import { useEffect } from 'react';
import { refreshRequest } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

/**
 * Silent refresh on app boot (§6.4): the access token lives in memory, so a
 * hard reload always starts with none. Runs once before auth-dependent UI
 * (e.g. Header's account link) can rely on the store being settled.
 */
export function AuthBootstrap() {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    let cancelled = false;

    refreshRequest()
      .then(({ accessToken, user }) => {
        if (!cancelled) setSession(accessToken, user);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession]);

  return null;
}
