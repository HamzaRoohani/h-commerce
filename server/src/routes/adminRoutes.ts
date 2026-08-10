import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminGetProduct,
  adminListProducts,
  adminUpdateProduct,
} from '../controllers/adminProductController.js';
import { adminListOrders, adminUpdateOrder } from '../controllers/adminOrderController.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get('/products', asyncHandler(adminListProducts));
adminRoutes.get('/products/:id', asyncHandler(adminGetProduct));
adminRoutes.post('/products', asyncHandler(adminCreateProduct));
adminRoutes.patch('/products/:id', asyncHandler(adminUpdateProduct));
adminRoutes.delete('/products/:id', asyncHandler(adminDeleteProduct));

adminRoutes.get('/orders', asyncHandler(adminListOrders));
adminRoutes.patch('/orders/:orderNumber', asyncHandler(adminUpdateOrder));
