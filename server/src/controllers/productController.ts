import type { Request, Response } from 'express';
import type { Types } from 'mongoose';
import { Category, type CategoryDoc } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';
import { listProductsQuerySchema } from '../validators/product.js';

const SORT_MAP = {
  newest: { createdAt: -1 as const },
  price_asc: { basePricePaisa: 1 as const },
  price_desc: { basePricePaisa: -1 as const },
};

/**
 * A parent category (e.g. "Women") has no products of its own — only its
 * children (Unstitched/Stitched/Dupattas) do. Browsing "Women" should show
 * everything underneath it, not a literally-empty listing.
 */
async function resolveCategoryAndDescendantIds(rootId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const all = await Category.find().select('_id parent').lean<Pick<CategoryDoc, '_id' | 'parent'>[]>();
  const childrenByParent = new Map<string, Types.ObjectId[]>();
  for (const cat of all) {
    if (!cat.parent) continue;
    const key = cat.parent.toString();
    childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), cat._id]);
  }

  const ids: Types.ObjectId[] = [rootId];
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenByParent.get(current.toString()) ?? [];
    ids.push(...children);
    queue.push(...children);
  }
  return ids;
}

export async function listProducts(req: Request, res: Response) {
  const query = listProductsQuerySchema.parse(req.query);

  const filter: Record<string, unknown> = { isActive: true };

  if (query.category) {
    const category = await Category.findOne({ slug: query.category });
    if (!category) {
      return res.json({ products: [], total: 0, page: query.page, limit: query.limit, totalPages: 0 });
    }
    const categoryIds = await resolveCategoryAndDescendantIds(category._id);
    filter.category = { $in: categoryIds };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const skip = (query.page - 1) * query.limit;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_MAP[query.sort])
      .skip(skip)
      .limit(query.limit)
      .populate('category', 'name slug'),
    Product.countDocuments(filter),
  ]);

  res.json({
    products,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  });
}

export async function getProductBySlug(req: Request, res: Response) {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    'category',
    'name slug',
  );

  if (!product) {
    throw new ApiError(404, `Product not found: ${req.params.slug}`);
  }

  res.json({ product });
}
