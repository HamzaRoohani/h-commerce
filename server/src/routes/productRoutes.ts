import { Router } from 'express';
import { getProductBySlug, listProducts } from '../controllers/productController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productRoutes = Router();

productRoutes.get('/', asyncHandler(listProducts));
productRoutes.get('/:slug', asyncHandler(getProductBySlug));
