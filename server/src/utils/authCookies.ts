import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';
import { durationToMs } from './duration.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

// ADR-002: Domain=.apex + SameSite=Lax so the refresh cookie survives
// top-level navigations across subdomains, HttpOnly/Secure so JS/plain-HTTP
// never see it.
function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: durationToMs(env.JWT_REFRESH_EXPIRES),
  };
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions());
}

export function clearRefreshCookie(res: Response): void {
  const { maxAge: _maxAge, ...options } = cookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}
