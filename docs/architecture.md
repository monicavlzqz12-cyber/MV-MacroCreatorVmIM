# Architecture

## Executive Summary

Store Builder is a multi-store SaaS platform that allows a single administrative team to create,
configure, and operate multiple independent storefronts from one admin panel. The platform is
admin-first: there is no customer self-registration for store owners. All stores, products,
orders, and configuration are managed by authenticated admin users. Each storefront is publicly
accessible by customers without login; only the admin panel requires authentication.

The system is designed to support a small-to-medium business operator that manages anywhere from
one to dozens of stores, each with independent branding, product catalogs, pricing, promotions,
and email configuration. Stores share the same database instance but are fully isolated at the
data layer via a `storeId` foreign key on every entity.

---

## Monorepo Structure

```
store-builder/
├── apps/
│   ├── admin/                  # Next.js 14 App Router — admin panel (port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, session management
│   │   │   ├── (dashboard)/    # Top-level dashboard
│   │   │   └── stores/
│   │   │       └── [storeId]/
│   │   │           ├── settings/
│   │   │           ├── products/
│   │   │           ├── categories/
│   │   │           ├── collections/
│   │   │           ├── orders/
│   │   │           ├── customers/
│   │   │           ├── promotions/
│   │   │           ├── coupons/
│   │   │           ├── email/
│   │   │           └── theme/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   └── package.json
│   └── storefront/             # Next.js 14 App Router — public storefront (port 3001)
│       ├── app/
│       │   └── [slug]/         # Each store served under its slug
│       │       ├── page.tsx    # Storefront home
│       │       ├── products/
│       │       ├── categories/
│       │       ├── collections/
│       │       ├── cart/
│       │       └── checkout/
│       ├── components/
│       ├── lib/
│       └── package.json
├── packages/
│   ├── database/               # Prisma schema, client, migrations, seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts        # Re-exports PrismaClient singleton
│   │   └── package.json
│   ├── validators/             # Zod schemas shared across admin + storefront
│   │   ├── src/
│   │   │   ├── store.ts
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── cart.ts
│   │   │   ├── promotion.ts
│   │   │   └── index.ts
│   │   └── package.json
│   ├── types/                  # Shared TypeScript types & interfaces
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   ├── email/                  # Nodemailer wrapper + template renderer
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   ├── templates/
│   │   │   └── index.ts
│   │   └── package.json
│   └── ui/                     # Shared shadcn/ui components (optional)
│       ├── src/
│       └── package.json
├── docs/
│   ├── architecture.md
│   ├── feature-matrix.md
│   ├── decisions.md
│   └── progress.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .env.example
├── .gitignore
└── .prettierrc
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Monorepo tooling | Turborepo | ^2.0.6 | Task orchestration, caching |
| Package manager | pnpm | ^9.5.0 | Workspace management, fast installs |
| Language | TypeScript | ^5.5.2 | Type safety across all packages |
| Admin app | Next.js (App Router) | 14.x | Admin panel SSR + API routes |
| Storefront app | Next.js (App Router) | 14.x | Public storefront SSR |
| Styling | Tailwind CSS | ^3.x | Utility-first CSS |
| Component library | shadcn/ui | latest | Accessible, composable UI primitives |
| ORM | Prisma | ^5.x | Database access, migrations, type gen |
| Database | PostgreSQL | ^16.x | Primary relational store |
| Validation | Zod | ^3.x | Runtime + compile-time schema validation |
| Forms | React Hook Form | ^7.x | Performant form state management |
| Server state | TanStack Query | ^5.x | Server state, caching, mutations |
| Auth | next-auth v4 | ^4.x | Credential-based session auth for admin |
| Email | Nodemailer | ^6.x | SMTP email delivery |
| Password hashing | bcryptjs | ^2.x | Secure password storage |
| HTML sanitization | sanitize-html | ^2.x | XSS prevention on HTML inputs |
| Formatting | Prettier | ^3.3.2 | Consistent code formatting |

---

## Architecture Decisions

### Why a Monorepo

All apps and packages share a common Prisma schema, Zod validators, TypeScript types, and email
utilities. A monorepo eliminates the need to publish internal packages to a registry, ensures
atomic refactors across boundaries, and allows Turborepo to only rebuild what has changed. pnpm
workspaces provide fast, deduplicated installs with strict isolation between packages.

### Why Next.js for Both Admin and Storefront

Using Next.js App Router for both apps provides SSR for the storefront (critical for SEO and
initial load performance), server actions for form submissions, a unified file-based routing
convention, and a shared deployment model. Both apps benefit from the same ecosystem of React
server components, streaming, and optimized image handling. Maintaining one framework across
both apps significantly reduces cognitive overhead.

### Why PostgreSQL

The data model is inherently relational: stores own products, products belong to categories,
orders reference products, promotions apply to orders, etc. PostgreSQL provides referential
integrity through foreign keys, ACID transactions for order placement and inventory decrement,
and JSONB columns for flexible per-store configuration without schema migrations for each new
setting. It is the most well-supported database for Prisma and the natural choice for this
workload.

### Why Separate Admin and Storefront Apps

Separating concerns into two Next.js apps provides independent deployment, independent scaling,
and a hard security boundary between the admin surface and the public surface. The admin app
can be placed behind a VPN or IP allowlist without affecting storefront availability. Build
caches are independent, so a storefront deploy does not require rebuilding admin assets.

---

## Data Model Overview

The following entities form the core data model. All entities scoped to a store include a
`storeId` foreign key.

### Platform

| Model | Description |
|---|---|
| `AdminUser` | Platform-level admin accounts with hashed passwords and role assignments |

### Store Management

| Model | Description |
|---|---|
| `Store` | Top-level entity. Has a unique `slug` used for storefront routing |
| `StoreConfig` | JSONB column holding SMTP overrides, currency, timezone, locale, checkout options |
| `StoreTheme` | JSONB column holding colors, fonts, logo, banner, and preset name |
| `CartConfig` | JSONB column holding cart type (drawer/modal/page), upsell rules |

### Catalog

| Model | Description |
|---|---|
| `Category` | Hierarchical product categories (self-referential parent/children) |
| `Collection` | Curated product groupings (featured, seasonal, sale, etc.) |
| `Product` | Core product with title, description, price, compareAtPrice, images, SEO fields |
| `ProductVariant` | SKU-level variant with options (size, color, etc.), price override, stock |
| `ProductImage` | Ordered images attached to a product |

### Commerce

| Model | Description |
|---|---|
| `Cart` | Anonymous server-side cart identified by a token stored in a cookie |
| `CartItem` | Line items in a cart referencing a ProductVariant |
| `Order` | Placed order with status, totals, billing/shipping address, and payment details |
| `OrderItem` | Snapshot of product/variant at time of order placement |
| `OrderTimeline` | Append-only log of status changes and admin notes |

### Promotions

| Model | Description |
|---|---|
| `Promotion` | Auto-applied discount rule: percentage or fixed, with optional conditions |
| `Coupon` | Code-based discount with usage limits, expiry, and minimum order value |

### Payments

| Model | Description |
|---|---|
| `PaymentMethod` | Admin-configured payment option (bank transfer, manual, custom HTML instructions) |

### Email

| Model | Description |
|---|---|
| `EmailTemplate` | Per-store email template for order confirmed, payment received, shipped, etc. |

---

## Multi-Store Routing

### Admin Routing

All store-specific admin pages are nested under `/stores/[storeId]/`. A top-level dashboard at
`/` shows an overview across all stores. The `[storeId]` segment is a UUID. Navigation within a
store always carries the storeId in the URL, making it safe to have multiple browser tabs open
for different stores simultaneously.

```
/                                  → Dashboard (all stores)
/stores                            → Store list
/stores/new                        → Create store
/stores/[storeId]                  → Store overview
/stores/[storeId]/settings         → Store config, theme, cart config
/stores/[storeId]/products         → Product list
/stores/[storeId]/products/new     → Create product
/stores/[storeId]/products/[id]    → Edit product
/stores/[storeId]/categories       → Category management
/stores/[storeId]/collections      → Collection management
/stores/[storeId]/orders           → Order list
/stores/[storeId]/orders/[id]      → Order detail + timeline
/stores/[storeId]/customers        → Customer list
/stores/[storeId]/promotions       → Promotion rules
/stores/[storeId]/coupons          → Coupon codes
/stores/[storeId]/email            → Email templates
/stores/[storeId]/theme            → Theme editor
```

### Storefront Routing

Each store is served under its slug. The storefront app handles the `[slug]` dynamic segment
and resolves the store from the database, then renders the appropriate layout using that store's
theme configuration.

```
/[slug]                            → Store home
/[slug]/products                   → Product listing
/[slug]/products/[handle]          → Product detail
/[slug]/categories/[handle]        → Category listing
/[slug]/collections/[handle]       → Collection listing
/[slug]/cart                       → Cart page (if cart type = page)
/[slug]/checkout                   → Checkout flow
/[slug]/checkout/confirmation      → Order confirmation
```

---

## Security Approach

### Authentication

The admin panel is protected by next-auth v4 with a credentials provider. All admin routes
are wrapped in a server-side auth guard that redirects unauthenticated requests to `/login`.
Sessions are JWT-based with a configurable expiry. Passwords are hashed with bcryptjs (cost
factor 12) before storage.

### Input Validation

Every API route boundary (both Next.js route handlers and server actions) validates its input
against a Zod schema before any database access. Invalid inputs return a structured 400 response.
This applies to both admin-originated requests and storefront-originated requests (cart
operations, checkout submissions).

### HTML Sanitization

Any user-supplied HTML — specifically payment method instruction blocks and custom email content
blocks — is passed through `sanitize-html` with a strict allowlist before storage and before
rendering. The allowlist permits only safe presentational tags (`p`, `b`, `i`, `u`, `a`,
`ul`, `ol`, `li`, `br`, `strong`, `em`) and safe attributes (`href` with `http`/`https`
protocol only). This prevents stored XSS from reaching storefront customers.

### Sensitive Configuration Encryption

Per-store SMTP credentials and any other sensitive config values stored in `StoreConfig` are
encrypted at rest using AES-256-GCM with the `ENCRYPTION_KEY` environment variable as the key
material. The encryption/decryption utilities live in `packages/database/src/crypto.ts`.

---

## Environment Variables

| Variable | App | Description |
|---|---|---|
| `DATABASE_URL` | Both (via packages/database) | PostgreSQL connection string |
| `NEXTAUTH_URL` | Admin | Canonical URL for next-auth callbacks |
| `NEXTAUTH_SECRET` | Admin | JWT signing secret |
| `ADMIN_DEFAULT_EMAIL` | Admin | Seeded superadmin email |
| `ADMIN_DEFAULT_PASSWORD` | Admin | Seeded superadmin password (change immediately) |
| `NEXT_PUBLIC_STOREFRONT_URL` | Admin | Used to generate storefront preview links |
| `ADMIN_API_URL` | Storefront | Internal API URL for SSR data fetching |
| `UPLOAD_PROVIDER` | Admin | `local` or `s3` |
| `UPLOAD_LOCAL_DIR` | Admin | Local upload directory |
| `S3_BUCKET` / `S3_REGION` / etc. | Admin | S3-compatible storage config |
| `SMTP_HOST` / `SMTP_PORT` / etc. | Admin (via packages/email) | Global fallback SMTP |
| `ENCRYPTION_KEY` | Both | 64-char hex key for AES-256-GCM encryption |

---

## Build Pipeline

Turborepo orchestrates all tasks with dependency awareness:

1. `pnpm install` — installs all workspace dependencies
2. `turbo run db:generate` — generates Prisma client in `packages/database`
3. `turbo run db:migrate` — runs Prisma migrations against `DATABASE_URL`
4. `turbo run build` — builds all packages, then apps (respecting `^build` dependency)
5. `turbo run dev` — starts all apps concurrently in watch mode

Build artifacts are cached by Turborepo. A change to `packages/validators` will only trigger
rebuilds of packages and apps that depend on it, not the entire workspace.

---

## Deployment Topology

In production the recommended topology is:

- **Admin app** — deployed to a Node.js-compatible platform (Vercel, Railway, Fly.io, VPS).
  Accessible only to internal team. Can be placed behind Cloudflare Access or IP allowlist.
- **Storefront app** — deployed to the same or a separate Node.js platform. Publicly accessible.
  Benefits from edge caching for product pages.
- **PostgreSQL** — managed PostgreSQL instance (Neon, Supabase, Railway, RDS). SSL required.
- **File storage** — local disk for development, S3-compatible bucket for production.
- **Email** — any SMTP provider (Postmark, SendGrid, AWS SES, or self-hosted Postfix).

Both apps read `DATABASE_URL` from environment and share the same database. In a high-traffic
scenario the storefront can be given a read-replica connection string for product/category
queries while order writes continue to the primary.
