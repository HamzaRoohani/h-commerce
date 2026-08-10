import { Router } from 'express';
import { addToWishlist, getWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';

export const wishlistRoutes = Router();

wishlistRoutes.use(requireAuth);

wishlistRoutes.get('/', asyncHandler(getWishlist));
wishlistRoutes.post('/:productId', asyncHandler(addToWishlist));
wishlistRoutes.delete('/:productId', asyncHandler(removeFromWishlist));
