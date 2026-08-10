# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**H.** — a Pakistan-market e-commerce storefront (Next.js frontend, Express/MongoDB API), built as a
mega-menu retail store. junaidjamshed.com is a UX/structure reference only — no assets, copy, or
product data are shared with it (see `docs/ADR.md`).

Full phased build plan (source of truth for scope/sequencing) is `docs/build-plan.md`. Phases 0–6 are
complete: scaffold/auth, read-only storefront, cart/checkout (COD), gateway payments (mock),
mega-menu/wishlist/search/polish. Remaining: Phase 7 (admin panel + production hardening).

## Commands

```bash
# server (from server/)
cp .env.example .env      # first-time setup — MOCK_GATEWAY_SECRET/PENDING_ORDER_EXPIRY_MINUTES have defaults, rest don't
npm install
npm run dev                # tsx watch src/server.ts — http://localhost:5000
npm run seed                # wipes Product+Category, reseeds 14 categories / 30 products
npm run build                # tsc -p tsconfig.json
npx tsc --noEmit              # typecheck only, no test suite exists yet

# client (from client/, separate terminal)
cp .env.example .env.local
npm install
npm run dev                 # next dev (Turbopack) — http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

MongoDB must be running locally (`mongodb://127.0.0.1:27017/h_ecommerce_dev` by default) or point
`MONGODB_URI` at Atlas. There is no test runner configured in either package yet — `npx tsc --noEmit`
is the only automated check; verification has otherwise been manual (curl for the API, the browser for
the UI).

**Windows/tsx watch gotcha:** stopping the dev server by killing only the PID bound to the port does
**not** kill it — `tsx watch`'s parent process detects the dead child and respawns a new one, leaving
an orphaned zombie tree that silently keeps serving stale code. Always find the true parent
(`Get-CimInstance Win32_Process -Filter "ProcessId = <listening-pid>"` → check `ParentProcessId`) and
kill that, or kill the whole `npm run dev` process tree from its top (the `npm-cli.js` wrapper), not
just the port listener.

## Architecture

### Three decisions locked in `docs/ADR.md` — read before touching money, auth, or payments

1. **Money is always integer paisa** (`199900` = Rs 1,999.00), in the DB, the API, and webhooks — never
   a float. `client/lib/money.ts` (`formatPaisa`) is the *only* place paisa becomes a display string.
   Every Mongoose schema with a `*Paisa` field validates integrality via `server/src/utils/paisaValidator.ts`.
2. **Single apex domain** for frontend + API in production (subdomains), because the refresh-token
   cookie is `SameSite=Lax` and cross-site cookies silently break in ways that don't show up in local
   dev. Locally: client on `:3000`, API on `:5000`, CORS locked to `CLIENT_ORIGIN` exactly.
3. **Payments behind `PaymentProvider`** (`server/src/services/payments/`) — controllers never call a
   gateway SDK directly. `CodProvider` and `MockGatewayProvider` both implement the same interface;
   swapping in a real gateway (PayFast/Safepay/Simpaisa) later touches only `services/payments/index.ts`.

### Server (`server/src`) — layered Express + Mongoose

`app.ts` wires middleware (helmet, CORS, mongo-sanitize, cookie-parser) then mounts routers under
`/api/*`; `server.ts` connects Mongo, starts listening, and kicks off the pending-order expiry sweep
(`setInterval`, every 5 min). Standard flow per feature: `routes/*.ts` → `asyncHandler`-wrapped
controller in `controllers/*.ts` → Zod schema in `validators/*.ts` for input, Mongoose model in
`models/*.ts` for persistence. `middleware/auth.ts`'s `requireAuth` attaches `req.user` (cast via the
`AuthedRequest` type — see below); `middleware/errorHandler.ts` centralizes `ApiError` → HTTP status.

**Auth** (`controllers/authController.ts`): short-lived access JWT (15m, returned in body, kept in
memory client-side) + rotating refresh JWT (7d, httpOnly cookie). Every `/auth/refresh` call issues a
new refresh token and hashes+stores it on the user; presenting an already-rotated token is treated as
theft and revokes the whole session. **This makes concurrent refresh calls dangerous** — see the
client-side dedup note below.

**Orders** (`controllers/orderController.ts`): `POST /api/orders` recomputes every line from live
`Product` data (cart prices are display-only, never trusted), then does a **per-item atomic stock
decrement** with rollback if any item fails partway through (`decrementStockOrThrow`). The Mongo query
for this uses `variants: { $elemMatch: { sku, stock: { $gte: qty } } }` — **do not** flatten this into
two separate top-level `'variants.sku'` / `'variants.stock'` conditions; MongoDB doesn't require
separate array-field conditions to match the same element, so the positional `$` in the update can
silently decrement the wrong variant (this exact bug shipped once and was caught by testing, not
review). Cart-clearing timing differs by payment method: COD clears the cart immediately (order is
committed on the spot); gateway orders keep the cart until the webhook confirms `paid`, so a
failed/abandoned payment doesn't strand the user with an empty cart.

