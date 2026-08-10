import type { Request, Response } from 'express';
import { Category, type CategoryDoc } from '../models/Category.js';

type CategoryNode = CategoryDoc & { children: CategoryNode[] };

export async function listCategories(_req: Request, res: Response) {
  const categories = await Category.find().sort({ order: 1 }).lean<CategoryDoc[]>();

  const byId = new Map<string, CategoryNode>(
    categories.map((c) => [c._id.toString(), { ...c, children: [] }]),
  );

  const roots: CategoryNode[] = [];
  for (const category of byId.values()) {
    if (category.parent) {
      const parent = byId.get(category.parent.toString());
      if (parent) {
        parent.children.push(category);
        continue;
      }
    }
    roots.push(category);
  }

  res.json({ categories: roots });
}
