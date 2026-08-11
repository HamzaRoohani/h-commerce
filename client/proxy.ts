import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Category } from '@/types/category';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

/**
 * Fixes a real regression: once app/(shop)/loading.tsx (Phase 6) wraps a
 * route in Suspense, the response starts streaming with a 200 status
 * before notFound() can run, so it can only produce a "soft 404" (200 +
 * noindex meta — Next.js's own documented mitigation, see
 * node_modules/next/dist/docs/.../not-found.md). That's enough to keep
 * dead pages out of search results, but a genuinely missing product/
 * collection should still return a real 404 to any HTTP-aware caller.
 *
 * Existence is checked here, before streaming starts, so the status code
 * can still be set. On any fetch failure/timeout, this passes the request
 * through rather than 404ing — an API hiccup must not turn every cached
 * product page into a dead link (ISR is specifically resilient to that
 * otherwise, see CLAUDE.md).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Checkout requires a session. Gating it here — instead of letting the
  // page load and redirect client-side once its own auth check resolves —
  // means a guest never sees /checkout at all: no loading flash, no visible
  // detour through the URL. A present-but-invalid/expired cookie still
  // falls through to the page's own client-side guest redirect.
  if (pathname === '/checkout' && !request.cookies.get('refreshToken')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)\/?$/);
  if (productMatch) {
    const missing = await isMissing(`/products/${productMatch[1]}`);
    if (missing) return notFoundResponse();
    return NextResponse.next();
  }

  const collectionMatch = pathname.match(/^\/collections\/([^/]+)\/?$/);
  if (collectionMatch) {
    const missing = await isCollectionMissing(collectionMatch[1]);
    if (missing) return notFoundResponse();
    return NextResponse.next();
  }

  return NextResponse.next();
}

async function isMissing(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}${path}`, { signal: AbortSignal.timeout(2000) });
    return res.status === 404;
  } catch {
    return false; // API unreachable/slow — assume it exists, let the page handle it.
  }
}

async function isCollectionMissing(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/categories`, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return false;
    const { categories } = (await res.json()) as { categories: Category[] };
    return !findSlug(categories, slug);
  } catch {
    return false;
  }
}

function findSlug(categories: Category[], slug: string): boolean {
  for (const category of categories) {
    if (category.slug === slug) return true;
    if (findSlug(category.children, slug)) return true;
  }
  return false;
}

function notFoundResponse(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Not Found | H.</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:6rem 1.5rem;color:#111">
<h1 style="font-size:1.5rem">Page Not Found</h1>
<p style="color:#6b6b6b">This page could not be found.</p>
<a href="/" style="color:#111;text-decoration:underline">Back to home</a>
</body></html>`;
  return new NextResponse(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export const config = {
  matcher: ['/products/:slug', '/collections/:slug', '/checkout'],
};
