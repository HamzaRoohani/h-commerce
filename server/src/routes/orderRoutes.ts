import { Router } from 'express';
import { createOrder, getOrder, listOrders } from '../controllers/orderController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const orderRoutes = Router();

orderRoutes.use(requireAuth);

orderRoutes.post('/', asyncHandler(createOrder));
orderRoutes.get('/', asyncHandler(listOrders));
orderRoutes.get('/:orderNumber', asyncHandler(getOrder));
