import { Router } from 'express';
import { listCategories } from '../controllers/categoryController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const categoryRoutes = Router();

categoryRoutes.get('/', asyncHandler(listCategories));
