# Feature Matrix

This document defines the full scope of Store Builder's feature set, organized by priority tier.
Features are grouped to reflect the order in which they should be implemented. Each feature
includes a brief description and the primary models or components it touches.

---

## Tier 1: ESSENTIAL — Launch a Powerful Store

These features are required before any store can go live. They represent the minimum viable
product that delivers genuine value to both the store operator and their customers.

### Product Catalog

| Feature | Description | Models / Components |
|---|---|---|
| Product CRUD | Create, read, update, delete products with title, description, price, compareAtPrice, images, slug/handle, and SEO metadata | `Product`, admin product pages |
| Product variants | Define options (e.g., Size, Color) and generate variant combinations with independent SKU, price, and stock | `ProductVariant`, variant option matrix UI |
| Product images | Upload multiple ordered images per product; drag-to-reorder; main image selection | `ProductImage`, upload handler |
| Product status | Draft / Active / Archived with visibility control on storefront | `Product.status` |
| Product SEO | Per-product meta title, meta description, and canonical slug | `Product.seoTitle`, `Product.seoDescription` |
| Inventory tracking | Stock quantity per variant with optional "allow oversell" toggle | `ProductVariant.stock`, `ProductVariant.allowOversell` |
| Low-stock indicator | Admin list view highlights products/variants below configurable threshold | `ProductVariant.stock` |

### Categories and Collections

| Feature | Description | Models / Components |
|---|---|---|
| Categories | Hierarchical categories (parent/children) with handle-based slugs and optional image | `Category` |
| Category assignment | Assign a product to one or more categories | `Product.categories` (M:M) |
| Collections | Curated product groupings separate from taxonomy (e.g., "Summer Sale", "Staff Picks") | `Collection` |
| Collection assignment | Manually assign products to a collection | `Collection.products` (M:M) |
| Category storefront listing | Paginated product grid filtered by category with sort options | Storefront `/categories/[handle]` |
| Collection storefront listing | Paginated product grid filtered by collection | Storefront `/collections/[handle]` |

### Cart

| Feature | Description | Models / Components |
|---|---|---|
| Server-side cart | Cart stored in PostgreSQL, identified by a UUID token in an HTTP-only cookie | `Cart`, `CartItem` |
| Cart types | Per-store configuration for cart display: drawer (slide-in panel), modal, or dedicated page | `CartConfig.cartType` |
| Add to cart | Add a product variant to cart; merges quantity if variant already present | `CartItem` |
| Update quantity | Increment/decrement or set explicit quantity; remove item when quantity reaches 0 | `CartItem.quantity` |
| Cart persistence | Cart survives page refresh and browser close via cookie token | `Cart.token` |
| Cart item count | Badge on cart icon showing total item count across all line items | Storefront layout |
| Cart subtotal | Real-time subtotal calculation with applied promotion discounts shown inline | Cart UI + cart engine |
| Cart promotion display | Active promotions applied to cart shown as line-item discounts | Promotions engine |

### Checkout

| Feature | Description | Models / Components |
|---|---|---|
| Guest checkout | No account required; customers provide email, name, and shipping address | `Order.customerEmail` |
| Checkout flow | Multi-step: contact info → shipping → payment selection → review → place order | Storefront checkout pages |
| Order placement | Atomic transaction: create order, create order items (price snapshot), decrement stock | `Order`, `OrderItem` |
| Payment method selection | Customer selects from store's configured payment methods at checkout | `PaymentMethod` |
| Order confirmation page | Post-checkout confirmation showing order number, summary, and instructions | Storefront confirmation page |
| Order confirmation email | Transactional email sent to customer immediately after order placement | `EmailTemplate`, email package |

### Order Management

| Feature | Description | Models / Components |
|---|---|---|
| Order list | Paginated, filterable, sortable order list in admin with status badges | Admin orders page |
| Order detail | Full order detail: items, totals, addresses, payment method, customer info | Admin order detail page |
| Order statuses | `pending` → `confirmed` → `processing` → `shipped` → `delivered` → `cancelled` / `refunded` | `Order.status` enum |
| Manual status update | Admin can advance or change order status with optional note | `OrderTimeline` |
| Order timeline | Append-only chronological log of every status change and admin note | `OrderTimeline` |
| Admin notes | Free-text notes on an order visible only to admin, appended to timeline | `OrderTimeline.note` |

### Payment Methods

