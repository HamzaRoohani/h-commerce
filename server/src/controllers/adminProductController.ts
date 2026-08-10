import type { Request, Response } from 'express';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createProductSchema, updateProductSchema } from '../validators/adminProduct.js';
import { slugify } from '../utils/slugify.js';
import { notifyStorefrontRevalidation } from '../services/revalidate.js';

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000;
}

async function pathsForProduct(productId: string): Promise<string[]> {
  const product = await Product.findById(productId).populate<{ category: { slug: string } }>(
    'category',
    'slug',
  );
  if (!product) return ['/'];
  return ['/', `/products/${product.slug}`, `/collections/${product.category.slug}`];
}

export async function adminListProducts(req: Request, res: Response) {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(60, Math.max(1, Number.parseInt(String(req.query.limit ?? '30'), 10) || 30));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const filter: Record<string, unknown> = search ? { $text: { $search: search } } : {};

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({ products, total, page, limit, totalPages: Math.ceil(total / limit) });
}

export async function adminGetProduct(req: Request, res: Response) {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ product });
}

export async function adminCreateProduct(req: Request, res: Response) {
  const body = createProductSchema.parse(req.body);

  const category = await Category.findById(body.category);
  if (!category) throw new ApiError(400, 'Category not found');

  const slug = body.slug ? slugify(body.slug) : slugify(body.title);

  let product;
  try {
    product = await Product.create({ ...body, slug });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, `Slug already in use: ${slug}`);
    throw err;
  }

  await notifyStorefrontRevalidation(await pathsForProduct(product._id.toString()));
  res.status(201).json({ product });
}

export async function adminUpdateProduct(req: Request, res: Response) {
  const body = updateProductSchema.parse(req.body);
  const existing = await Product.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Product not found');

  const oldCategorySlugPromise =
    body.category && body.category !== existing.category.toString()
      ? Category.findById(existing.category).select('slug').lean()
      : null;

  if (body.category) {
    const category = await Category.findById(body.category);
    if (!category) throw new ApiError(400, 'Category not found');
  }

  const update: Record<string, unknown> = { ...body };
  if (body.slug) update.slug = slugify(body.slug);

  let product;
  try {
    product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new ApiError(409, 'Slug already in use');
    throw err;
  }
  if (!product) throw new ApiError(404, 'Product not found');

  const paths = await pathsForProduct(product._id.toString());
  const oldCategory = await oldCategorySlugPromise;
  if (oldCategory) paths.push(`/collections/${oldCategory.slug}`);
  await notifyStorefrontRevalidation(paths);

  res.json({ product });
}

export async function adminDeleteProduct(req: Request, res: Response) {
  const paths = await pathsForProduct(req.params.id);

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  await notifyStorefrontRevalidation(paths);
  res.status(204).send();
}
