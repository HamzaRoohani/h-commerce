import { randomBytes, createHash } from 'node:crypto';

/**
 * For high-entropy random tokens (email verification, password reset,
 * refresh tokens) — not for passwords. A deterministic SHA-256 digest lets
 * us look the token up by its stored hash without a per-record bcrypt
 * comparison, which is appropriate once the input already has enough
 * entropy to resist brute force.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('hex');
  return { token, hash: hashToken(token) };
}
