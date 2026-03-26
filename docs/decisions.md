# Architecture Decision Records

This document records the key architectural decisions made during the design and implementation
of Store Builder. Each ADR captures the context, the options considered, the decision made,
and the rationale. Decisions are immutable once recorded; superseding decisions reference the
ADR they replace.

---

## ADR-001: Turborepo + pnpm Monorepo

**Date:** 2026-03-26
**Status:** Accepted

### Context

Store Builder consists of two Next.js applications (admin, storefront) and several shared
packages (database, validators, types, email, ui). These packages need to be shared without
publishing to npm. The development workflow needs atomic refactors, a single test run across
all packages, and fast CI.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Nx** | Feature-rich, generator support, good caching | Steep learning curve, opinionated project structure, heavy configuration |
| **Lerna** | Well-known, simple versioning | Slow without additional caching layer, effectively superseded by Turborepo for task running |
| **No monorepo (separate repos)** | Full isolation, independent deployments | Duplicate dependencies, no shared packages without publishing, painful cross-repo refactors |
| **Turborepo + pnpm** | Fast task caching, minimal config, pnpm workspace native support, Vercel-maintained | Fewer generators than Nx (not needed here) |

### Decision

Use Turborepo for task orchestration with pnpm workspaces for package management.

### Rationale

Turborepo's `turbo.json` task graph requires minimal configuration for our use case. pnpm
provides strict `node_modules` isolation (packages cannot accidentally import undeclared
dependencies), fast installs via content-addressed storage, and native workspace support.
The combination is the current industry standard for TypeScript monorepos and has excellent
Next.js ecosystem support. Turborepo's remote caching is available as a future optimisation
for CI speed without any code changes.

---

## ADR-002: Next.js 14 App Router for Both Admin and Storefront

**Date:** 2026-03-26
**Status:** Accepted

### Context

The platform requires two distinct web applications: an admin panel (authenticated, form-heavy,
data management) and a storefront (public-facing, SEO-critical, performance-sensitive). We need
to choose frameworks for both.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Remix for storefront, Next.js for admin** | Remix has excellent loader/action model | Two frameworks to maintain, different routing conventions, split ecosystem |
| **React SPA (Vite) + Express API** | Simple mental model, full control | No SSR for storefront (poor SEO), no server components, need to build API from scratch |
| **Nuxt / SvelteKit** | Good SSR | Requires Vue/Svelte knowledge, different ecosystem from React |
| **Next.js App Router for both** | Unified framework, SSR + SSG + ISR, server actions, server components, shared React ecosystem | App Router is relatively new (learning curve for team unfamiliar with RSC) |

### Decision

Use Next.js 14 with App Router for both the admin and storefront applications.

### Rationale

Using the same framework for both apps means one set of conventions, one deployment model,
and shared knowledge. The App Router's server components eliminate unnecessary client-side
JavaScript in the storefront (benefiting Core Web Vitals). Server actions simplify form
handling in the admin without needing a separate API layer for simple mutations. The admin
and storefront can share components from `packages/ui`. Next.js has the largest React SSR
ecosystem, the best Next.js-to-Vercel/Railway deployment story, and excellent TypeScript
support out of the box.

---

## ADR-003: PostgreSQL + Prisma

**Date:** 2026-03-26
**Status:** Accepted

### Context

The platform has a clearly relational data model: stores own products, products belong to
categories, orders reference product variants, promotions apply to orders, etc. We need to
choose a database and an ORM/query layer.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **MongoDB + Mongoose** | Flexible schema, easy document nesting | Poor relational integrity, harder to enforce consistency across related entities, no native JOIN support |
| **PostgreSQL + Drizzle ORM** | Excellent TypeScript types, SQL-first, lightweight | Younger ecosystem, fewer official integrations, migration story less mature than Prisma |
| **PostgreSQL + raw SQL (pg)** | Full control, no ORM abstraction | Verbose, no type generation, migration management is manual |
| **PostgreSQL + Prisma** | Auto-generated types, intuitive schema DSL, migration system, JSONB support, excellent Next.js integration | Slightly less performant than raw SQL for complex queries (mitigated by `$queryRaw` escape hatch) |

### Decision

Use PostgreSQL as the primary database with Prisma as the ORM.

### Rationale

PostgreSQL enforces referential integrity via foreign keys, supports ACID transactions
(critical for atomic order placement + inventory decrement), and provides JSONB columns for
storing flexible per-store configuration without requiring schema migrations every time a new
config option is added. Prisma generates TypeScript types directly from the schema, eliminating
a whole class of type mismatch bugs. Prisma Migrate provides a reproducible, version-controlled
migration history. The `@prisma/client` singleton pattern integrates cleanly with Next.js
server components and route handlers.

---

## ADR-004: No Auto-Registration for Store Owners

**Date:** 2026-03-26
**Status:** Accepted

### Context

