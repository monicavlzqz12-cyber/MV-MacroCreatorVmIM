import { prisma } from '@store-builder/database'
import { cache } from 'react'
import type {
  StoreConfigData,
  StoreThemeData,
  CartConfigData,
  ProductSummary,
  ProductDetail,
  CartItemDisplay,
  CartTotals,
  AppliedPromotion,
} from '@store-builder/types'

// ============================================================
// TYPE HELPERS
// ============================================================

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  // Prisma Decimal has .toNumber()
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

function jsonAs<T>(val: unknown): T | undefined {
  if (val === null || val === undefined) return undefined
  return val as T
}

// ============================================================
// STORE
// ============================================================

export interface StoreWithRelations {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  config: StoreConfigData | null
  theme: StoreThemeData | null
  cartConfig: CartConfigData | null
  paymentMethods: Array<{
    id: string
    name: string
    description: string | null
    type: string
    instructions: string | null
    templateBlocks: unknown
    redirectUrl: string | null
    isActive: boolean
    sortOrder: number
  }>
}

export const getStoreBySlug = cache(async (slug: string): Promise<StoreWithRelations | null> => {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      config: true,
      theme: true,
      cartConfig: true,
      paymentMethods: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!store || store.status !== 'ACTIVE') return null

  const config = store.config
    ? ({
        logoUrl: store.config.logoUrl ?? undefined,
        faviconUrl: store.config.faviconUrl ?? undefined,
        coverImageUrl: store.config.coverImageUrl ?? undefined,
        primaryColor: store.config.primaryColor,
        secondaryColor: store.config.secondaryColor,
        accentColor: store.config.accentColor,
        backgroundColor: store.config.backgroundColor,
        surfaceColor: store.config.surfaceColor,
        fontHeading: store.config.fontHeading,
        fontBody: store.config.fontBody,
        borderRadius: store.config.borderRadius as StoreConfigData['borderRadius'],
        currency: store.config.currency,
        currencySymbol: store.config.currencySymbol,
        currencyPosition: store.config.currencyPosition as 'before' | 'after',
        currencyDecimals: store.config.currencyDecimals,
        language: store.config.language,
        country: store.config.country,
        timezone: store.config.timezone,
        weightUnit: store.config.weightUnit as StoreConfigData['weightUnit'],
        dimensionUnit: store.config.dimensionUnit as StoreConfigData['dimensionUnit'],
        metaTitle: store.config.metaTitle ?? undefined,
        metaDescription: store.config.metaDescription ?? undefined,
        metaKeywords: store.config.metaKeywords ?? undefined,
        ogImageUrl: store.config.ogImageUrl ?? undefined,
        canonicalUrl: store.config.canonicalUrl ?? undefined,
        contactEmail: store.config.contactEmail ?? undefined,
        contactPhone: store.config.contactPhone ?? undefined,
        emailFromName: store.config.emailFromName ?? undefined,
        emailFromAddress: store.config.emailFromAddress ?? undefined,
        emailReplyTo: store.config.emailReplyTo ?? undefined,
        googleAnalyticsId: store.config.googleAnalyticsId ?? undefined,
        metaPixelId: store.config.metaPixelId ?? undefined,
        address: jsonAs(store.config.address),
        socialLinks: jsonAs(store.config.socialLinks),
        globalTexts: jsonAs(store.config.globalTexts),
        banners: jsonAs(store.config.banners),
        customBadges: jsonAs(store.config.customBadges),
        contentBlocks: jsonAs(store.config.contentBlocks),
        layoutOptions: jsonAs(store.config.layoutOptions),
        checkoutConfig: jsonAs(store.config.checkoutConfig),
      } satisfies StoreConfigData)
    : null

  const theme = store.theme
    ? ({
        presetName: store.theme.presetName,
        cardStyle: store.theme.cardStyle as StoreThemeData['cardStyle'],
        cardShowRating: store.theme.cardShowRating,
        cardShowBadges: store.theme.cardShowBadges,
        cardShowQuickAdd: store.theme.cardShowQuickAdd,
        cardImageRatio: store.theme.cardImageRatio as StoreThemeData['cardImageRatio'],
        cardHoverEffect: store.theme.cardHoverEffect as StoreThemeData['cardHoverEffect'],
        cardPricePosition: store.theme.cardPricePosition as StoreThemeData['cardPricePosition'],
        headerStyle: store.theme.headerStyle as StoreThemeData['headerStyle'],
        headerSticky: store.theme.headerSticky,
        headerShowSearch: store.theme.headerShowSearch,
        headerShowCart: store.theme.headerShowCart,
        headerLogoMaxHeight: store.theme.headerLogoMaxHeight,
        headerNavLayout: store.theme.headerNavLayout as StoreThemeData['headerNavLayout'],
        footerStyle: store.theme.footerStyle,
        footerColumns: jsonAs(store.theme.footerColumns),
        buttonStyle: store.theme.buttonStyle as StoreThemeData['buttonStyle'],
        buttonRadius: store.theme.buttonRadius as StoreThemeData['buttonRadius'],
        listingDefaultView: store.theme.listingDefaultView as StoreThemeData['listingDefaultView'],
        listingColumns: store.theme.listingColumns as StoreThemeData['listingColumns'],
        listingShowFilters: store.theme.listingShowFilters,
        listingShowSort: store.theme.listingShowSort,
        listingShowCount: store.theme.listingShowCount,
        pdpLayout: store.theme.pdpLayout as StoreThemeData['pdpLayout'],
        pdpShowRelated: store.theme.pdpShowRelated,
        pdpRelatedCount: store.theme.pdpRelatedCount,
        pdpImageLayout: store.theme.pdpImageLayout as StoreThemeData['pdpImageLayout'],
        pdpShowShare: store.theme.pdpShowShare,
        pdpShowSku: store.theme.pdpShowSku,
        pdpShowStock: store.theme.pdpShowStock,
        priceShowOriginal: store.theme.priceShowOriginal,
        priceShowSavings: store.theme.priceShowSavings,
        priceShowSavingsPct: store.theme.priceShowSavingsPct,
        priceColorDiscount: store.theme.priceColorDiscount,
        priceColorOriginal: store.theme.priceColorOriginal,
        customCss: store.theme.customCss ?? undefined,
      } satisfies StoreThemeData)
    : null

  const cartConfig = store.cartConfig
    ? ({
        mode: store.cartConfig.mode as CartConfigData['mode'],
        style: store.cartConfig.style as CartConfigData['style'],
        position: store.cartConfig.position as 'right' | 'left',
        size: store.cartConfig.size as 'sm' | 'md' | 'lg',
        showImages: store.cartConfig.showImages,
        showVariantOptions: store.cartConfig.showVariantOptions,
        showQuantity: store.cartConfig.showQuantity,
        showRemove: store.cartConfig.showRemove,
        showSubtotal: store.cartConfig.showSubtotal,
        showSavings: store.cartConfig.showSavings,
        showItemCount: store.cartConfig.showItemCount,
        showShipping: store.cartConfig.showShipping,
        showTaxes: store.cartConfig.showTaxes,
        showPromoCode: store.cartConfig.showPromoCode,
        showProgress: store.cartConfig.showProgress,
        freeShippingThreshold: store.cartConfig.freeShippingThreshold
          ? toNumber(store.cartConfig.freeShippingThreshold)
          : undefined,
        showUpsells: store.cartConfig.showUpsells,
        upsellTitle: store.cartConfig.upsellTitle ?? undefined,
        upsellProductIds: store.cartConfig.upsellProductIds,
        upsellMaxItems: store.cartConfig.upsellMaxItems,
        showCrossSells: store.cartConfig.showCrossSells,
        crossSellTitle: store.cartConfig.crossSellTitle ?? undefined,
        crossSellMaxItems: store.cartConfig.crossSellMaxItems,
        cartTitle: store.cartConfig.cartTitle ?? undefined,
        emptyTitle: store.cartConfig.emptyTitle ?? undefined,
        emptyMessage: store.cartConfig.emptyMessage ?? undefined,
        checkoutButtonText: store.cartConfig.checkoutButtonText ?? undefined,
        continueShoppingText: store.cartConfig.continueShoppingText ?? undefined,
        orderSummaryTitle: store.cartConfig.orderSummaryTitle ?? undefined,
        persistDays: store.cartConfig.persistDays,
        styleTokens: jsonAs(store.cartConfig.styleTokens),
        blocks: jsonAs(store.cartConfig.blocks),
        triggerConfig: jsonAs(store.cartConfig.triggerConfig),
      } satisfies CartConfigData)
    : null

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    domain: store.domain,
    status: store.status,
    config,
    theme,
    cartConfig,
    paymentMethods: store.paymentMethods.map((pm) => ({
      id: pm.id,
      name: pm.name,
      description: pm.description,
      type: pm.type,
      instructions: pm.instructions,
      templateBlocks: pm.templateBlocks,
      redirectUrl: pm.redirectUrl,
      isActive: pm.isActive,
      sortOrder: pm.sortOrder,
    })),
  }
})

