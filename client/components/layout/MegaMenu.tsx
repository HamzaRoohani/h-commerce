import Link from 'next/link';
import type { Category } from '@/types/category';

/**
 * Hover/focus-triggered dropdown per top-level category (§12.2). CSS-only
 * (group-hover/group-focus-within) so it works without client JS and stays
 * keyboard-accessible — no open/close state to manage.
 */
export function MegaMenu({ categories }: { categories: Category[] }) {
  return (
    <nav className="hidden gap-8 text-sm uppercase tracking-wide text-ink md:flex">
      {categories.map((category) => (
        <div key={category._id} className="group relative">
          <Link href={`/collections/${category.slug}`} className="flex h-16 items-center">
            {category.name}
          </Link>

          {category.children.length > 0 ? (
            <div className="invisible absolute left-0 top-full z-30 flex w-80 gap-6 border border-border bg-paper p-6 opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <ul className="flex-1 space-y-2 normal-case tracking-normal">
                {category.children.map((child) => (
                  <li key={child._id}>
                    <Link href={`/collections/${child.slug}`} className="block text-ink hover:text-accent">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex w-32 items-center justify-center border border-dashed border-border p-4 text-center text-xs normal-case tracking-normal text-muted">
                Shop {category.name}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}
