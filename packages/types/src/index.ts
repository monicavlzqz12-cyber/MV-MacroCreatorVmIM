// ============================================================
// STORE TYPES
// ============================================================

export type StoreStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface StoreAddress {
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
}

export interface StoreSocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  whatsapp?: string
  linkedin?: string
}

export interface StoreGlobalTexts {
  addToCart?: string
  outOfStock?: string
  viewProduct?: string
  continueShoppingText?: string
  emptyCartMessage?: string
  buyNow?: string
  soldOut?: string
  lowStock?: string
  freeShipping?: string
  saveText?: string // "Save {amount}"
  discountBadge?: string
  newBadge?: string
  hotBadge?: string
  featuredBadge?: string
}

export interface StoreBanner {
  id: string
  type: 'hero' | 'strip' | 'popup' | 'announcement'
  title?: string
  text?: string
  ctaLabel?: string
  ctaUrl?: string
  imageUrl?: string
  bgColor?: string
  textColor?: string
  isActive: boolean
  startsAt?: string // ISO date
  endsAt?: string   // ISO date
  sortOrder: number
}

export interface StoreCustomBadge {
  id: string
  label: string
  color: string        // background
  textColor: string
  style: 'ribbon' | 'badge' | 'tag' | 'pill'
}

export interface ContentBlock {
  id: string
  type: 'html_safe' | 'image' | 'text' | 'spacer' | 'columns' | 'product_grid' | 'banner'
  content: unknown
  position: 'home_top' | 'home_bottom' | 'home_middle' | 'catalog_top' | 'catalog_bottom' | 'pdp_below_title' | 'pdp_below_price' | 'pdp_below_description'
  isActive: boolean
  sortOrder: number
}

export interface StoreLayoutOptions {
  headerLayout?: 'standard' | 'centered' | 'minimal'
  footerLayout?: 'standard' | 'minimal' | 'columns'
  homepageLayout?: 'standard' | 'fullwidth' | 'editorial'
  listingLayout?: 'grid' | 'list' | 'masonry'
}

export interface CheckoutConfig {
  guestCheckout: boolean
  requirePhone: boolean
  requireCompany: boolean
  requireAddress: boolean
  termsUrl?: string
  privacyUrl?: string
  confirmationMessage?: string
  successRedirectUrl?: string
  requirePaymentBeforeConfirm?: boolean
}

export interface StoreConfigData {
  logoUrl?: string
  faviconUrl?: string
  coverImageUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  fontHeading: string
  fontBody: string
  borderRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  currency: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  currencyDecimals: number
  language: string
  country: string
  timezone: string
  weightUnit: 'kg' | 'lb' | 'g' | 'oz'
  dimensionUnit: 'cm' | 'in'
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  ogImageUrl?: string
  canonicalUrl?: string
  contactEmail?: string
  contactPhone?: string
  address?: StoreAddress
  socialLinks?: StoreSocialLinks
  globalTexts?: StoreGlobalTexts
  banners?: StoreBanner[]
  customBadges?: StoreCustomBadge[]
  contentBlocks?: ContentBlock[]
  layoutOptions?: StoreLayoutOptions
  checkoutConfig?: CheckoutConfig
  emailFromName?: string
  emailFromAddress?: string
  emailReplyTo?: string
  googleAnalyticsId?: string
  metaPixelId?: string
}

export interface ThemePreset {
  name: string
  displayName: string
  description: string
  thumbnail?: string
}

