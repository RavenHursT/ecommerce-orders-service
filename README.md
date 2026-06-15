# E-Commerce Orders Service

Monorepo for the Canals backend assessment — three NestJS REST APIs with shared Supabase (`cmrt` project, `eos` schema).

## Architecture

```
apps/orders-api      NestJS — port 3001 (public)
apps/warehouses-api  NestJS — port 3002 (internal)
apps/payments-api    NestJS — port 3003 (internal)
packages/database    Shared DB utilities + Prisma (eos schema)
packages/schemas     Shared Zod schemas (Phase 2+)
```

Database: **cmrt** Supabase project (`zyhntpqedmairqkpummv`), **`eos` Postgres schema** — isolated from cmrt's `public` schema (`comments`, etc.).

Copy connection strings from the cmrt Supabase Connect dialog into `.env.local` (same `DATABASE_URL` / `DIRECT_URL` as [cad-model-review-tool](https://github.com/RavenHursT/cad-model-review-tool)).

## Prerequisites

- Node.js >= 22
- pnpm 11.x

## Local Development

```bash
pnpm install
cp .env.example .env.local   # fill in cmrt DATABASE_URL / DIRECT_URL
pnpm dev
```

| App | URL |
| --- | --- |
| Orders | http://localhost:3001 |
| Warehouses | http://localhost:3002 |
| Payments | http://localhost:3003 |

## Health Checks

```bash
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3001/health
```

Orders `/health` cascades to Warehouses and Payments and reports `dependencies`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start all apps |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm db:generate` | Generate Prisma client |

## Environment Variables

See [`.env.example`](.env.example). Copy to `.env.local` (gitignored) with real values from the cmrt Supabase Connect dialog.

## Deployment

Three separate Vercel projects: `eos-orders-api`, `eos-warehouses-api`, `eos-payments-api` (root directories under `apps/`).