| Feature | Description | Models / Components |
|---|---|---|
| Bank transfer | Pre-configured template: customer sees bank account details after placing order | `PaymentMethod.type = bank_transfer` |
| Manual / cash on delivery | Instruction text shown at checkout and in confirmation email | `PaymentMethod.type = manual` |
| Custom HTML instructions | Admin-authored HTML instructions (sanitized via sanitize-html before storage) | `PaymentMethod.instructionsHtml` |
| Multiple payment methods | Store can have any number of active payment methods; customer selects at checkout | `PaymentMethod` list |
| Payment received email | Triggered manually by admin when marking order as payment received | `EmailTemplate.type = payment_received` |

### Email Notifications

| Feature | Description | Models / Components |
|---|---|---|
| Order confirmed email | Auto-sent on order placement; includes order number, items, totals, payment instructions | `EmailTemplate.type = order_confirmed` |
| Payment received email | Sent when admin marks payment as received | `EmailTemplate.type = payment_received` |
| Order shipped email | Sent when admin marks order as shipped; includes optional tracking info | `EmailTemplate.type = order_shipped` |
| Per-store SMTP | Each store can configure its own SMTP credentials, overriding global fallback | `StoreConfig.smtp` (encrypted) |
| Email preview | Admin can preview rendered email template with sample data before sending | Admin email template page |

### Store Configuration

| Feature | Description | Models / Components |
|---|---|---|
| Store CRUD | Create, read, update, delete stores from admin dashboard | `Store` |
| Store branding | Store name, logo, favicon | `Store`, `StoreTheme` |
| Colors and fonts | Primary color, accent color, background, text, and font family selection | `StoreTheme` |
| Currency and locale | Currency code, currency symbol, locale string for number/date formatting | `StoreConfig` |
| Store timezone | Timezone for date display and scheduled operations | `StoreConfig.timezone` |
| Contact info | Store email, phone, address used in emails and storefront footer | `StoreConfig` |
| Social links | Optional social media URLs shown in storefront footer | `StoreConfig.social` |

### SEO Basics

| Feature | Description | Models / Components |
|---|---|---|
| Global meta | Default meta title pattern and meta description per store | `StoreConfig.seo` |
| Per-page meta | Override meta title and description on products, categories, collections | Model `seoTitle` / `seoDescription` fields |
| Canonical URLs | Correct canonical tags on all storefront pages to prevent duplicate content | Storefront `<Head>` components |
| Sitemap | Auto-generated `/sitemap.xml` per store listing all active products and categories | Storefront sitemap route |
| robots.txt | Default `robots.txt` allowing crawlers; admin can set noindex per store | Storefront robots route |

### Responsive Storefront

| Feature | Description | Models / Components |
|---|---|---|
| Mobile-first layout | Storefront is fully responsive at all breakpoints using Tailwind CSS | Storefront layout components |
| Product grid | Responsive product card grid with image, title, price, and add-to-cart | Storefront product grid |
| Product detail page | Images carousel/gallery, variant selector, quantity, add-to-cart, description | Storefront product detail |
| Navigation | Mobile hamburger menu with category links and cart icon | Storefront header |
| Footer | Store info, social links, navigation links | Storefront footer |

### Promotions

| Feature | Description | Models / Components |
|---|---|---|
| Percentage discount | Auto-applied promotion reducing order total by a percentage | `Promotion.type = percentage` |
| Fixed amount discount | Auto-applied promotion reducing order total by a fixed currency amount | `Promotion.type = fixed` |
| Promotion conditions | Optional minimum order value, applicable product/category scope | `Promotion.conditions` (JSONB) |
| Promotion date range | Optional start and end datetime for time-limited promotions | `Promotion.startsAt`, `Promotion.endsAt` |
| Multiple promotions | Multiple active promotions stack or use best-value logic per configuration | Promotions engine |
| Promotion admin UI | List, create, edit, activate/deactivate promotions per store | Admin promotions pages |

### Coupons

| Feature | Description | Models / Components |
|---|---|---|
| Coupon code entry | Customer enters coupon code at cart or checkout | Storefront cart/checkout UI |
| Percentage and fixed coupons | Same discount types as promotions but triggered by code | `Coupon.type` |
| Usage limits | Max total uses and/or max uses per customer email | `Coupon.maxUses`, `Coupon.usedCount` |
| Expiry date | Coupon becomes invalid after a configured date | `Coupon.expiresAt` |
| Minimum order value | Coupon only applies if cart subtotal meets minimum | `Coupon.minOrderValue` |
| Coupon admin UI | List, create, edit, deactivate coupons with usage statistics | Admin coupons pages |

