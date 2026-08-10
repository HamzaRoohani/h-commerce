# H. — E-Commerce Platform

Pakistan-market e-commerce storefront. Next.js frontend, Express/MongoDB API,
mega-menu retail UX (structure/UX pattern only — see [docs/ADR.md](docs/ADR.md)
for why, and why no assets/copy are shared with any reference site).

## Structure

```
client/   Next.js 14 (App Router) storefront + account
server/   Express API + MongoDB (Mongoose)
docs/     ADRs, API docs, schema notes
```

## Local development

Prerequisites: Node.js LTS, MongoDB running locally (or an Atlas connection string).

```bash
# server
cd server
cp .env.example .env   # fill in MONGODB_URI etc.
npm install
npm run dev

# client (separate terminal)
cd client
cp .env.example .env.local
npm install
npm run dev
```

Server defaults to `http://localhost:5000`, client to `http://localhost:3000`.

## Build plan

Full phased roadmap lives in the original planning doc (8-week part-time plan,
Phase 0 → Phase 7). Current phase: **Phase 1 — Foundations**.
