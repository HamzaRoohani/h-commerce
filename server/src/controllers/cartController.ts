import type { Request, Response } from 'express';
import { Cart, type CartDoc } from '../models/Cart.js';
import { Product, type ProductDoc } from '../models/Product.js';
import { ApiError } from '../middleware/errorHandler.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { cartItemInputSchema, mergeCartSchema, updateCartItemSchema } from '../validators/cart.js';

function userId(req: Request): string {
  return (req as AuthedRequest).user.id;
}

function currentPricePaisa(product: ProductDoc, variant: ProductDoc['variants'][number]): number {
  return variant.priceOverridePaisa ?? product.salePricePaisa ?? product.basePricePaisa;
}

async function resolveVariant(productId: string, variantSku: string) {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found');

  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) throw new ApiError(404, `Variant not found: ${variantSku}`);

  return { product, variant };
}

async function getOrCreateCart(userId: string) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
}

/** Adds qty to an existing line (capped at stock) or pushes a new one. */
function upsertItem(
  cart: CartDoc & { items: CartDoc['items'] },
  productId: string,
  product: ProductDoc,
  variant: ProductDoc['variants'][number],
  qty: number,
) {
  const existing = cart.items.find((item) => item.variantSku === variant.sku);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, variant.stock);
  } else {
    cart.items.push({
      product: product._id,
      variantSku: variant.sku,
      qty: Math.min(qty, variant.stock),
      priceAtAddPaisa: currentPricePaisa(product, variant),
    });
  }
}

async function toCartResponse(cart: CartDoc) {
  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const productById = new Map(products.map((p) => [p._id.toString(), p]));

  const items = cart.items.map((item) => {
    const product = productById.get(item.product.toString());
    const variant = product?.variants.find((v) => v.sku === item.variantSku);
    return {
      productId: item.product.toString(),
      variantSku: item.variantSku,
      qty: item.qty,
      priceAtAddPaisa: item.priceAtAddPaisa,
      title: product?.title ?? 'Unavailable',
      slug: product?.slug ?? null,
      image: product?.images[0] ?? null,
      size: variant?.size ?? null,
      stock: variant?.stock ?? 0,
      currentPricePaisa: product && variant ? currentPricePaisa(product, variant) : null,
    };
  });

  const subtotalPaisa = items.reduce((sum, item) => sum + item.qty * (item.currentPricePaisa ?? item.priceAtAddPaisa), 0);

  return { items, subtotalPaisa };
}

export async function getCart(req: Request, res: Response) {
  const cart = await getOrCreateCart(userId(req));
  res.json(await toCartResponse(cart));
}

export async function addCartItem(req: Request, res: Response) {
  const { productId, variantSku, qty } = cartItemInputSchema.parse(req.body);
  const { product, variant } = await resolveVariant(productId, variantSku);

  const cart = await getOrCreateCart(userId(req));
  upsertItem(cart, productId, product, variant, qty);
  await cart.save();

  res.status(201).json(await toCartResponse(cart));
}

export async function updateCartItem(req: Request, res: Response) {
  const { qty } = updateCartItemSchema.parse(req.body);
  const sku = req.params.sku;

  const cart = await getOrCreateCart(userId(req));
  const item = cart.items.find((i) => i.variantSku === sku);
  if (!item) throw new ApiError(404, 'Item not in cart');

  const product = await Product.findById(item.product);
  const variant = product?.variants.find((v) => v.sku === sku);
  item.qty = Math.min(qty, variant?.stock ?? qty);

  await cart.save();
  res.json(await toCartResponse(cart));
}

export async function removeCartItem(req: Request, res: Response) {
  const sku = req.params.sku;
  const cart = await getOrCreateCart(userId(req));
  cart.items = cart.items.filter((i) => i.variantSku !== sku) as typeof cart.items;
  await cart.save();
  res.json(await toCartResponse(cart));
}

export async function mergeCart(req: Request, res: Response) {
  const { items } = mergeCartSchema.parse(req.body);
  const cart = await getOrCreateCart(userId(req));

  for (const { productId, variantSku, qty } of items) {
    try {
      const { product, variant } = await resolveVariant(productId, variantSku);
      upsertItem(cart, productId, product, variant, qty);
    } catch {
      // Guest cart referenced a product/variant that's gone or inactive — skip it.
    }
  }

  await cart.save();
  res.json(await toCartResponse(cart));
}
