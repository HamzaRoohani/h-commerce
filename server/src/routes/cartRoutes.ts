import { Router } from 'express';
import { addCartItem, getCart, mergeCart, removeCartItem, updateCartItem } from '../controllers/cartController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const cartRoutes = Router();

cartRoutes.use(requireAuth);

cartRoutes.get('/', asyncHandler(getCart));
cartRoutes.post('/items', asyncHandler(addCartItem));
cartRoutes.patch('/items/:sku', asyncHandler(updateCartItem));
cartRoutes.delete('/items/:sku', asyncHandler(removeCartItem));
cartRoutes.post('/merge', asyncHandler(mergeCart));
