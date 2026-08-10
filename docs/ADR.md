# Architecture Decision Record — H.

Three decisions locked before any code was written, because they're expensive to retrofit later.

## ADR-001: Money is stored as integer paisa everywhere

**Decision:** Every monetary amount — in MongoDB, in API payloads, in webhooks — is an
integer number of paisa (`199900` = Rs 1,999.00). Never a float.

**Why:** Floating-point arithmetic on currency produces errors like `1999.9999999`
the moment you add a discount or tax. Integers avoid the whole class of bug.

**Where it applies:**
- All `*Paisa` fields on `Product`, `Cart`, `Order` schemas (server).
- `client/lib/money.ts` is the *only* place paisa is converted to a display string
  (`"Rs 1,999"`). Nowhere else formats currency.
- Zod validators reject non-integer amounts on every write path.

## ADR-002: Single apex domain for frontend + API

**Decision:** Frontend and API are deployed under one apex domain via subdomains
(`www.hstore.pk` for Next.js, `api.hstore.pk` for Express), not two unrelated
hosts (e.g. `*.vercel.app` + `*.onrender.com`).

**Why:** Cross-site cookies break auth. `SameSite=Strict` refresh cookies never
get sent cross-site; `SameSite=None` gets blocked by Safari ITP. This works
fine in local dev and silently breaks in production — the worst kind of bug.

**Where it applies:**
- Refresh-token cookie: `Domain=.hstore.pk; HttpOnly; Secure; SameSite=Lax`.
- CORS on the API locked to `https://www.hstore.pk` exactly, `credentials: true`.
- Alternative considered and rejected for now: proxying the API through Next.js
  `rewrites` so the browser only ever talks to one origin. Revisit if subdomain
  cookie config gives trouble in staging.

## ADR-003: Payments behind a `PaymentProvider` interface

**Decision:** Controllers never call a payment gateway SDK directly. All payment
flows go through `PaymentProvider` (`createPaymentIntent`, `verifyWebhook`,
optional `refund`), with `CodProvider` implemented first and a local gateway
(PayFast/Safepay/Simpaisa — TBD) added behind the same interface.

**Why:** Stripe doesn't onboard Pakistani-registered businesses, and for a PKR
domestic store it's the wrong tool regardless — the market runs on
JazzCash/Easypaisa wallets, local-gateway cards, and COD. Building the
abstraction now means gateway selection/onboarding delay never blocks
checkout development (COD ships the whole order lifecycle first).

**Where it applies:**
- `server/src/services/payments/PaymentProvider.ts` — the interface.
- `server/src/services/payments/CodProvider.ts` — trivial, no redirect.
- `server/src/services/payments/index.ts` — provider registry, looked up by
  `order.paymentMethod`.
- Webhook endpoint is generic: `POST /api/webhooks/payments/:provider`, never
  a provider-specific path.

---

## Status log

- 2026-08-08 — Phase 0/1: decisions locked, repo scaffolded. Brand: **H.**
  Reference for UX patterns only (mega-menu, quick-add, cart drawer):
  junaidjamshed.com structure — no JJ assets, copy, or product data used.
