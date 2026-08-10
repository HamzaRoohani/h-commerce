'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/types/category';

/**
 * The desktop mega-menu is display:none below md, so mobile needs its own
 * way into the category tree — a hamburger-triggered slide-out drawer.
 */
export function MobileNav({ categories }: { categories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button type="button" onClick={() => setIsOpen(true)} aria-label="Open menu" className="p-1 text-xl">
        ☰
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute left-0 top-0 flex h-full w-full max-w-xs flex-col overflow-y-auto bg-paper shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <span className="font-serif text-lg text-ink">Menu</span>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close menu" className="text-sm text-muted">
                Close
              </button>
            </div>

            <nav className="px-6 py-4 text-sm uppercase tracking-wide">
              {categories.map((category) => (
                <div key={category._id} className="border-b border-border py-3">
                  <Link href={`/collections/${category.slug}`} onClick={() => setIsOpen(false)} className="text-ink">
                    {category.name}
                  </Link>
                  {category.children.length > 0 ? (
                    <ul className="mt-2 space-y-2 pl-4 normal-case tracking-normal">
                      {category.children.map((child) => (
                        <li key={child._id}>
                          <Link
                            href={`/collections/${child.slug}`}
                            onClick={() => setIsOpen(false)}
                            className="text-muted"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