// ============================================================
// PRODUCTS
// ============================================================

export interface GetStoreProductsParams {
  search?: string
  categorySlug?: string
  collectionSlug?: string
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'featured'
  page?: number
  pageSize?: number
  featured?: boolean
}

export async function getStoreProducts(
  storeId: string,
  params: GetStoreProductsParams = {},
): Promise<{ products: ProductSummary[]; total: number; totalPages: number }> {
  const {
    search,
    categorySlug,
    collectionSlug,
    sortBy = 'newest',
    page = 1,
    pageSize = 20,
    featured,
  } = params

  const where: Record<string, unknown> = {
    storeId,
    status: 'ACTIVE',
  }

  if (search) {
    where['OR'] = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (featured !== undefined) {
    where['featured'] = featured
  }

  if (categorySlug) {
    where['categories'] = {
      some: {
        category: { slug: categorySlug, storeId, isActive: true },
      },
    }
  }

  if (collectionSlug) {
    where['collections'] = {
      some: {
        collection: { slug: collectionSlug, storeId, isActive: true },
      },
    }
  }

  const orderBy = (() => {
    switch (sortBy) {
      case 'price_asc':
        return [{ basePrice: 'asc' as const }]
      case 'price_desc':
        return [{ basePrice: 'desc' as const }]
      case 'featured':
        return [{ featured: 'desc' as const }, { sortOrder: 'asc' as const }]
      case 'newest':
      default:
        return [{ publishedAt: 'desc' as const }, { createdAt: 'desc' as const }]
    }
  })()

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        categories: {
          include: { category: { select: { name: true } } },
        },
      },
    }),
  ])

  const summaries: ProductSummary[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    status: p.status as ProductSummary['status'],
    basePrice: toNumber(p.basePrice),
    compareAtPrice: p.compareAtPrice ? toNumber(p.compareAtPrice) : undefined,
    imageUrl: p.images[0]?.url ?? p.images[0]?.url ?? undefined,
    inventoryCount: p.inventoryCount ?? undefined,
    featured: p.featured,
    hasVariants: p.hasVariants,
    badgeLabel: p.badgeLabel ?? undefined,
    badgeColor: p.badgeColor ?? undefined,
    categoryNames: p.categories.map((c) => c.category.name),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

  return {
    products: summaries,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getProductBySlug(
  storeId: string,
  slug: string,
): Promise<ProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { storeId_slug: { storeId, slug } },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      },
      attributes: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
      },
      optionGroups: {
        orderBy: { sortOrder: 'asc' },
        include: {
          options: { orderBy: { sortOrder: 'asc' } },
        },
      },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      relatedProducts: {
        orderBy: { sortOrder: 'asc' },
        take: 8,
        include: {
          related: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  })

  if (!product || product.status !== 'ACTIVE') return null

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status as ProductDetail['status'],
    basePrice: toNumber(product.basePrice),
    compareAtPrice: product.compareAtPrice ? toNumber(product.compareAtPrice) : undefined,
    imageUrl: product.images[0]?.url ?? undefined,
    inventoryCount: product.inventoryCount ?? undefined,
    featured: product.featured,
    hasVariants: product.hasVariants,
    badgeLabel: product.badgeLabel ?? undefined,
    badgeColor: product.badgeColor ?? undefined,
    categoryNames: product.categories.map((c) => c.category.name),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    description: product.description ?? undefined,
    shortDescription: product.shortDescription ?? undefined,
    sku: product.sku ?? undefined,
    barcode: product.barcode ?? undefined,
    isDigital: product.isDigital,
    trackInventory: product.trackInventory,
    lowStockThreshold: product.lowStockThreshold ?? undefined,
    allowBackorder: product.allowBackorder,
    weight: product.weight ? toNumber(product.weight) : undefined,
    dimensions: jsonAs(product.dimensions),
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt ?? undefined,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku ?? undefined,
      price: toNumber(v.price),
      compareAtPrice: v.compareAtPrice ? toNumber(v.compareAtPrice) : undefined,
      inventoryCount: v.inventoryCount ?? undefined,
      options: (v.options as unknown as Array<{
        groupId: string
        groupName: string
        optionId: string
        optionLabel: string
        optionValue: string
        colorHex?: string
        imageUrl?: string
      }>),
      imageUrl: v.imageUrl ?? undefined,
      isDefault: v.isDefault,
      isActive: v.isActive,
    })),
    attributes: product.attributes.map((a) => ({
      name: a.name,
      value: a.value,
      isVisible: a.isVisible,
    })),
    optionGroups: product.optionGroups.map((og) => ({
      id: og.id,
      name: og.name,
      type: og.type,
      options: og.options.map((o) => ({
        id: o.id,
        label: o.label,
        value: o.value,
        colorHex: o.colorHex ?? undefined,
        imageUrl: o.imageUrl ?? undefined,
      })),
    })),
    tags: product.tags,
    metaTitle: product.metaTitle ?? undefined,
    metaDescription: product.metaDescription ?? undefined,
    relatedProductIds: product.relatedProducts.map((r) => r.relatedId),
    publishedAt: product.publishedAt?.toISOString() ?? undefined,
  }
}

