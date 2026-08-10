import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Called by the Express API after an admin product/category mutation
 * (server/src/services/revalidate.ts) so storefront pages update within
 * seconds instead of waiting out the ISR window (§11 of the build plan).
 * Secret-gated since this triggers cache invalidation, not because the
 * paths themselves are sensitive.
 */
export async function POST(request: Request) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid revalidation secret' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const paths = Array.isArray(body?.paths) ? body.paths.filter((p: unknown) => typeof p === 'string') : [];

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths });
}
