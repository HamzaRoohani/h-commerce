# E-Commerce Platform — Build Plan v2 (Revised)

**Stack:** Next.js + Node.js/Express + MongoDB
**Reference (structure/UX only, not assets):** junaidjamshed.com pattern — mega-menu retail store
**Market:** Pakistan (PKR, wallet-heavy payment behavior, COD still significant)

**What changed from v1:** Stripe replaced with a swappable local-gateway abstraction + COD; single apex domain mandated to fix cross-site cookie auth; all money stored as integer paisa; atomic inventory decrement + idempotent webhooks; explicit guest-cart merge policy; email verification + password reset added to auth; ISR/SEO rendering strategy added; timeline extended to 8 weeks.

---

## 0. Ground Rules Before You Start

- You will NOT copy JJ's logo, product photos, or copy. You're replicating **UX patterns** (mega-menu, quick-add cards, cart drawer) with your own brand.
- Build in **vertical slices**, not horizontal layers. Product model → Product API → Product page → next feature. You stay motivated and catch integration bugs early.
- Commit to Git from day 1. Every phase = one or more commits. This is what you show clients as "process."
- **Three architectural decisions are locked before any code** (they're expensive to retrofit):
  1. Money = integers (paisa), everywhere.
  2. One apex domain for frontend + API.
  3. Payments behind a `PaymentProvider` interface, never called directly from controllers.

---

## 1. Domain & Deployment Architecture (NEW — decide first)

**Problem this solves:** frontend on `yourapp.vercel.app` + backend on `yourapp.onrender.com` = the refresh cookie is a *third-party cookie*. `SameSite=Strict` will never be sent cross-site, and `SameSite=None` gets blocked by Safari ITP. Your auth will work locally and silently break in production.

**Decision:** buy one cheap domain immediately and use subdomains:

| Service | Host | Domain |
|---|---|---|
| Next.js frontend | Vercel | `www.yourshop.com` |
| Express API | Render/Railway | `api.yourshop.com` |
| DB | MongoDB Atlas | n/a |
| Images | Cloudinary | CDN URLs |

Cookie config on the API: `Domain=.yourshop.com; HttpOnly; Secure; SameSite=Lax`. Lax (not Strict) so the cookie survives top-level navigations; the refresh endpoint is CSRF-safe because it only issues tokens to your CORS-locked origin and does nothing state-changing beyond that.

**Alternative (also acceptable):** proxy the API through Next.js `rewrites` so the browser only ever talks to one origin. Pick one; don't mix.

Also on the API: `app.set('trust proxy', 1)` — Render/Railway sit behind a proxy, and without this the rate limiter sees one shared IP and throttles everyone.

---

## 2. Repo & Project Structure

```
ecommerce-platform/
├── client/                      # Next.js app
│   ├── app/
│   │   ├── (shop)/
│   │   │   ├── page.tsx                     # Home
│   │   │   ├── collections/[slug]/page.tsx  # Category listing (ISR)
│   │   │   ├── products/[slug]/page.tsx     # PDP (ISR)
│   │   │   ├── cart/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── search/page.tsx
│   │   ├── (account)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── verify-email/page.tsx        # NEW
│   │   │   ├── forgot-password/page.tsx     # NEW
│   │   │   ├── reset-password/page.tsx      # NEW
│   │   │   ├── account/page.tsx
│   │   │   ├── account/orders/page.tsx
│   │   ├── sitemap.ts                       # NEW
│   │   ├── robots.ts                        # NEW
│   │   ├── layout.tsx
│   ├── components/
│   │   ├── layout/ (Header, MegaMenu, Footer, CartDrawer)
│   │   ├── product/ (ProductCard, ProductGrid, QuickAdd, VariantSelector)
│   │   ├── ui/ (Button, Badge, Skeleton, Modal)
│   ├── lib/ (api.ts, auth.ts, money.ts)     # money.ts: paisa → "Rs 1,999" formatting
│   ├── store/ (cartStore.ts, wishlistStore.ts — Zustand)
│   ├── types/
│   ├── middleware.ts
│   └── next.config.js
│
├── server/                      # Express API
│   ├── src/
│   │   ├── config/ (db.ts, env.ts, cloudinary.ts)
│   │   ├── models/ (User.ts, Product.ts, Category.ts, Order.ts, Cart.ts, Review.ts, WebhookEvent.ts)
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/ (auth.ts, errorHandler.ts, rateLimiter.ts, validate.ts)
│   │   ├── services/
│   │   │   ├── emailService.ts
│   │   │   ├── payments/
│   │   │   │   ├── PaymentProvider.ts       # interface
│   │   │   │   ├── PayFastProvider.ts       # (or Safepay/Simpaisa — pick one)
│   │   │   │   ├── CodProvider.ts           # cash on delivery
│   │   │   │   └── index.ts                 # provider registry
│   │   ├── utils/ (jwt.ts, hashPassword.ts, apiFeatures.ts, orderNumber.ts)
│   │   ├── validators/ (zod schemas)
│   │   └── app.ts
│   ├── server.ts
│   └── package.json
│
└── docs/ (API.md, schema diagrams, ADRs — write down the 3 locked decisions)
```

---

## 3. Money Handling (NEW — non-negotiable)

- **All amounts are integers in paisa** (`199900` = Rs 1,999.00) in Mongo, in the API, in webhooks. Floats give you `1999.9999999` errors the moment you do arithmetic.
- Format to rupees only at the display edge (`lib/money.ts` on the client; email templates on the server).
- Zod validators reject non-integer amounts on every write path.

---

## 4. Database Schema (MongoDB / Mongoose)

### User
```
{
  name, email (unique, indexed), passwordHash,
  role: enum['customer','admin'],
  addresses: [{ label, street, city, country, phone, isDefault }],
  wishlist: [ObjectId ref Product],
  refreshTokenHash,                 // rotated on every refresh — see §6
  isVerified, verifyTokenHash, verifyTokenExpires,     // NEW
  resetTokenHash, resetTokenExpires,                   // NEW
  createdAt
}
```

### Category (self-referencing for mega-menu nesting)
```
{ name, slug (unique), parent: ObjectId ref Category (null = top level),
  image, order, isFeatured }
```

### Product
```
{
  title, slug (unique, indexed), description,
  category: ObjectId ref Category,
  basePricePaisa, salePricePaisa, currency: 'PKR',     // integers
  images: [String],
  variants: [{ size, color, sku, stock, priceOverridePaisa }],
  tags: [String], rating: { avg, count },
  isActive, isNewIn, isFeatured, createdAt
}
```
Indexes: `{ title: 'text', tags: 'text' }` for search (fine to start; upgrade path = Atlas Search when relevance starts to matter). `category + isActive` for listing queries.

### Cart (server-side = logged-in users only; see §7)
```
{ user: ObjectId (required),
  items: [{ product: ObjectId, variantSku, qty, priceAtAddPaisa }],
  updatedAt }
```
`priceAtAdd` is display-only. Checkout always recomputes from live Product prices server-side.

### Order
```
{
  orderNumber: String (unique, human-readable, e.g. "ORD-2026-000481"),   // NEW
  user, items: [snapshot: product, title, variantSku, qty, unitPricePaisa],
  shippingAddress,
  subtotalPaisa, shippingPaisa, totalPaisa,
  paymentMethod: enum['gateway','cod'],                                   // NEW
  paymentStatus: enum['pending','paid','failed','refunded'],
  paymentRef, paymentProvider,
  orderStatus: enum['processing','shipped','delivered','cancelled'],
  createdAt
}
```
`paymentStatus` and `orderStatus` are independent state machines — COD orders ship while `paymentStatus='pending'` and flip to `'paid'` on delivery.

### Review
```
{ product, user, order: ObjectId ref Order,   // NEW — proof of purchase
  rating (1-5), comment, isApproved, createdAt }
```
Rule: a user may review a product only if they have a delivered order containing it. One review per user per product (compound unique index).

### WebhookEvent (NEW — idempotency)
```
{ provider, eventId (unique), payload, processedAt }
```

---

## 5. Payments (REWRITTEN)

**Reality check:** Stripe does not onboard Pakistani-registered businesses, and for a PKR domestic store it's the wrong tool anyway — the market runs on JazzCash/Easypaisa wallets, cards via local gateways, and COD.

**Design:**

```ts
interface PaymentProvider {
  createPaymentIntent(order: Order): Promise<{ redirectUrl?: string; ref: string }>;
  verifyWebhook(req: Request): Promise<{ eventId: string; ref: string; status: 'paid'|'failed' }>;
  refund?(order: Order): Promise<void>;
}
```

- Implement **`CodProvider` first** (trivial: no redirect, order goes straight to `processing`/`pending`). This unblocks the entire checkout flow in Phase 4 without any gateway paperwork.
- Then integrate **one** local gateway — PayFast, Safepay, or Simpaisa (all cover cards + JazzCash + Easypaisa; check current sandbox quality and Shopify-era docs before choosing). Merchant onboarding takes days-to-weeks, so **apply for the sandbox/merchant account in Week 1**, in parallel.
- Endpoint is generic: `POST /api/webhooks/payments/:provider` — never `/webhooks/stripe`.
- **Webhook rules:**
  1. Verify signature (provider-specific).
  2. Insert `WebhookEvent` with unique `eventId`; on duplicate-key error, return 200 and stop (gateways retry — this makes retries harmless).
  3. Mark order paid **only here**, never from a frontend redirect/return URL. The return URL just shows "confirming your payment…" and polls order status.

The provider abstraction is itself a portfolio talking point: "gateway-agnostic payment layer" reads better to clients than "I integrated Stripe."

---

## 6. Auth Flow (EXPANDED)

1. **Register** → bcrypt hash (cost 12) → create user with `isVerified=false` → email a verification link (hashed token, 24h expiry). Unverified users can browse and cart but not check out.
2. **Login** → verify hash → issue **short-lived access JWT (15 min)** returned in body, held in memory/Zustand — *never* localStorage (XSS steals it instantly) — plus **refresh token** in an httpOnly, Secure, `SameSite=Lax`, `Domain=.yourshop.com` cookie (7d).
3. Protected requests: `Authorization: Bearer <accessToken>`.
4. **Silent refresh on app boot** (NEW): access token lives in memory, so every hard reload starts with none. On mount, call `/api/auth/refresh` once before rendering auth-dependent UI; show a skeleton, not a logged-out flash.
5. **Refresh token rotation** (NEW): every `/refresh` call issues a *new* refresh token and invalidates the old hash. A reused old token = likely theft → revoke the whole session family.
6. **Forgot/reset password** (NEW): `POST /api/auth/forgot` (always returns 200 — no email enumeration) → emailed hashed token, 1h expiry → `POST /api/auth/reset`. This is the first flow a client manually tests. Rate-limit both.
7. Logout → clear cookie, delete stored refresh hash.

---

## 7. Cart Strategy (NEW — one source of truth)

- **Guest:** cart lives client-side only (Zustand + `persist` to localStorage — cart contents are not sensitive, unlike tokens). No server cart, no sessionId plumbing.
- **On login/register:** POST the local cart to `POST /api/cart/merge`; server merges (sum quantities, cap at stock), responds with the canonical cart; client replaces local state with the response.
- **Logged in:** server cart is authoritative. Mutations go through the API with optimistic UI updates, rolled back on error.
- **At checkout:** server ignores all client prices, rebuilds line items from the DB, and validates stock.

---

## 8. Inventory & Order Creation (NEW)

Order creation (`POST /api/orders`) must prevent overselling under concurrency:

```
for each item:
  Product.updateOne(
    { _id, 'variants.sku': sku, 'variants.stock': { $gte: qty } },
    { $inc: { 'variants.$.stock': -qty } }
  )
  → if modifiedCount === 0: abort, restock already-decremented items, return 409 "out of stock"
```

(Or wrap the loop in a Mongo transaction — Atlas supports them — for cleaner rollback.)

- Gateway orders that stay `pending` > 30 min: a small cron/scheduled job cancels them and restores stock, so abandoned checkouts don't strand inventory.
- Order gets its human-readable `orderNumber` here (counter collection or date+sequence).

---

## 9. API Endpoints (Express)

**Auth**
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout`
- `POST /api/auth/verify-email` · `POST /api/auth/forgot` · `POST /api/auth/reset`  *(NEW)*

**Products**
- `GET /api/products?category=&page=&limit=&sort=&search=`
- `GET /api/products/:slug`
- `POST /api/products` · `PATCH /api/products/:id` · `DELETE /api/products/:id` (admin)

**Categories**
- `GET /api/categories` (nested tree, cached — powers the mega-menu)
- `POST /api/categories` (admin)

**Cart** (auth required)
- `GET /api/cart` · `POST /api/cart/items` · `PATCH /api/cart/items/:sku` · `DELETE /api/cart/items/:sku`
- `POST /api/cart/merge` *(NEW)*

**Orders / Checkout**
- `POST /api/orders` → server recomputes totals from DB, decrements stock atomically, creates order, calls `PaymentProvider.createPaymentIntent`
- `GET /api/orders` · `GET /api/orders/:orderNumber`
- `POST /api/webhooks/payments/:provider` *(signature-verified, idempotent)*

**Reviews / Wishlist / Search** — standard CRUD; reviews gated on delivered orders.

---

## 10. Security Checklist (non-negotiable)

- [ ] `helmet()` secure headers
- [ ] `express-rate-limit` on auth + forgot/reset routes (5/15min) — **with `trust proxy` set**
- [ ] `express-mongo-sanitize` — blocks `{"$gt": ""}`-style NoSQL injection
- [ ] `zod` validation on every route, reject before DB
- [ ] CORS locked to `https://www.yourshop.com` exactly, `credentials: true`
- [ ] All prices/totals recomputed server-side at order creation — client amounts are never trusted
- [ ] All money = integer paisa
- [ ] Payment confirmation only via signature-verified, idempotent webhooks
- [ ] bcrypt only; verification/reset tokens stored hashed with expiry
- [ ] Image uploads: validate mimetype + size, Cloudinary signed uploads, never local disk
- [ ] HTTPS enforced; cookies `Secure`
- [ ] Secrets in `.env`, `.env.example` committed instead

---

## 11. Rendering & SEO Strategy (NEW)

This matters more to real clients than the mega-menu:

- **Product + category pages: ISR** (`revalidate: 300` to start). Admin product edits trigger **on-demand revalidation** (`revalidatePath`) — "edit in admin, live on the storefront in seconds" is a killer demo.
- **Home:** ISR. **Cart/checkout/account:** client-rendered (personal, no SEO value).
- `generateMetadata` per product/category: title, description, canonical, OG image (product photo).
- `sitemap.ts` from products + categories; `robots.ts`.
- JSON-LD structured data: `Product` (price, availability, rating) on PDPs, `BreadcrumbList` on collections.
- `next/image` throughout (Cloudinary loader) — this is most of your Lighthouse score.

---

## 12. Frontend UX Pieces (matching the reference pattern)

1. **Sticky header** — logo, mega-menu nav, search, wishlist count, cart icon+count
2. **Mega-menu** — hover/click → category/subcategory columns + promo tile (recursive render of the cached category tree)
3. **Hero banner** — swappable via a `banners` collection (image + link + active dates)
4. **Category tile grid** — homepage "shop by category"
5. **Product carousel** ("Trending") — `ProductCard` with quick-add
6. **ProductCard quick-add** — inline variant selector → add to cart without navigation (trickiest piece; build last, after basic add-to-cart works)
7. **Cart drawer** — slide-in panel, updates on every cart mutation (optimistic)
8. **PDP** — gallery, variant selector, stock-aware add-to-cart, verified-purchase reviews
9. **Filters/sort on collections** — price range, size, color, sort — server-side via query params, reflected in the URL (shareable/back-button-safe), never client-side array filtering

---

## 13. Build Order — Phased Roadmap (8 weeks part-time)

**Phase 0 — Decisions & accounts (Week 1, parallel with Phase 1)**
- Buy domain; set up Vercel/Render/Atlas/Cloudinary; wire subdomains + HTTPS early (deploying "hello world" to real domains in week 1 kills the entire class of it-works-locally bugs)
- **Apply for payment gateway sandbox/merchant account now** — onboarding lag is the long pole
- Write down the three locked decisions in `docs/ADR.md`

**Phase 1 — Foundations (Week 1)**
- Repo, Express boots, Mongo connects, Next.js + Tailwind scaffolded
- Category + Product models (paisa fields), seed script ~30 dummy products

**Phase 2 — Read-only storefront (Week 2)**
- `/api/products`, `/api/categories`
- Home, collection, PDP rendering real data **via ISR**, metadata + sitemap wired
- No auth, no cart — browsing works end to end on the real domain

**Phase 3 — Auth (Week 3)**
- Register/login/refresh/rotation both sides; silent refresh on boot
- Email verification + forgot/reset (use Resend/Mailgun sandbox)
- Protected route middleware; account page shell

**Phase 4 — Cart & Checkout with COD (Week 4–5)**
- Guest cart (local) + merge-on-login + server cart; cart drawer
- Checkout: address form → order creation with server-side recompute + atomic stock decrement
- **COD end to end first** — the full order lifecycle works with zero gateway dependency

**Phase 5 — Gateway payments (Week 5–6)**
- `PaymentProvider` interface + one local gateway in sandbox
- Idempotent webhook, pending-order expiry job, "confirming payment" return page

**Phase 6 — Polish & interactive pieces (Week 7)**
- Mega-menu, quick-add, wishlist, debounced search
- Skeletons, error/empty states, mobile pass

**Phase 7 — Admin + production hardening (Week 8)**
- Minimal admin (role-gated): product CRUD with Cloudinary upload + on-demand revalidation, order list with status updates
- Production env vars, rate limits verified behind proxy, backup check on Atlas
- Later: GitHub Actions CI (lint + build on PR) — good client-facing signal

If checkout slips (it usually does), cut from Phase 6, never from Phases 4–5.

---

## 14. Testing (add once core flow works)

- Backend: Jest + Supertest on **auth, order creation (incl. concurrent stock test), webhook idempotency** — the flows where bugs cost money
- Frontend: skip heavy testing initially; add Playwright for the checkout flow once stable

---

## 15. How This Maps to Your Goals

- **Web dev skill** — auth with rotation, real payment webhooks, inventory concurrency, ISR: genuinely senior topics, not tutorial material.
- **Freelance positioning** — "e-commerce platform with gateway-agnostic payments (cards + JazzCash/Easypaisa + COD), verified-purchase reviews, and an admin panel with live revalidation" is regionally credible in a way "Stripe demo store" is not — your local clients literally cannot use Stripe.
- **Content angle** — devlog per phase; the payment-abstraction and oversell-prevention posts are the two that will get engagement, because they're the two problems every PK store builder hits.
