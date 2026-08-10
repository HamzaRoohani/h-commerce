import { env } from '../config/env.js';

/**
 * Pings the Next.js app's on-demand revalidation route after an admin
 * product/category mutation, so "edit in admin, live on the storefront in
 * seconds" is real instead of waiting out the 300s ISR window (§11).
 * Best-effort — a failed ping shouldn't fail the admin request itself.
 */
export async function notifyStorefrontRevalidation(paths: string[]): Promise<void> {
  try {
    const res = await fetch(`${env.CLIENT_ORIGIN}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': env.REVALIDATE_SECRET },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) {
      console.warn(`[revalidate] storefront ping failed: ${res.status}`);
    }
  } catch (err) {
    console.warn('[revalidate] storefront ping failed:', err);
  }
}
