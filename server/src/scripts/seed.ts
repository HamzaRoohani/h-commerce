/**
 * Local dev seed: category tree + ~30 dummy products with paisa pricing.
 * Product names/copy are generic placeholders — no reference-site content used.
 *
 * Usage: npm run seed   (reads MONGODB_URI from .env, wipes Category+Product first)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function placeholderImage(seed: string, i: number): string {
  return `https://picsum.photos/seed/h-store-${seed}-${i}/800/1000`;
}

type CategorySeed = { name: string; children?: string[] };

const CATEGORY_TREE: CategorySeed[] = [
  { name: 'Men', children: ['Shirts', 'Kurtas', 'Trousers'] },
  { name: 'Women', children: ['Unstitched', 'Stitched', 'Dupattas'] },
  { name: 'Kids', children: ['Boys', 'Girls'] },
  { name: 'Accessories', children: ['Perfumes', 'Bags'] },
];

// [category slug, product title, base price in Rs, has size variants]
const PRODUCT_SEEDS: Array<[string, string, number, boolean]> = [
  ['shirts', 'Slim Fit Formal Shirt', 3290, true],
  ['shirts', 'Printed Cotton Casual Shirt', 2890, true],
  ['shirts', 'Oxford Button-Down Shirt', 3490, true],
  ['shirts', 'Linen Blend Summer Shirt', 3690, true],
  ['kurtas', 'Classic Cotton Kurta', 2590, true],
  ['kurtas', 'Embroidered Festive Kurta', 4990, true],
  ['kurtas', 'Straight Cut Khaddar Kurta', 2790, true],
  ['trousers', 'Classic Denim Trousers', 3190, true],
  ['trousers', 'Slim Fit Chinos', 2990, true],
  ['trousers', 'Formal Dress Trousers', 3390, true],
  ['unstitched', 'Embroidered Lawn 3-Piece', 6990, false],
  ['unstitched', 'Printed Lawn 2-Piece', 4490, false],
  ['unstitched', 'Digital Print Cotton 3-Piece', 7490, false],
  ['unstitched', 'Chikankari Lawn 3-Piece', 8990, false],
  ['stitched', 'Ready-to-Wear Embroidered Suit', 8490, true],
  ['stitched', 'Party Wear 3-Piece Suit', 12990, true],
  ['stitched', 'Casual Printed 2-Piece', 5490, true],
  ['dupattas', 'Chiffon Embroidered Dupatta', 1990, false],
  ['dupattas', 'Printed Lawn Dupatta', 1290, false],
  ['dupattas', 'Organza Net Dupatta', 2490, false],
  ['boys', 'Boys Printed Kurta Set', 2290, true],
  ['boys', 'Boys Casual Shirt & Trouser Set', 2690, true],
  ['boys', 'Boys Denim Jacket', 3490, true],
  ['girls', 'Girls Party Frock', 3990, true],
  ['girls', 'Girls Embroidered Kurti', 2190, true],
  ['girls', 'Girls Printed Lawn Suit', 2990, true],
  ['perfumes', 'Eau de Parfum — Oud Collection 100ml', 5990, false],
  ['perfumes', 'Eau de Parfum — Musk Collection 50ml', 3990, false],
  ['bags', 'Structured Tote Bag', 4490, false],
  ['bags', 'Embroidered Clutch', 2990, false],
];

const SIZES = ['S', 'M', 'L', 'XL'];

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`[seed] connected — ${mongoose.connection.name}`);

  await Product.deleteMany({});
  await Category.deleteMany({});
  console.log('[seed] cleared Product + Category collections');

  const categoryIdBySlug = new Map<string, mongoose.Types.ObjectId>();

  let order = 0;
  for (const parent of CATEGORY_TREE) {
    const parentSlug = slugify(parent.name);
    const parentDoc = await Category.create({
      name: parent.name,
      slug: parentSlug,
      parent: null,
      order: order++,
      isFeatured: true,
    });
    categoryIdBySlug.set(parentSlug, parentDoc._id);

    for (const childName of parent.children ?? []) {
      const childSlug = slugify(childName);
      const childDoc = await Category.create({
        name: childName,
        slug: childSlug,
        parent: parentDoc._id,
        order: order++,
      });
      categoryIdBySlug.set(childSlug, childDoc._id);
    }
  }
  console.log(`[seed] created ${categoryIdBySlug.size} categories`);

  let created = 0;
  for (const [categorySlug, title, priceRs, hasVariants] of PRODUCT_SEEDS) {
    const categoryId = categoryIdBySlug.get(categorySlug);
    if (!categoryId) {
      throw new Error(`[seed] unknown category slug "${categorySlug}" — check CATEGORY_TREE`);
    }

    const slug = slugify(title);
    const basePricePaisa = priceRs * 100;
    const onSale = Math.random() < 0.3;
    const salePricePaisa = onSale ? Math.round((basePricePaisa * 0.8) / 100) * 100 : null;

    const variants = hasVariants
      ? SIZES.map((size, i) => ({
          size,
          color: null,
          sku: `${slug}-${size}`.toUpperCase(),
          stock: 10 + i * 5,
          priceOverridePaisa: null,
        }))
      : [
          {
            size: null,
            color: null,
            sku: slug.toUpperCase(),
            stock: 25,
            priceOverridePaisa: null,
          },
        ];

    await Product.create({
      title,
      slug,
      description: `${title} — part of the H. collection. Placeholder description for local development.`,
      category: categoryId,
      basePricePaisa,
      salePricePaisa,
      currency: 'PKR',
      images: [placeholderImage(slug, 1), placeholderImage(slug, 2)],
      variants,
      tags: [categorySlug],
      isActive: true,
      isNewIn: Math.random() < 0.25,
      isFeatured: Math.random() < 0.2,
    });
    created++;
  }

  console.log(`[seed] created ${created} products`);
  await mongoose.disconnect();
  console.log('[seed] done');
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
