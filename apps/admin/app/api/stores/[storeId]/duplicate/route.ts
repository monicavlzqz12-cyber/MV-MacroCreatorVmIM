import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@store-builder/database'

// Prisma requires Prisma.JsonNull instead of null for nullable JSON fields
function j(v: Prisma.JsonValue | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined
  if (v === null) return Prisma.JsonNull
  return v as Prisma.InputJsonValue
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const original = await prisma.store.findUnique({
    where: { id: params.storeId },
    include: {
      config: true,
      theme: true,
      cartConfig: true,
    },
  })

  if (!original) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Generate unique slug
  let newSlug = `${original.slug}-copy`
  let attempt = 0
  while (await prisma.store.findUnique({ where: { slug: newSlug } })) {
    attempt++
    newSlug = `${original.slug}-copy-${attempt}`
  }

  // Create new store
  const newStore = await prisma.store.create({
    data: {
      name: `${original.name} (Copy)`,
      slug: newSlug,
      description: original.description,
      status: 'DRAFT',
    },
  })

  // Copy config
  if (original.config) {
    const c = original.config
    await prisma.storeConfig.create({
      data: {
        storeId: newStore.id,
        logoUrl: c.logoUrl, faviconUrl: c.faviconUrl, coverImageUrl: c.coverImageUrl,
        primaryColor: c.primaryColor, secondaryColor: c.secondaryColor, accentColor: c.accentColor,
        backgroundColor: c.backgroundColor, surfaceColor: c.surfaceColor,
        fontHeading: c.fontHeading, fontBody: c.fontBody, borderRadius: c.borderRadius,
        currency: c.currency, currencySymbol: c.currencySymbol, currencyPosition: c.currencyPosition,
        currencyDecimals: c.currencyDecimals, language: c.language, country: c.country,
        timezone: c.timezone, weightUnit: c.weightUnit, dimensionUnit: c.dimensionUnit,
        metaTitle: c.metaTitle, metaDescription: c.metaDescription, metaKeywords: c.metaKeywords,
        ogImageUrl: c.ogImageUrl, canonicalUrl: c.canonicalUrl,
        contactEmail: c.contactEmail, contactPhone: c.contactPhone,
        emailFromName: c.emailFromName, emailFromAddress: c.emailFromAddress, emailReplyTo: c.emailReplyTo,
        googleAnalyticsId: c.googleAnalyticsId, metaPixelId: c.metaPixelId,
        customHeadScripts: c.customHeadScripts, customBodyScripts: c.customBodyScripts,
        smtpConfigEncrypted: null, // Never copy SMTP credentials
        address: j(c.address), socialLinks: j(c.socialLinks), globalTexts: j(c.globalTexts),
        banners: j(c.banners), customBadges: j(c.customBadges), contentBlocks: j(c.contentBlocks),
        layoutOptions: j(c.layoutOptions), seoSettings: j(c.seoSettings), checkoutConfig: j(c.checkoutConfig),
      },
    })
  }

  // Copy theme
  if (original.theme) {
    const t = original.theme
    await prisma.storeTheme.create({
      data: {
        storeId: newStore.id,
        presetName: t.presetName, cardStyle: t.cardStyle, cardShowRating: t.cardShowRating,
        cardShowBadges: t.cardShowBadges, cardShowQuickAdd: t.cardShowQuickAdd,
        cardImageRatio: t.cardImageRatio, cardHoverEffect: t.cardHoverEffect, cardPricePosition: t.cardPricePosition,
        headerStyle: t.headerStyle, headerSticky: t.headerSticky, headerShowSearch: t.headerShowSearch,
        headerShowCart: t.headerShowCart, headerLogoMaxHeight: t.headerLogoMaxHeight, headerNavLayout: t.headerNavLayout,
        footerStyle: t.footerStyle, buttonStyle: t.buttonStyle, buttonRadius: t.buttonRadius,
        listingDefaultView: t.listingDefaultView, listingColumns: t.listingColumns,
        listingShowFilters: t.listingShowFilters, listingShowSort: t.listingShowSort, listingShowCount: t.listingShowCount,
        pdpLayout: t.pdpLayout, pdpShowRelated: t.pdpShowRelated, pdpRelatedCount: t.pdpRelatedCount,
        pdpImageLayout: t.pdpImageLayout, pdpShowShare: t.pdpShowShare, pdpShowSku: t.pdpShowSku, pdpShowStock: t.pdpShowStock,
        priceShowOriginal: t.priceShowOriginal, priceShowSavings: t.priceShowSavings, priceShowSavingsPct: t.priceShowSavingsPct,
        priceColorDiscount: t.priceColorDiscount, priceColorOriginal: t.priceColorOriginal,
        customCss: t.customCss,
        footerColumns: j(t.footerColumns), typographyScale: j(t.typographyScale), componentConfig: j(t.componentConfig),
      },
    })
  }

  // Copy cart config
  if (original.cartConfig) {
    const cc = original.cartConfig
    await prisma.cartConfig.create({
      data: {
        storeId: newStore.id,
        mode: cc.mode, style: cc.style, position: cc.position, size: cc.size,
        showImages: cc.showImages, showVariantOptions: cc.showVariantOptions, showQuantity: cc.showQuantity,
        showRemove: cc.showRemove, showSubtotal: cc.showSubtotal, showSavings: cc.showSavings,
        showItemCount: cc.showItemCount, showShipping: cc.showShipping, showTaxes: cc.showTaxes,
        showPromoCode: cc.showPromoCode, showProgress: cc.showProgress,
        freeShippingThreshold: cc.freeShippingThreshold,
        showUpsells: cc.showUpsells, upsellTitle: cc.upsellTitle, upsellProductIds: cc.upsellProductIds,
        upsellMaxItems: cc.upsellMaxItems, showCrossSells: cc.showCrossSells, crossSellTitle: cc.crossSellTitle,
        crossSellMaxItems: cc.crossSellMaxItems, cartTitle: cc.cartTitle, emptyTitle: cc.emptyTitle,
        emptyMessage: cc.emptyMessage, checkoutButtonText: cc.checkoutButtonText,
        continueShoppingText: cc.continueShoppingText, orderSummaryTitle: cc.orderSummaryTitle,
        persistDays: cc.persistDays,
        styleTokens: j(cc.styleTokens), blocks: j(cc.blocks), triggerConfig: j(cc.triggerConfig),
      },
    })
  }

  // Copy categories
  const categories = await prisma.category.findMany({ where: { storeId: params.storeId } })
  const categoryIdMap = new Map<string, string>()
  // First pass: create root categories
  for (const cat of categories.filter((c) => !c.parentId)) {
    const { id: oldId, storeId: _storeId, createdAt: _ca, updatedAt: _ua, ...catData } = cat
    const newCat = await prisma.category.create({ data: { ...catData, storeId: newStore.id } })
    categoryIdMap.set(oldId, newCat.id)
  }
  // Second pass: create child categories
  for (const cat of categories.filter((c) => c.parentId)) {
    const { id: oldId, storeId: _storeId, createdAt: _ca, updatedAt: _ua, ...catData } = cat
    const newCat = await prisma.category.create({
      data: {
        ...catData,
        storeId: newStore.id,
        parentId: catData.parentId ? (categoryIdMap.get(catData.parentId) ?? null) : null,
      },
    })
    categoryIdMap.set(oldId, newCat.id)
  }

  // Copy collections
  const collections = await prisma.collection.findMany({ where: { storeId: params.storeId } })
  const collectionIdMap = new Map<string, string>()
  for (const col of collections) {
    const newCol = await prisma.collection.create({
      data: {
        storeId: newStore.id,
        name: col.name, slug: col.slug, description: col.description,
        imageUrl: col.imageUrl, isAutomatic: col.isAutomatic,
        metaTitle: col.metaTitle, metaDescription: col.metaDescription,
        sortOrder: col.sortOrder, isActive: col.isActive,
        rules: j(col.rules),
      },
    })
    collectionIdMap.set(col.id, newCol.id)
  }

  // Copy products
  const products = await prisma.product.findMany({
    where: { storeId: params.storeId },
    include: { images: true, variants: true, attributes: true },
  })

  for (const product of products) {
    const newProduct = await prisma.product.create({
      data: {
        storeId: newStore.id,
        name: product.name, slug: product.slug, description: product.description,
        shortDescription: product.shortDescription, sku: product.sku, barcode: product.barcode,
        status: 'DRAFT', featured: product.featured, isDigital: product.isDigital,
        basePrice: product.basePrice, compareAtPrice: product.compareAtPrice, costPrice: product.costPrice,
        trackInventory: product.trackInventory, inventoryCount: product.inventoryCount,
        lowStockThreshold: product.lowStockThreshold, allowBackorder: product.allowBackorder,
        weight: product.weight, hasVariants: product.hasVariants,
        metaTitle: product.metaTitle, metaDescription: product.metaDescription,
        badgeLabel: product.badgeLabel, badgeColor: product.badgeColor,
        sortOrder: product.sortOrder, tags: product.tags,
        dimensions: j(product.dimensions),
        images: {
          create: product.images.map(({ id: _id, productId: _pid, createdAt: _ca, ...img }) => img),
        },
        attributes: {
          create: product.attributes.map(({ id: _id, productId: _pid, ...attr }) => attr),
        },
      },
    })

    // Copy variants
    for (const variant of product.variants) {
      await prisma.productVariant.create({
        data: {
          productId: newProduct.id,
          name: variant.name, sku: variant.sku, barcode: variant.barcode,
          price: variant.price, compareAtPrice: variant.compareAtPrice, costPrice: variant.costPrice,
          inventoryCount: variant.inventoryCount, weight: variant.weight,
          imageUrl: variant.imageUrl, sortOrder: variant.sortOrder,
          isDefault: variant.isDefault, isActive: variant.isActive,
          options: variant.options as Prisma.InputJsonValue,
        },
      })
    }
  }

  // Copy payment methods
  const paymentMethods = await prisma.paymentMethod.findMany({ where: { storeId: params.storeId } })
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.create({
      data: {
        storeId: newStore.id,
        name: pm.name, description: pm.description, type: pm.type,
        instructions: pm.instructions, redirectUrl: pm.redirectUrl,
        isActive: pm.isActive, sortOrder: pm.sortOrder,
        templateBlocks: j(pm.templateBlocks), config: j(pm.config),
      },
    })
  }

  // Copy email templates
  const emailTemplates = await prisma.emailTemplate.findMany({ where: { storeId: params.storeId } })
  for (const et of emailTemplates) {
    const { id: _id, storeId: _storeId, createdAt: _ca, updatedAt: _ua, ...etData } = et
    await prisma.emailTemplate.create({ data: { ...etData, storeId: newStore.id } })
  }

  // Copy promotions
  const promotions = await prisma.promotion.findMany({
    where: { storeId: params.storeId },
    include: { items: true },
  })
  for (const promo of promotions) {
    const { id: _id, storeId: _storeId, createdAt: _ca, updatedAt: _ua, items, ...promoData } = promo
    const newPromo = await prisma.promotion.create({
      data: { ...promoData, storeId: newStore.id, currentUses: 0, discountValue: promoData.discountValue.toString() as unknown as number },
    })
    for (const item of items) {
      const { id: _iid, promotionId: _pid, ...itemData } = item
      await prisma.promotionItem.create({ data: { ...itemData, promotionId: newPromo.id } })
    }
  }

  return NextResponse.json({ data: newStore }, { status: 201 })
}
