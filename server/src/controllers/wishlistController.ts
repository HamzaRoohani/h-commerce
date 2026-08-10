import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { AuthedRequest } from '../middleware/auth.js';

function userId(req: Request): string {
  return (req as AuthedRequest).user.id;
}

export async function getWishlist(req: Request, res: Response) {
  const user = await User.findById(userId(req)).populate('wishlist');
  res.json({ products: user?.wishlist ?? [] });
}

export async function addToWishlist(req: Request, res: Response) {
  const productId = req.params.productId;
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found');

  await User.updateOne({ _id: userId(req) }, { $addToSet: { wishlist: productId } });
  res.status(201).json({ added: productId });
}

export async function removeFromWishlist(req: Request, res: Response) {
  const productId = req.params.productId;
  await User.updateOne({ _id: userId(req) }, { $pull: { wishlist: productId } });
  res.json({ removed: productId });
}