export interface StoreThemeData {
  presetName: string
  cardStyle: 'standard' | 'compact' | 'minimal' | 'bold' | 'overlay'
  cardShowRating: boolean
  cardShowBadges: boolean
  cardShowQuickAdd: boolean
  cardImageRatio: '1:1' | '4:3' | '3:4' | '16:9'
  cardHoverEffect: 'zoom' | 'fade' | 'lift' | 'none'
  cardPricePosition: 'below' | 'overlay'
  headerStyle: 'standard' | 'centered' | 'minimal' | 'floating'
  headerSticky: boolean
  headerShowSearch: boolean
  headerShowCart: boolean
  headerLogoMaxHeight: number
  headerNavLayout: 'horizontal' | 'dropdown' | 'megamenu'
  footerStyle: string
  footerColumns?: FooterColumn[]
  buttonStyle: 'filled' | 'outlined' | 'ghost' | 'soft'
  buttonRadius: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  listingDefaultView: 'grid' | 'list'
  listingColumns: 2 | 3 | 4 | 5
  listingShowFilters: boolean
  listingShowSort: boolean
  listingShowCount: boolean
  pdpLayout: 'standard' | 'wide' | 'minimal' | 'split'
  pdpShowRelated: boolean
  pdpRelatedCount: number
  pdpImageLayout: 'gallery' | 'carousel' | 'stacked' | 'thumbnails'
  pdpShowShare: boolean
  pdpShowSku: boolean
  pdpShowStock: boolean
  priceShowOriginal: boolean
  priceShowSavings: boolean
  priceShowSavingsPct: boolean
  priceColorDiscount: string
  priceColorOriginal: string
  customCss?: string
}

export interface FooterColumn {
  title: string
  links: Array<{ label: string; url: string }>
}

export type CartMode = 'DRAWER' | 'MODAL' | 'SIDEBAR' | 'PAGE' | 'FLOATING'

export interface CartStyleTokens {
  backgroundColor?: string
  headerBg?: string
  itemBg?: string
  borderColor?: string
  fontFamily?: string
  titleFontSize?: string
  subtotalFontWeight?: string
  checkoutButtonBg?: string
  checkoutButtonColor?: string
  checkoutButtonRadius?: string
  checkoutButtonFontWeight?: string
  itemImageRadius?: string
  quantityStyle?: 'input' | 'stepper' | 'select'
}

export interface CartBlock {
  id: string
  type: 'text' | 'html_safe' | 'image' | 'promo_banner' | 'trust_badges' | 'spacer'
  content: unknown
  position: 'top' | 'before_checkout' | 'bottom' | 'after_items'
  isActive: boolean
}

export interface CartTriggerConfig {
  openOnAdd: boolean
  closeOnOutsideClick: boolean
  showOverlay: boolean
  animationStyle: 'slide' | 'fade' | 'pop'
}

export interface CartConfigData {
  mode: CartMode
  style: 'standard' | 'minimal' | 'bold' | 'card' | 'floating'
  position: 'right' | 'left'
  size: 'sm' | 'md' | 'lg'
  showImages: boolean
  showVariantOptions: boolean
  showQuantity: boolean
  showRemove: boolean
  showSubtotal: boolean
  showSavings: boolean
  showItemCount: boolean
  showShipping: boolean
  showTaxes: boolean
  showPromoCode: boolean
  showProgress: boolean
  freeShippingThreshold?: number
  showUpsells: boolean
  upsellTitle?: string
  upsellProductIds: string[]
  upsellMaxItems: number
  showCrossSells: boolean
  crossSellTitle?: string
  crossSellMaxItems: number
  cartTitle?: string
  emptyTitle?: string
  emptyMessage?: string
  checkoutButtonText?: string
  continueShoppingText?: string
  orderSummaryTitle?: string
  persistDays: number
  styleTokens?: CartStyleTokens
  blocks?: CartBlock[]
  triggerConfig?: CartTriggerConfig
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'in'
}

export interface ProductOptionValue {
  groupId: string
  groupName: string
  optionId: string
  optionLabel: string
  optionValue: string
  colorHex?: string
  imageUrl?: string
}

export interface ProductImageData {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
  sortOrder: number
}

export interface ProductVariantData {
  id: string
  name: string
  sku?: string
  price: number
  compareAtPrice?: number
  inventoryCount?: number
  options: ProductOptionValue[]
  imageUrl?: string
  isDefault: boolean
  isActive: boolean
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  status: ProductStatus
  basePrice: number
  compareAtPrice?: number
  imageUrl?: string
  inventoryCount?: number
  featured: boolean
  hasVariants: boolean
  badgeLabel?: string
  badgeColor?: string
  categoryNames: string[]
  createdAt: string
  updatedAt: string
}

