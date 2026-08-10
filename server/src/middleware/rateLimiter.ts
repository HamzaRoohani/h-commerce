import rateLimit from 'express-rate-limit';

/**
 * 5 requests per 15 minutes per IP (§10 security checklist). A fresh
 * instance per route so login/register/forgot/reset each get their own
 * budget — otherwise a few failed login attempts would also lock the user
 * out of password recovery.
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Try again later.' },
  });
}