// ============================================================
// COLLECTIONS
// ============================================================

export interface CollectionSummary {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isAutomatic: boolean
  sortOrder: number
  productCount: number
}

export async function getStoreCollections(storeId: string): Promise<CollectionSummary[]> {
  const collections = await prisma.collection.findMany({
    where: { storeId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    isAutomatic: c.isAutomatic,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
  }))
}

export async function getCollectionBySlug(
  storeId: string,
  slug: string,
): Promise<CollectionSummary | null> {
  const col = await prisma.collection.findFirst({
    where: { storeId, slug, isActive: true },
    include: { _count: { select: { products: true } } },
  })

  if (!col) return null

  return {
    id: col.id,
    name: col.name,
    slug: col.slug,
    description: col.description,
    imageUrl: col.imageUrl,
    isAutomatic: col.isAutomatic,
    sortOrder: col.sortOrder,
    productCount: col._count.products,
  }
}

// ============================================================
// CATEGORIES
// ============================================================

export interface CategorySummary {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: string | null
  sortOrder: number
  productCount?: number
}

export async function getStoreCategories(storeId: string): Promise<CategorySummary[]> {
  const categories = await prisma.category.findMany({
    where: { storeId, isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { products: true } },
    },
  })

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    productCount: c._count.products,
  }))
}