**Payments/webhooks**: `POST /api/webhooks/payments/:provider` is the only place `Order.paymentStatus`
is allowed to change — never from a frontend redirect. Idempotency is enforced by inserting a
`WebhookEvent` with a unique `eventId`; a duplicate-key error means "already processed," and the
handler acks 200 and stops. `routes/devRoutes.ts` (mounted only when `NODE_ENV !== 'production'`)
simulates a gateway's server-to-server webhook call for local testing without a real merchant account —
it signs a payload the same way `MockGatewayProvider` verifies it and posts to the real webhook route.

**Mongoose timestamps gotcha:** `timestamps: true` marks `createdAt` `immutable: true` by default, and
Mongoose enforces that even through `Model.updateOne({...}, {$set: {createdAt}})` — the field is
silently dropped from the update. If you ever need to backdate a timestamp (e.g. testing the pending-
order expiry sweep), use `Model.collection.updateOne(...)` to bypass the schema layer via the native
driver.

### Client (`client/`) — Next.js App Router, two route groups

`app/(shop)/*` (home, collections, PDP, cart, checkout, search, wishlist) and `app/(account)/*`
(login/register/verify/forgot/reset, account, orders) — each group has its own `error.tsx`; `(shop)`
also has a generic `loading.tsx` plus per-segment skeletons for collections/PDP.

**Data fetching split**: `lib/products.ts` / `lib/categories.ts` use `publicFetch` (plain `fetch` with
`next: { revalidate: 300 }`) for ISR on server components — no cookies, cacheable. `lib/api.ts`'s
`apiFetch` (credentials included, manual `Authorization` header) is for authenticated client-side calls
(cart, orders, wishlist, dev endpoints). Don't mix these up — using `apiFetch`'s cookie-based pattern
in a server component won't get you ISR caching, and using `publicFetch` for an authenticated endpoint
won't send the access token.

**Auth/cart/wishlist state**: Zustand stores (`store/*.ts`), no React Context. `AuthBootstrap`
(mounted once in the root layout) does the silent refresh on app boot and, once authenticated, loads
the server cart and wishlist in the same pass. `useAuthStore`'s `status` is `'loading' | 'authenticated'
| 'guest'` — pages that require auth guard on `status === 'guest'` (not the absence of a user) to avoid
a false redirect while the silent refresh is still in flight.

Cart has a guest/server split mirroring the backend design: `store/guestCartStore.ts` (Zustand +
`persist` to localStorage — cart contents aren't sensitive) is authoritative for unauthenticated users;
`store/serverCartStore.ts` mirrors the API once logged in. `hooks/useCart.ts` picks the right one
based on auth status so components don't have to. `lib/cartMerge.ts` posts the guest cart to
`/api/cart/merge` on login/register success and clears local state. Wishlist (`hooks/useWishlist.ts`,
`store/wishlistStore.ts`) is server-only, no guest mode — the auth gate is simpler there.

**Refresh-token race (fixed, keep the fix)**: `lib/auth.ts`'s `refreshRequest` dedupes concurrent
callers onto a single in-flight promise. Without this, React Strict Mode double-invoking
`AuthBootstrap`'s effect (or two tabs refreshing near-simultaneously) fires two `/api/auth/refresh`
calls; the first rotates the cookie, the second presents the now-stale token, and the server's reuse
detection revokes the whole session as a false positive. If you add another place that calls
`refreshRequest` directly, it's already safe — don't re-implement your own refresh call.

**Next.js 16 breaking changes from training-data expectations**: `params` and `searchParams` in page
components are `Promise`s now (`await params`), not plain objects — every dynonic route in this repo
(`[slug]`, `[orderNumber]`) follows this. Client components that need `useSearchParams()` (verify-email,
reset-password, search) wrap in `<Suspense>` per Next's convention. `node_modules/next/dist/docs/` has
the current framework docs if something behaves unexpectedly — training data lags the framework here.
`client/AGENTS.md` (auto-generated by `next dev`, gitignored-in-spirit but currently tracked) repeats
this warning; don't strip it, `next dev` re-adds it anyway.

**Streaming/Suspense note (not a bug)**: pages using `loading.tsx` stream their fallback first and swap
in real content via a batched `requestAnimationFrame`-driven mechanism (`$RC`/`$RB`/`$RV` on
`window`, React's internals). This batch never flushes in a backgrounded/non-composited browser tab
(rAF is suspended) — real foreground tabs are unaffected. If a page looks stuck on its loading skeleton
during automated browser testing, check `document.hidden` before assuming an app bug.
