import type { NextFunction, Request, Response } from 'express';
import { ApiError } from './errorHandler.js';
import { verifyAccessToken } from '../utils/jwt.js';

export type AuthedRequest = Request & { user: { id: string; role: 'customer' | 'admin' } };

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated');
  }

  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    (req as AuthedRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired access token');
  }
}

/** Mount after requireAuth. Role is embedded in the access token at sign-time (login/refresh),
 * so a demoted admin keeps access until their current token expires (≤15m). */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if ((req as AuthedRequest).user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
  next();
}
