import { z } from 'zod'

// ============================================================
// COMMON
// ============================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const idParamSchema = z.object({
  id: z.string().cuid(),
})

export const storeIdParamSchema = z.object({
  storeId: z.string().cuid(),
})

// ============================================================
// STORE
// ============================================================

export const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  domain: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT'),
})

export const updateStoreSchema = createStoreSchema.partial()

export const storeAddressSchema = z.object({
  street: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().length(2).toUpperCase(),
})

export const storeSocialLinksSchema = z.object({
  facebook: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  instagram: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  twitter: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  tiktok: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  youtube: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  whatsapp: z.string().max(20).optional().or(z.literal('')).transform(v => v || undefined),
  linkedin: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
})

export const checkoutConfigSchema = z.object({
  guestCheckout: z.boolean().default(true),
  requirePhone: z.boolean().default(false),
  requireCompany: z.boolean().default(false),
  requireAddress: z.boolean().default(true),
  termsUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  privacyUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  confirmationMessage: z.string().max(500).optional(),
  successRedirectUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
})

export const updateStoreConfigSchema = z.object({
  logoUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  faviconUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  coverImageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  surfaceColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontHeading: z.string().max(50).optional(),
  fontBody: z.string().max(50).optional(),
  borderRadius: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  currencySymbol: z.string().max(5).optional(),
  currencyPosition: z.enum(['before', 'after']).optional(),
  currencyDecimals: z.number().int().min(0).max(4).optional(),
  language: z.string().min(2).max(5).optional(),
  country: z.string().length(2).toUpperCase().optional(),
  timezone: z.string().max(50).optional(),
  weightUnit: z.enum(['kg', 'lb', 'g', 'oz']).optional(),
  dimensionUnit: z.enum(['cm', 'in']).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaKeywords: z.string().max(200).optional(),
  ogImageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  contactEmail: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  contactPhone: z.string().max(30).optional(),
  address: storeAddressSchema.optional(),
  socialLinks: storeSocialLinksSchema.optional(),
  emailFromName: z.string().max(100).optional(),
  emailFromAddress: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  emailReplyTo: z.string().email().optional().or(z.literal('')).transform(v => v || undefined),
  googleAnalyticsId: z.string().max(30).optional(),
  metaPixelId: z.string().max(30).optional(),
  checkoutConfig: checkoutConfigSchema.optional(),
})

export const updateStoreThemeSchema = z.object({
  presetName: z.string().max(50).optional(),
  cardStyle: z.enum(['standard', 'compact', 'minimal', 'bold', 'overlay']).optional(),
  cardShowRating: z.boolean().optional(),
  cardShowBadges: z.boolean().optional(),
  cardShowQuickAdd: z.boolean().optional(),
  cardImageRatio: z.enum(['1:1', '4:3', '3:4', '16:9']).optional(),
  cardHoverEffect: z.enum(['zoom', 'fade', 'lift', 'none']).optional(),
  cardPricePosition: z.enum(['below', 'overlay']).optional(),
  headerStyle: z.enum(['standard', 'centered', 'minimal', 'floating']).optional(),
  headerSticky: z.boolean().optional(),
  headerShowSearch: z.boolean().optional(),
  headerShowCart: z.boolean().optional(),
  headerLogoMaxHeight: z.number().int().min(24).max(120).optional(),
  buttonStyle: z.enum(['filled', 'outlined', 'ghost', 'soft']).optional(),
  buttonRadius: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
  listingDefaultView: z.enum(['grid', 'list']).optional(),
  listingColumns: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  listingShowFilters: z.boolean().optional(),
  listingShowSort: z.boolean().optional(),
  pdpLayout: z.enum(['standard', 'wide', 'minimal', 'split']).optional(),
  pdpShowRelated: z.boolean().optional(),
  pdpRelatedCount: z.number().int().min(1).max(12).optional(),
  pdpImageLayout: z.enum(['gallery', 'carousel', 'stacked', 'thumbnails']).optional(),
  pdpShowSku: z.boolean().optional(),
  pdpShowStock: z.boolean().optional(),
  priceShowOriginal: z.boolean().optional(),
  priceShowSavings: z.boolean().optional(),
  priceShowSavingsPct: z.boolean().optional(),
  priceColorDiscount: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  priceColorOriginal: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  // customCss is sanitized server-side before saving
  customCss: z.string().max(10000).optional(),
})

