import { Router } from 'express';
import {
  backdateOrder,
  simulateMockGatewayWebhook,
  triggerExpirySweep,
} from '../controllers/devController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const devRoutes = Router();

devRoutes.post(
  '/mock-gateway/:orderNumber/simulate',
  requireAuth,
  asyncHandler(simulateMockGatewayWebhook),
);
devRoutes.post('/mock-gateway/:orderNumber/backdate', requireAuth, asyncHandler(backdateOrder));
devRoutes.post('/expire-pending-orders', asyncHandler(triggerExpirySweep));