The platform is operated by a single administrative team. We need to decide whether store
owners (i.e., the people managing stores) can self-register or whether accounts must be
created by a platform admin.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Self-registration with email verification** | Scales without manual intervention | Requires email verification flow, account management UI, billing integration, abuse prevention |
| **Invitation-only registration** | Controlled access, still automated | Requires invitation system, token management, email sending on invite |
| **Admin-only account creation** | Simplest auth model, full control, no public registration surface | Does not scale to public SaaS without changes |

### Decision

All admin user accounts are created by a platform superadmin. There is no public registration
page.

### Rationale

Store Builder is designed for internal use or for a managed service where the platform operator
onboards clients manually. Removing self-registration eliminates the need for email verification
flows, account lockout/recovery UI, abuse prevention (rate limiting registration, CAPTCHA), and
billing integration. The auth model is dramatically simpler: one credentials provider, one user
table, admin-managed accounts. This decision can be revisited when moving toward a public SaaS
model (see ADR-010 for email template approach that supports future notification emails).

---

## ADR-005: next-auth v4 Credentials Provider for Admin Authentication

**Date:** 2026-03-26
**Status:** Accepted

### Context

The admin panel requires session-based authentication. We need a secure, maintainable auth
solution.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Clerk** | Excellent DX, pre-built UI components, MFA, social login | External dependency, per-MAU pricing, data leaves our infrastructure |
| **Auth0** | Enterprise features, extensive protocol support | External dependency, pricing at scale, more configuration than needed |
| **Lucia Auth** | Lightweight, framework-agnostic | Requires more manual wiring than next-auth |
| **next-auth v5 (Auth.js)** | Newer API, better TypeScript types | Still in beta at time of decision, breaking changes from v4 |
| **next-auth v4 Credentials** | Mature, well-documented, integrates directly with Next.js, self-hosted | Credentials provider requires careful CSRF handling (handled by next-auth) |

### Decision

Use next-auth v4 with the CredentialsProvider, backed by bcryptjs password verification
against the `AdminUser` table.

### Rationale

next-auth v4 is mature, battle-tested, and has the largest Next.js community. The Credentials
provider gives us full control over the authentication logic while next-auth handles JWT
signing, session serialisation, CSRF tokens, and redirect flows. No external auth service
means no data leaves the infrastructure, no per-user pricing, and no dependency on a third-party
uptime. bcryptjs (cost factor 12) ensures passwords are stored securely. This is the right
choice for a self-hosted, admin-only application.

---

## ADR-006: Zod for Validation Everywhere

**Date:** 2026-03-26
**Status:** Accepted

### Context

The platform has multiple validation boundaries: admin form submissions, API route handlers,
server actions, storefront checkout inputs, and configuration parsing. We need a consistent
validation approach.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Yup** | Mature, wide adoption with React Hook Form | Less TypeScript-native, inference is weaker than Zod |
| **io-ts** | Strong type theory foundation | Verbose, steep learning curve, less practical |
| **Joi** | Mature, extensive rule set | Not TypeScript-first, types are separate from schema |
| **Manual type guards** | No dependencies | Verbose, error-prone, no reuse |
| **Zod** | TypeScript-first, excellent inference, composable, used with React Hook Form via `@hookform/resolvers/zod`, same schema for server + client | None significant |

### Decision

Use Zod for all validation: API inputs, form schemas, environment variable parsing, and
configuration objects.

### Rationale

Zod schemas defined in `packages/validators` are shared between the admin app, storefront app,
and API routes. A single schema definition provides both compile-time TypeScript types (via
`z.infer`) and runtime validation with structured error messages. The `@hookform/resolvers/zod`
integration allows React Hook Form to use the same schema for client-side validation that the
server uses for API validation. Environment variables are parsed at startup with `z.object`
schemas, failing fast with clear error messages if required variables are missing.

---

## ADR-007: sanitize-html for HTML Input Sanitization

**Date:** 2026-03-26
**Status:** Accepted

### Context

Several features require admin-authored HTML: payment method instruction blocks, custom email
content blocks, and custom storefront pages. This HTML is rendered to end customers, creating
a stored XSS risk if not sanitized.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **DOMPurify** | Excellent browser-side sanitization | Designed for browser DOM; requires jsdom for server-side use, adding weight |
| **No HTML input (markdown only)** | Eliminates XSS risk entirely | Limits legitimate formatting options; markdown rendering adds complexity |
| **Iframe sandbox** | Content isolated from parent page | Complex, poor UX, breaks within email clients |
| **sanitize-html** | Server-side, allowlist-based, widely used, Node.js native | Requires careful allowlist configuration |

### Decision

Use `sanitize-html` with a strict allowlist on all HTML inputs before storage.

### Rationale

`sanitize-html` runs server-side at the point of write (not read), so the database never
contains unsanitized HTML. The allowlist approach is conservative: only safe presentational
tags (`p`, `b`, `i`, `u`, `a`, `ul`, `ol`, `li`, `br`, `strong`, `em`, `h2`, `h3`) and
safe attributes (`href` restricted to `http`/`https` protocol, `class` restricted to a
named whitelist) are permitted. Script tags, event handlers (`onclick`, `onerror`, etc.),
`style` attributes with expressions, and `data:` URIs are all stripped. The sanitization
configuration is centralised in `packages/validators/src/sanitize.ts` to ensure consistent
application across all HTML-accepting fields.