export const updateCartConfigSchema = z.object({
  mode: z.enum(['DRAWER', 'MODAL', 'SIDEBAR', 'PAGE', 'FLOATING']).optional(),
  style: z.enum(['standard', 'minimal', 'bold', 'card', 'floating']).optional(),
  position: z.enum(['right', 'left']).optional(),
  size: z.enum(['sm', 'md', 'lg']).optional(),
  showImages: z.boolean().optional(),
  showVariantOptions: z.boolean().optional(),
  showQuantity: z.boolean().optional(),
  showRemove: z.boolean().optional(),
  showSubtotal: z.boolean().optional(),
  showSavings: z.boolean().optional(),
  showItemCount: z.boolean().optional(),
  showShipping: z.boolean().optional(),
  showTaxes: z.boolean().optional(),
  showPromoCode: z.boolean().optional(),
  showProgress: z.boolean().optional(),
  freeShippingThreshold: z.number().positive().optional(),
  showUpsells: z.boolean().optional(),
  upsellTitle: z.string().max(100).optional(),
  upsellProductIds: z.array(z.string()).max(10).optional(),
  upsellMaxItems: z.number().int().min(1).max(10).optional(),
  showCrossSells: z.boolean().optional(),
  crossSellTitle: z.string().max(100).optional(),
  crossSellMaxItems: z.number().int().min(1).max(10).optional(),
  cartTitle: z.string().max(100).optional(),
  emptyTitle: z.string().max(100).optional(),
  emptyMessage: z.string().max(300).optional(),
  checkoutButtonText: z.string().max(60).optional(),
  continueShoppingText: z.string().max(60).optional(),
  persistDays: z.number().int().min(1).max(90).optional(),
})

// ============================================================
// PRODUCTS
// ============================================================

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(50000).optional(),
  shortDescription: z.string().max(500).optional(),
  sku: z.string().max(100).optional(),
  barcode: z.string().max(100).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT'),
  featured: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  basePrice: z.number().min(0).max(9999999),
  compareAtPrice: z.number().min(0).max(9999999).optional(),
  costPrice: z.number().min(0).max(9999999).optional(),
  trackInventory: z.boolean().default(false),
  inventoryCount: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  allowBackorder: z.boolean().default(false),
  weight: z.number().min(0).optional(),
  badgeLabel: z.string().max(30).optional(),
  badgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  categoryIds: z.array(z.string()).default([]),
  collectionIds: z.array(z.string()).default([]),
})

export const updateProductSchema = createProductSchema.partial()

export const createProductVariantSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  price: z.number().min(0).max(9999999),
  compareAtPrice: z.number().min(0).max(9999999).optional(),
  inventoryCount: z.number().int().min(0).optional(),
  options: z.array(z.object({
    groupId: z.string(),
    groupName: z.string(),
    optionId: z.string(),
    optionLabel: z.string(),
    optionValue: z.string(),
  })),
  imageUrl: z.string().url().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

// ============================================================
// CATEGORIES
// ============================================================

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  parentId: z.string().cuid().optional().or(z.literal('')).transform(v => v || undefined),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const updateCategorySchema = createCategorySchema.partial()

// ============================================================
// COLLECTIONS
// ============================================================

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  isAutomatic: z.boolean().default(false),
  rules: z.array(z.object({
    field: z.enum(['tag', 'category', 'price', 'inventory', 'title']),
    operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'starts_with']),
    value: z.string().min(1),
  })).optional(),
  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  isActive: z.boolean().default(true),
})

export const updateCollectionSchema = createCollectionSchema.partial()

// ============================================================
// ORDERS
// ============================================================

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'ON_HOLD']),
  note: z.string().max(500).optional(),
  isInternal: z.boolean().default(false),
})

export const updateOrderPaymentSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
  note: z.string().max(500).optional(),
})

export const addOrderNoteSchema = z.object({
  note: z.string().min(1).max(2000),
  isInternal: z.boolean().default(true),
})

// ============================================================
// CHECKOUT (creates an order from cart)
// ============================================================