### Storefront Themes and Presets

| Feature | Description | Models / Components |
|---|---|---|
| Theme presets | A set of named built-in themes (e.g., Minimal, Bold, Classic) with preset color/font values | `StoreTheme.preset` |
| Theme customization | Override any preset value: primary color, font, border radius, button style | `StoreTheme` JSONB |
| Live preview | Admin theme editor shows a preview of changes before saving | Admin theme editor |
| CSS variables | Theme values injected as CSS custom properties on the storefront `<html>` element | Storefront layout |

### Admin Panel

| Feature | Description | Models / Components |
|---|---|---|
| Multi-store dashboard | Overview of all stores with key metrics (total orders, revenue this month) | Admin dashboard |
| Store switcher | Quick-access dropdown to switch between stores in the admin nav | Admin layout |
| Responsive admin UI | Admin panel works on tablet and desktop | Admin layout components |
| Admin auth | Login/logout with next-auth; session-protected routes | next-auth, admin middleware |

---

## Tier 2: IMPORTANT — Smooth Operations

These features significantly improve the day-to-day experience of running a store. They should
be implemented in the second phase, shortly after Tier 1 is complete.

### Customer Management

| Feature | Description |
|---|---|
| Customer list | Aggregated list of customers derived from order history (email, name, order count, total spent) |
| Customer detail | View all orders for a given customer email |
| Customer notes | Admin-only notes attached to a customer record |
| Customer export | CSV export of customer list |

### Order Enhancements

| Feature | Description |
|---|---|
| Order search | Full-text search on order number, customer email, and customer name |
| Order filter by status | Filter order list by one or more statuses |
| Order filter by date | Filter order list by date range |
| Tracking number | Admin can enter a tracking number and carrier when marking order as shipped |
| Order CSV export | Export filtered order list to CSV for accounting/reporting |
| Refund notes | Record refund amount and reason on order timeline |

### Coupon Enhancements

| Feature | Description |
|---|---|
| Coupon bulk generation | Generate N unique single-use coupon codes from a template |
| Coupon applicability | Restrict coupon to specific products, categories, or collections |
| Coupon first-order only | Flag to restrict coupon to a customer's first order |

### Product Enhancements

| Feature | Description |
|---|---|
| Product filtering | Storefront product listing with filter panel (by category, price range, in-stock only) |
| Product sorting | Sort by price ascending/descending, newest, best match |
| Product search | Full-text search on storefront with results page; powered by PostgreSQL `tsvector` |
| Product badges | Optional badge labels (e.g., "New", "Sale", "Low Stock") displayed on product cards |
| Product ribbons | Diagonal corner ribbon overlay on product images for promotional callouts |
| Related products | Admin-curated or auto-suggested related products shown on product detail page |
| Bulk product actions | Select multiple products in admin to bulk activate, archive, or delete |
| Product duplication | Clone an existing product as a starting point for a new listing |

### Multi-Currency Display

| Feature | Description |
|---|---|
| Currency formatting | All prices formatted according to store's currency and locale settings |
| Currency symbol placement | Correct placement (prefix/suffix) per locale |
| Multi-currency display (static) | Admin can configure display currency; no live conversion rates in this tier |

### Store Operations

| Feature | Description |
|---|---|
| Store duplication | Clone an entire store (config, theme, products, categories) as a new store scaffold |
| Store archiving | Soft-delete a store; storefront returns 404, data retained for records |
| Store-level analytics | Order count, revenue, average order value, top products for a date range |

### Email System Enhancements

| Feature | Description |
|---|---|
| Email template editor | Rich admin UI for editing email templates with variable reference guide |
| Template variable interpolation | Safe server-side variable substitution: `{{order.number}}`, `{{store.name}}`, etc. |
| Test email send | Admin can send a test email to a specified address to verify SMTP and template |
| SMTP configuration UI | Admin form for entering per-store SMTP credentials (stored encrypted) |
| DKIM/SPF/DMARC guide | In-app documentation page explaining DNS records needed for email deliverability |
| Email send log | Log of sent transactional emails with status (sent/failed) and timestamp |

