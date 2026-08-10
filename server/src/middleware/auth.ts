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