// ============================================================
// PROMOTIONS
// ============================================================

export interface ActivePromotion {
  id: string
  name: string
  type: string
  target: string
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  productIds: string[]
  categoryIds: string[]
  collectionIds: string[]
  badgeLabel: string | null
  badgeColor: string | null
  badgeTextColor: string | null
  isStackable: boolean
  priority: number
}

export async function getActivePromotions(storeId: string): Promise<ActivePromotion[]> {
  const now = new Date()
  const promotions = await prisma.promotion.findMany({
    where: {
      storeId,
      isActive: true,
      isAutoApply: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: {
      items: true,
    },
    orderBy: { priority: 'desc' },
  })

  return promotions.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    target: p.target,
    discountValue: toNumber(p.discountValue),
    maxDiscountAmount: p.maxDiscountAmount ? toNumber(p.maxDiscountAmount) : null,
    minOrderAmount: p.minOrderAmount ? toNumber(p.minOrderAmount) : null,
    productIds: p.items.filter((i) => i.productId).map((i) => i.productId!),
    categoryIds: p.items.filter((i) => i.categoryId).map((i) => i.categoryId!),
    collectionIds: p.items.filter((i) => i.collectionId).map((i) => i.collectionId!),
    badgeLabel: p.badgeLabel,
    badgeColor: p.badgeColor,
    badgeTextColor: p.badgeTextColor,
    isStackable: p.isStackable,
    priority: p.priority,
  }))
}

// ============================================================
// CART
// ============================================================

export interface CartWithTotalsResult {
  cartId: string
  token: string
  items: CartItemDisplay[]
  totals: CartTotals
  couponCode: string | undefined
  appliedPromotions: AppliedPromotion[]
}

export async function getOrCreateCart(
  storeId: string,
  token?: string,
): Promise<{ cartId: string; token: string }> {
  const { generateCartToken } = await import('./cart-utils')

  if (token) {
    const existing = await prisma.cart.findFirst({
      where: { token, storeId, expiresAt: { gte: new Date() } },
      select: { id: true, token: true },
    })
    if (existing) return { cartId: existing.id, token: existing.token }
  }

  const newToken = token ?? generateCartToken()
  const persistDays = 7 // default; could fetch from cartConfig

  const cart = await prisma.cart.upsert({
    where: { token: newToken },
    update: {
      expiresAt: new Date(Date.now() + persistDays * 24 * 60 * 60 * 1000),
    },
    create: {
      storeId,
      token: newToken,
      expiresAt: new Date(Date.now() + persistDays * 24 * 60 * 60 * 1000),
    },
    select: { id: true, token: true },
  })

  return { cartId: cart.id, token: cart.token }
}