### Cart Enhancements

| Feature | Description |
|---|---|
| Cart upsells | Admin-configured "frequently bought with" suggestions shown in cart drawer/page |
| Cross-sell blocks | Related product suggestions on the product detail page below add-to-cart |
| Abandoned cart tracking | Record carts that were not converted to orders; show count in admin dashboard |
| Cart expiry | Carts older than a configurable number of days are soft-deleted in cleanup job |

### Storefront Content

| Feature | Description |
|---|---|
| Storefront banners | Admin-configurable hero banner with image, headline, subtext, and CTA button |
| Content blocks | Simple CMS blocks (text, image, video embed) for the storefront home page |
| Custom pages | Admin can create simple static pages (About, FAQ, Contact) with sanitized HTML content |
| Footer links | Admin-configurable footer link groups |

### Payment Enhancements

| Feature | Description |
|---|---|
| Custom payment HTML | Admin can write rich HTML payment instructions; sanitized before storage and display |
| Payment method ordering | Drag-to-reorder payment methods as they appear at checkout |
| Payment method icons | Admin can upload or select an icon for each payment method |

---

## Tier 3: OPTIONAL — Phase 2 Expansion

These features represent significant scope expansions. They should be planned but not built until
Tiers 1 and 2 are stable and deployed. Each item here could be a substantial feature project
in its own right.

### Customer Accounts

| Feature | Description |
|---|---|
| Customer registration | Customers can create accounts on a per-store basis |
| Customer login | Session-based login for returning customers |
| Order history | Logged-in customers can view their past orders |
| Address book | Saved shipping addresses for faster checkout |
| Wishlist | Save products to a wishlist for later purchase |
| Loyalty points | Points earned per order, redeemable as discount |

### Reviews and Social Proof

| Feature | Description |
|---|---|
| Product reviews | Customers can submit star rating and text review |
| Review moderation | Admin approves/rejects reviews before display |
| Review display | Star rating summary and review list on product detail page |
| Aggregate rating schema | JSON-LD structured data for product ratings (Google rich results) |

### Advanced Promotions

| Feature | Description |
|---|---|
| Product bundles | Group products and offer a bundle price |
| Subscription products | Recurring billing via Stripe or similar |
| Tiered pricing | Price breaks at quantity thresholds |
| Affiliate/referral system | Unique referral links with commission tracking |

### Shipping and Tax

| Feature | Description |
|---|---|
| Shipping zones | Define flat-rate shipping rules by country/region |
| Shipping integrations | Real-time rates from carriers (DHL, FedEx, UPS) via API |
| Tax rates | Configurable tax rates by region; applied at checkout |
| Tax-inclusive pricing | Toggle to show prices with tax included |
| VAT/GST invoices | Downloadable tax invoices for B2B customers |

### Internationalisation

| Feature | Description |
|---|---|
| Multi-language per store | Admin can translate product content into multiple languages |
| Language switcher | Storefront language selector for multi-language stores |
| Multi-currency live rates | Real-time currency conversion via exchange rate API |
| RTL support | Right-to-left layout support for Arabic/Hebrew storefronts |

### Analytics and Reporting

| Feature | Description |
|---|---|
| Advanced analytics | Revenue charts, conversion funnel, traffic sources (with analytics integration) |
| Inventory reports | Low stock alerts, inventory valuation report |
| Product performance | Best-sellers, slowest movers, view-to-purchase rate |
| Customer lifetime value | Aggregated CLV per customer segment |

### Platform and Integration

| Feature | Description |
|---|---|
| Store API keys | Per-store API keys for headless/custom integrations |
| Webhooks | Configurable webhooks for order events, inventory events |
| Zapier/Make integration | Pre-built connectors for automation platforms |
| Google Shopping feed | Auto-generated product feed in Google Merchant format |
| Meta (Facebook) feed | Auto-generated product feed for Meta Catalog |
| Inventory alerts | Email/webhook notification when a variant reaches reorder threshold |

### Infrastructure

| Feature | Description |
|---|---|
| Background job queue | Async job processing for email sending, inventory alerts, feed generation |
| Rate limiting | Per-IP and per-store rate limits on storefront API endpoints |
| CDN image optimization | Serve product images via CDN with automatic format/size optimization |
| Audit log | Admin action audit trail for compliance and debugging |
| Two-factor authentication | TOTP 2FA for admin user accounts |