export interface ProductDetail extends ProductSummary {
  description?: string
  shortDescription?: string
  sku?: string
  barcode?: string
  isDigital: boolean
  trackInventory: boolean
  lowStockThreshold?: number
  allowBackorder: boolean
  weight?: number
  dimensions?: ProductDimensions
  images: ProductImageData[]
  variants: ProductVariantData[]
  attributes: Array<{ name: string; value: string; isVisible: boolean }>
  optionGroups: Array<{
    id: string
    name: string
    type: string
    options: Array<{ id: string; label: string; value: string; colorHex?: string; imageUrl?: string }>
  }>
  tags: string[]
  metaTitle?: string
  metaDescription?: string
  relatedProductIds: string[]
  publishedAt?: string
}

// ============================================================
// ORDER TYPES
// ============================================================

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'ON_HOLD'

export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export interface OrderAddress {
  firstName: string
  lastName: string
  company?: string
  street: string
  street2?: string
  city: string
  state: string
  zip: string
  country: string
  phone?: string
}

export interface OrderItemData {
  id: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  sku?: string
  imageUrl?: string
  optionValues?: Array<{ name: string; value: string }>
  quantity: number
  unitPrice: number
  totalPrice: number
  discountAmount: number
}

export interface AppliedPromotion {
  id: string
  name: string
  type: string
  discountAmount: number
}

export interface OrderSummary {
  id: string
  storeId: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  customerName?: string
  customerEmail?: string
  total: number
  currency: string
  itemCount: number
  createdAt: string
  updatedAt: string
}

export interface OrderDetail extends OrderSummary {
  customerId?: string
  items: OrderItemData[]
  subtotal: number
  discountAmount: number
  shippingAmount: number
  taxAmount: number
  shippingAddress?: OrderAddress
  billingAddress?: OrderAddress
  paymentMethodId?: string
  paymentMethodName?: string
  paymentData?: Record<string, unknown>
  couponCode?: string
  appliedPromotions?: AppliedPromotion[]
  customerNotes?: string
  internalNotes?: string
  timeline: Array<{
    id: string
    status: string
    note?: string
    isInternal: boolean
    createdBy?: string
    createdAt: string
  }>
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItemDisplay {
  id: string
  productId: string
  variantId?: string
  productName: string
  variantName?: string
  imageUrl?: string
  price: number
  compareAtPrice?: number
  quantity: number
  totalPrice: number
  discountAmount: number
  optionValues?: Array<{ name: string; value: string }>
  inStock: boolean
}

export interface CartTotals {
  subtotal: number
  discountAmount: number
  shippingAmount: number
  taxAmount: number
  total: number
  currency: string
  itemCount: number
  savings: number
}

export interface CartState {
  token: string
  storeId: string
  items: CartItemDisplay[]
  totals: CartTotals
  couponCode?: string
  appliedPromotions: AppliedPromotion[]
  config: CartConfigData
}

// ============================================================
// PROMOTIONS
// ============================================================

export type PromotionType =
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'BUY_X_GET_Y'
  | 'FREE_SHIPPING'
  | 'GIFT'

export type PromotionTarget =
  | 'ALL'
  | 'PRODUCT'
  | 'CATEGORY'
  | 'COLLECTION'
  | 'CART_VALUE'

// ============================================================
// PAYMENT METHODS
// ============================================================

export type PaymentMethodType =
  | 'BANK_TRANSFER'
  | 'CASH_ON_DELIVERY'
  | 'CUSTOM_BLOCKS'
  | 'EXTERNAL_LINK'
  | 'MANUAL'

export interface PaymentBlock {
  type: 'heading' | 'paragraph' | 'info_box' | 'account_info' | 'image' | 'divider' | 'link'
  content: string
  props?: Record<string, unknown>
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  message: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ============================================================
// STORE METRICS
// ============================================================

export interface StoreMetrics {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  activeProducts: number
  pendingOrders: number
  totalCustomers: number
  recentOrders: OrderSummary[]
  currency: string
}

// ============================================================
// ADMIN SESSION
// ============================================================

export interface AdminSession {
  id: string
  email: string
  name?: string
  role: 'SUPERADMIN' | 'ADMIN' | 'VIEWER'
}
