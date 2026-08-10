import { Router } from 'express';
import { handlePaymentWebhook } from '../controllers/webhookController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const webhookRoutes = Router();

// Public — gateways call this server-to-server, no user session involved.
// Generic path per provider, never hardcoded to one gateway's name (§5).
webhookRoutes.post('/payments/:provider', asyncHandler(handlePaymentWebhook));