export async function getCartWithTotals(
  storeId: string,
  token: string,
): Promise<CartWithTotalsResult | null> {
  const cart = await prisma.cart.findFirst({
    where: { token, storeId, expiresAt: { gte: new Date() } },
    include: {
      items: {
        include: {
          variant: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!cart) return null

  // Load product data for each cart item
  const productIds = [...new Set(cart.items.map((i) => i.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, storeId, status: 'ACTIVE' },
    include: {
      images: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  const cartItems: CartItemDisplay[] = []
  for (const item of cart.items) {
    const product = productMap.get(item.productId)
    if (!product) continue

    const variant = item.variant
    const price = variant
      ? toNumber(variant.price)
      : item.price
        ? toNumber(item.price)
        : toNumber(product.basePrice)
    const compareAtPrice = variant?.compareAtPrice
      ? toNumber(variant.compareAtPrice)
      : product.compareAtPrice
        ? toNumber(product.compareAtPrice)
        : undefined

    const inventoryCount = variant?.inventoryCount ?? product.inventoryCount
    const inStock =
      !product.trackInventory ||
      product.allowBackorder ||
      (inventoryCount !== null && inventoryCount !== undefined && inventoryCount > 0)

    cartItems.push({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      productName: item.productName ?? product.name,
      variantName: item.variantName ?? variant?.name ?? undefined,
      imageUrl:
        item.imageUrl ??
        variant?.imageUrl ??
        product.images[0]?.url ??
        undefined,
      price,
      compareAtPrice,
      quantity: item.quantity,
      totalPrice: price * item.quantity,
      discountAmount: 0, // calculated below
      optionValues: variant
        ? (variant.options as Array<{ groupName: string; optionLabel: string }>).map((o) => ({
            name: o.groupName,
            value: o.optionLabel,
          }))
        : undefined,
      inStock,
    })
  }

  // Apply promotions
  const promotions = await getActivePromotions(storeId)
  const { appliedPromotions, totalDiscount } = calculatePromotionDiscounts(cartItems, promotions)

  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const savings = cartItems.reduce((sum, item) => {
    const compareDiscount =
      item.compareAtPrice && item.compareAtPrice > item.price
        ? (item.compareAtPrice - item.price) * item.quantity
        : 0
    return sum + compareDiscount
  }, 0)

  const totals: CartTotals = {
    subtotal,
    discountAmount: totalDiscount,
    shippingAmount: 0,
    taxAmount: 0,
    total: Math.max(0, subtotal - totalDiscount),
    currency: 'USD', // will be overridden by store config in client
    itemCount: cartItems.reduce((sum, i) => sum + i.quantity, 0),
    savings: savings + totalDiscount,
  }

  return {
    cartId: cart.id,
    token: cart.token,
    items: cartItems,
    totals,
    couponCode: cart.couponCode ?? undefined,
    appliedPromotions,
  }
}

// ============================================================
// PROMOTIONS ENGINE (simplified)
// ============================================================

function calculatePromotionDiscounts(
  items: CartItemDisplay[],
  promotions: ActivePromotion[],
): { appliedPromotions: AppliedPromotion[]; totalDiscount: number } {
  const appliedPromotions: AppliedPromotion[] = []
  let totalDiscount = 0
  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)

  for (const promo of promotions) {
    // Check minimum order amount
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) continue

    let discount = 0

    if (promo.type === 'PERCENTAGE_DISCOUNT') {
      const eligibleItems = getEligibleItems(items, promo)
      const eligibleSubtotal = eligibleItems.reduce((sum, i) => sum + i.totalPrice, 0)
      discount = (eligibleSubtotal * promo.discountValue) / 100
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount)
      }
    } else if (promo.type === 'FIXED_DISCOUNT') {
      const eligibleItems = getEligibleItems(items, promo)
      if (eligibleItems.length > 0) {
        discount = promo.discountValue
      }
    } else if (promo.type === 'FREE_SHIPPING') {
      // Handled separately
      discount = 0
    }

    if (discount > 0) {
      totalDiscount += discount
      appliedPromotions.push({
        id: promo.id,
        name: promo.name,
        type: promo.type,
        discountAmount: discount,
      })

      // Stop applying if not stackable
      if (!promo.isStackable) break
    }
  }

  return { appliedPromotions, totalDiscount }
}

function getEligibleItems(
  items: CartItemDisplay[],
  promo: ActivePromotion,
): CartItemDisplay[] {
  if (promo.target === 'ALL') return items
  if (promo.target === 'PRODUCT' && promo.productIds.length > 0) {
    return items.filter((i) => promo.productIds.includes(i.productId))
  }
  return items
}