---

## ADR-008: Store Config Stored as JSONB Columns in PostgreSQL

**Date:** 2026-03-26
**Status:** Accepted

### Context

Each store has a large and growing set of configuration options: SMTP credentials, currency,
timezone, locale, checkout options, social links, SEO defaults, cart configuration, and more.
We need a storage strategy that balances flexibility with queryability.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Separate column per config option** | Fully typed at schema level, easy to query | Requires a migration for every new config option; schema becomes unwieldy with dozens of columns |
| **Key-value store (Redis or separate table)** | Infinitely flexible | No type safety, hard to query all settings at once, additional infrastructure |
| **Separate config table with typed rows** | Relational, auditable | Complex queries, many rows per store, hard to enforce types |
| **JSONB column with Zod validation** | Flexible, no migration per new option, single row per store, Zod provides type safety at application layer | JSONB cannot enforce column-level constraints; validation is application-responsibility |

### Decision

Store per-store configuration in JSONB columns (`StoreConfig.config`, `StoreTheme.theme`,
`CartConfig.config`). All reads and writes are validated against Zod schemas.

### Rationale

Adding a new configuration option requires only a Zod schema update and a default value — no
database migration. PostgreSQL JSONB is efficiently indexed and queryable when needed. The
separation into three JSONB columns (`StoreConfig`, `StoreTheme`, `CartConfig`) provides
logical grouping without over-normalising. The application-layer Zod schema provides the type
safety that column definitions would normally provide. Migration compatibility is maintained by
always providing defaults for new fields in the Zod schema.

---

## ADR-009: Cart Stored Server-Side with Anonymous Token

**Date:** 2026-03-26
**Status:** Accepted

### Context

Carts need to persist across page refreshes and contain enough information to calculate
promotions server-side. We need to decide where to store cart state.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **localStorage (client-side only)** | No server round-trips for add/remove | Cannot calculate server-side promotions, does not persist across devices, no server-side abandoned cart tracking |
| **React context / Zustand (client-side)** | Fast UI updates | Same limitations as localStorage; lost on refresh without separate persistence layer |
| **Session-based cart (next-auth session)** | Tied to user session | Requires login; we support guest checkout |
| **Server-side cart with anonymous token** | Persists across devices with same cookie, enables server-side promotion calculation, enables abandoned cart tracking | Requires database row per cart; cleanup job needed |

### Decision

Store carts in the `Cart` table, identified by a UUID token in an HTTP-only `SameSite=Strict`
cookie. Cart operations are server actions or API route handlers.

### Rationale

A server-side cart is the only approach that supports all of: guest checkout (no login required),
server-side promotion calculation (promotions engine runs on the server where it has access to
all rules), abandoned cart tracking (carts in the database with no corresponding order can be
identified), and cross-device persistence (same cookie token if the browser profile is synced).
The HTTP-only cookie prevents JavaScript access to the cart token, reducing XSS exposure. A
scheduled cleanup job removes carts older than 30 days.

---

## ADR-010: Email Templates as Server-Side Rendered HTML with Variable Interpolation

**Date:** 2026-03-26
**Status:** Accepted

### Context

Transactional emails (order confirmed, payment received, shipped) need to be customisable per
store while remaining secure and reliably deliverable. We need to decide how to implement the
email templating system.

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Raw user-authored HTML emails** | Maximum flexibility | XSS risk in emails (phishing via store owner's email), deliverability issues from poorly structured HTML, hard to guarantee mobile rendering |
| **MJML templates** | Excellent email client compatibility | Adds MJML compilation step, admin would need to write MJML syntax |
| **React Email (react-email)** | JSX-based, great DX for developers | Not editable by non-developers in admin UI |
| **Server-rendered HTML with variable slots** | Safe, controlled structure, admin customises text/colors not structure, deliverability guaranteed | Less flexibility than raw HTML |

### Decision

Email templates are structured HTML layouts defined in code (`packages/email/src/templates/`)
with safe variable interpolation. Admins can customise the content (subject line, body text,
footer) through a structured form editor in the admin panel. Variable interpolation uses a
`{{variable.path}}` syntax processed server-side using a safe interpolation function (not
`eval`). Admin-supplied content within templates is passed through `sanitize-html` before
insertion.

### Rationale

Keeping the HTML structure in code guarantees correct email client rendering and deliverability.
Admin customisation is limited to content (text, colors via theme) rather than structure,
preventing the template from being broken by an admin mistake. The variable interpolation
function uses a simple path-traversal lookup against a typed data object — no code execution,
no template injection risk. This approach also makes it straightforward to add new email types
in the future (e.g., abandoned cart email, review request) by adding a new template file and
a corresponding `EmailTemplate.type` enum value.
