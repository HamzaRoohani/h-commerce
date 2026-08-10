import { Router } from 'express';
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createAuthRateLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/register', createAuthRateLimiter(), asyncHandler(register));
authRoutes.post('/login', createAuthRateLimiter(), asyncHandler(login));
authRoutes.post('/refresh', asyncHandler(refresh));
authRoutes.post('/logout', asyncHandler(logout));
authRoutes.post('/verify-email', asyncHandler(verifyEmail));
authRoutes.post('/forgot', createAuthRateLimiter(), asyncHandler(forgotPassword));
authRoutes.post('/reset', createAuthRateLimiter(), asyncHandler(resetPassword));
authRoutes.get('/me', requireAuth, asyncHandler(me));