export const checkoutAddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  street: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zip: z.string().min(1).max(20),
  country: z.string().length(2).toUpperCase(),
  phone: z.string().max(30).optional(),
})

export const createCheckoutSchema = z.object({
  cartToken: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  shippingAddress: checkoutAddressSchema,
  billingAddress: checkoutAddressSchema.optional(),
  billingSameAsShipping: z.boolean().default(true),
  paymentMethodId: z.string().cuid(),
  customerNotes: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
  acceptsMarketing: z.boolean().default(false),
})

// ============================================================
// CART
// ============================================================

export const addToCartSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive().max(999),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).max(999),
})

export const applyCouponSchema = z.object({
  couponCode: z.string().min(1).max(50).toUpperCase(),
})

// ============================================================
// PROMOTIONS
// ============================================================

export const createPromotionSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'GIFT']),
  target: z.enum(['ALL', 'PRODUCT', 'CATEGORY', 'COLLECTION', 'CART_VALUE']).default('ALL'),
  discountValue: z.number().min(0).max(100),
  maxDiscountAmount: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  minQuantity: z.number().int().min(1).optional(),
  productIds: z.array(z.string()).optional(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  buyQuantity: z.number().int().min(1).optional(),
  getQuantity: z.number().int().min(1).optional(),
  getProductId: z.string().optional(),
  isAutoApply: z.boolean().default(true),
  priority: z.number().int().min(0).max(100).default(0),
  isStackable: z.boolean().default(false),
  badgeLabel: z.string().max(30).optional(),
  badgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(1).optional(),
  isActive: z.boolean().default(true),
})

export const updatePromotionSchema = createPromotionSchema.partial()

// ============================================================
// COUPONS
// ============================================================

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Coupon code must be uppercase alphanumeric')
    .toUpperCase(),
  promotionId: z.string().cuid().optional(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'GIFT']).optional(),
  discountValue: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  maxUsesPerUser: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
})

export const updateCouponSchema = createCouponSchema.partial().omit({ code: true })

// ============================================================
// PAYMENT METHODS
// ============================================================

const paymentBlockSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'info_box', 'account_info', 'image', 'divider', 'link']),
  content: z.string().max(2000),
  props: z.record(z.unknown()).optional(),
})

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'CUSTOM_BLOCKS', 'EXTERNAL_LINK', 'MANUAL']),
  // For MANUAL / BANK_TRANSFER — content is sanitized on the server before saving
  instructions: z.string().max(5000).optional(),
  // For CUSTOM_BLOCKS — structured blocks only, no raw HTML
  templateBlocks: z.array(paymentBlockSchema).max(20).optional(),
  // For EXTERNAL_LINK
  redirectUrl: z.string().url().optional().or(z.literal('')).transform(v => v || undefined),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
})

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial()

// ============================================================
// EMAIL TEMPLATES
// ============================================================

export const updateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  previewText: z.string().max(200).optional(),
  htmlContent: z.string().min(1).max(100000),
  textContent: z.string().max(50000).optional(),
  isActive: z.boolean().default(true),
})

// ============================================================
// SMTP CONFIG
// ============================================================

export const updateSmtpConfigSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean().default(false),
  user: z.string().min(1).max(255),
  pass: z.string().min(1).max(255),
  fromName: z.string().min(1).max(100),
  fromAddress: z.string().email(),
  replyTo: z.string().email().optional(),
})

// ============================================================
// TYPE EXPORTS
// ============================================================

export type CreateStoreInput = z.infer<typeof createStoreSchema>
export type UpdateStoreInput = z.infer<typeof updateStoreSchema>
export type UpdateStoreConfigInput = z.infer<typeof updateStoreConfigSchema>
export type UpdateStoreThemeInput = z.infer<typeof updateStoreThemeSchema>
export type UpdateCartConfigInput = z.infer<typeof updateCartConfigSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateProductVariantInput = z.infer<typeof createProductVariantSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type UpdateOrderPaymentInput = z.infer<typeof updateOrderPaymentSchema>
export type AddOrderNoteInput = z.infer<typeof addOrderNoteSchema>
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>
export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>
export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>
export type UpdateSmtpConfigInput = z.infer<typeof updateSmtpConfigSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
