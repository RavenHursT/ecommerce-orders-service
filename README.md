# E-Commerce Orders Service

**Live demo:** [EOS Orders Web](https://eos-orders-web.vercel.app/)

Monorepo for the Canals backend assessment — three NestJS REST APIs, a Vite React SPA, and shared Supabase (`cmrt` project, `eos` schema).

## Architecture

```
apps/orders-web      Vite + React — port 5173 (public UI)
apps/orders-api      NestJS — port 3001 (public API)
apps/warehouses-api  NestJS — port 3002 (internal)
apps/payments-api    NestJS — port 3003 (internal)
packages/database    Shared DB utilities + Prisma (eos schema)
packages/schemas     Shared Zod schemas
```

Database: **cmrt** Supabase project (`zyhntpqedmairqkpummv`), **`eos` Postgres schema** — isolated from cmrt's `public` schema (`comments`, etc.).

Copy connection strings from the cmrt Supabase Connect dialog into `.env.local` (same `DATABASE_URL` / `DIRECT_URL` as [cad-model-review-tool](https://github.com/RavenHursT/cad-model-review-tool)).

## Prerequisites

- Node.js >= 22
- pnpm 11.x

## Local Development

```bash
pnpm install
cp .env.example .env.local   # fill in real values (see Environment Variables)
pnpm dev
```

| App | URL |
| --- | --- |
| Orders Web | http://localhost:5173 |
| Orders API | http://localhost:3001 |
| Warehouses API | http://localhost:3002 |
| Payments API | http://localhost:3003 |

For the SPA, set `VITE_ORDERS_API_URL=http://localhost:3001` in `.env.local` (or `apps/orders-web/.env.local`). Set `CORS_ALLOWED_ORIGINS=http://localhost:5173` so the browser can call the Orders API.

## Health Checks

```bash
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3001/health
```

Orders `/health` cascades to Warehouses and Payments and reports `dependencies`.

## Verification

### API (local or production)

```bash
# Catalog (public BFF)
curl https://eos-orders-api.vercel.app/catalog/products

# Orders list
curl https://eos-orders-api.vercel.app/orders
```

### SPA checklist ([live demo](https://eos-orders-web.vercel.app/))

- [ ] Product catalog loads in the order form
- [ ] Submit a valid order (card not ending in `0000`)
- [ ] Order appears in the list after refresh
- [ ] Declined card (`0000` suffix) surfaces a payment failure
- [ ] Dark mode toggle persists after page refresh

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed database |

## Environment Variables

See [`.env.example`](.env.example). Copy to `.env.local` at the repo root (gitignored) and fill in real values from the cmrt Supabase Connect dialog and your local service URLs.

| Variable | Used by |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | All APIs (shared cmrt connection) |
| `WAREHOUSES_API_URL`, `PAYMENTS_API_URL` | Orders API |
| `INTERNAL_API_KEY` | All APIs (inter-service auth) |
| `GOOGLE_MAPS_API_KEY` | Warehouses API |
| `CORS_ALLOWED_ORIGINS` | Orders API (comma-separated browser origins) |
| `VITE_ORDERS_API_URL` | Orders Web (build-time API base URL) |

For Vercel Queues local testing, merge OIDC tokens via `vercel env pull` from each linked app directory.

## Deployment

Four separate Vercel projects:

| Project | Root directory | Production URL |
| --- | --- | --- |
| `eos-orders-web` | `apps/orders-web` | https://eos-orders-web.vercel.app |
| `eos-orders-api` | `apps/orders-api` | https://eos-orders-api.vercel.app |
| `eos-warehouses-api` | `apps/warehouses-api` | https://eos-warehouses-api.vercel.app |
| `eos-payments-api` | `apps/payments-api` | https://eos-payments-api.vercel.app |

Deploy APIs from the repo root with `--project <name>`. The SPA build is scoped to `@repo/schemas` + `@repo/orders-web` (see `apps/orders-web/vercel.json`).

## CI

- **Quality** (`.github/workflows/quality.yml`) — lint, typecheck, and build on push/PR to `main`
- **Migrate** (`.github/workflows/migrate.yml`) — applies Prisma migrations when schema changes land on `main` (requires `DATABASE_URL` / `DIRECT_URL` GitHub secrets)
