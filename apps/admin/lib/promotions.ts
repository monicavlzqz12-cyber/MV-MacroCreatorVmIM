// ============================================================
// PROMOTIONS ENGINE
// ============================================================

export interface CartLineItem {
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  categoryIds: string[]
  collectionIds: string[]
}

export interface PromotionRule {
  id: string
  name: string
  type: string
  target: string
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderAmount?: number | null
  minQuantity?: number | null
  isAutoApply: boolean
  isStackable: boolean
  priority: number
  startsAt?: Date | null
  endsAt?: Date | null
  maxUses?: number | null
  currentUses: number
  isActive: boolean
  items: Array<{
    productId?: string | null
    categoryId?: string | null
    collectionId?: string | null
  }>
}

export interface CouponRule {
  id: string
  code: string
  type?: string | null
  discountValue?: number | null
  target: string
  minOrderAmount?: number | null
  maxDiscountAmount?: number | null
  maxUses?: number | null
  currentUses: number
  maxUsesPerUser?: number | null
  startsAt?: Date | null
  endsAt?: Date | null
  isActive: boolean
  promotion?: PromotionRule | null
}

export interface AppliedDiscount {
  promotionId: string
  promotionName: string
  type: string
  discountAmount: number
}

export interface CartCalculationResult {
  lineItems: Array<
    CartLineItem & {
      discountAmount: number
      finalPrice: number
    }
  >
  subtotal: number
  discountAmount: number
  shippingDiscount: boolean
  total: number
  appliedPromotions: AppliedDiscount[]
}

export function isPromotionValid(promo: PromotionRule): boolean {
  if (!promo.isActive) return false
  if (promo.maxUses !== null && promo.maxUses !== undefined && promo.currentUses >= promo.maxUses) {
    return false
  }
  const now = new Date()
  if (promo.startsAt && now < promo.startsAt) return false
  if (promo.endsAt && now > promo.endsAt) return false
  return true
}

export function validateCoupon(
  coupon: CouponRule,
  cart: { subtotal: number; itemCount: number },
): { valid: boolean; reason?: string } {
  if (!coupon.isActive) {
    return { valid: false, reason: 'Coupon is not active' }
  }

  const now = new Date()
  if (coupon.startsAt && now < coupon.startsAt) {
    return { valid: false, reason: 'Coupon is not yet valid' }
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    return { valid: false, reason: 'Coupon has expired' }
  }

  if (
    coupon.maxUses !== null &&
    coupon.maxUses !== undefined &&
    coupon.currentUses >= coupon.maxUses
  ) {
    return { valid: false, reason: 'Coupon usage limit reached' }
  }

  if (
    coupon.minOrderAmount !== null &&
    coupon.minOrderAmount !== undefined &&
    cart.subtotal < coupon.minOrderAmount
  ) {
    return {
      valid: false,
      reason: `Minimum order amount of ${coupon.minOrderAmount} required`,
    }
  }

  return { valid: true }
}

function itemMatchesPromotion(
  item: CartLineItem,
  promo: PromotionRule,
): boolean {
  if (promo.target === 'ALL' || promo.target === 'CART_VALUE') return true

  if (promo.target === 'PRODUCT') {
    return promo.items.some((pi) => pi.productId === item.productId)
  }

  if (promo.target === 'CATEGORY') {
    return promo.items.some(
      (pi) => pi.categoryId && item.categoryIds.includes(pi.categoryId),
    )
  }

  if (promo.target === 'COLLECTION') {
    return promo.items.some(
      (pi) => pi.collectionId && item.collectionIds.includes(pi.collectionId),
    )
  }

  return false
}

function applyPromotionToItems(
  items: Array<CartLineItem & { discountAmount: number; finalPrice: number }>,
  promo: PromotionRule,
  subtotal: number,
): { itemDiscounts: number[]; totalDiscount: number; shippingDiscount: boolean } {
  const itemDiscounts = new Array(items.length).fill(0)
  let totalDiscount = 0
  let shippingDiscount = false

  if (promo.type === 'FREE_SHIPPING') {
    shippingDiscount = true
    return { itemDiscounts, totalDiscount, shippingDiscount }
  }

  // Check minimum order amount
  if (promo.minOrderAmount !== null && promo.minOrderAmount !== undefined) {
    if (subtotal < promo.minOrderAmount) {
      return { itemDiscounts, totalDiscount, shippingDiscount }
    }
  }

  if (promo.type === 'PERCENTAGE_DISCOUNT') {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item || !itemMatchesPromotion(item, promo)) continue
      const lineTotal = item.finalPrice * item.quantity
      let discount = (lineTotal * promo.discountValue) / 100
      if (
        promo.maxDiscountAmount !== null &&
        promo.maxDiscountAmount !== undefined &&
        discount > promo.maxDiscountAmount
      ) {
        discount = promo.maxDiscountAmount
      }
      itemDiscounts[i] = discount
      totalDiscount += discount
    }
  } else if (promo.type === 'FIXED_DISCOUNT') {
    if (promo.target === 'ALL' || promo.target === 'CART_VALUE') {
      // Distribute fixed discount proportionally across all items
      let cap = promo.discountValue
      if (
        promo.maxDiscountAmount !== null &&
        promo.maxDiscountAmount !== undefined &&
        cap > promo.maxDiscountAmount
      ) {
        cap = promo.maxDiscountAmount
      }
      cap = Math.min(cap, subtotal)
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item) continue
        const lineTotal = item.finalPrice * item.quantity
        const share = subtotal > 0 ? lineTotal / subtotal : 0
        itemDiscounts[i] = cap * share
      }
      totalDiscount = cap
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (!item || !itemMatchesPromotion(item, promo)) continue
        const lineTotal = item.finalPrice * item.quantity
        let discount = Math.min(promo.discountValue, lineTotal)
        if (
          promo.maxDiscountAmount !== null &&
          promo.maxDiscountAmount !== undefined &&
          discount > promo.maxDiscountAmount
        ) {
          discount = promo.maxDiscountAmount
        }
        itemDiscounts[i] = discount
        totalDiscount += discount
      }
    }
  }

  return { itemDiscounts, totalDiscount, shippingDiscount }
}

function applyCouponToItems(
  items: Array<CartLineItem & { discountAmount: number; finalPrice: number }>,
  coupon: CouponRule,
  subtotal: number,
): { itemDiscounts: number[]; totalDiscount: number } {
  const itemDiscounts = new Array(items.length).fill(0)
  let totalDiscount = 0

  // If coupon links to a promotion rule, use it
  const rule = coupon.promotion ?? coupon

  const type = coupon.promotion ? coupon.promotion.type : coupon.type
  const discountValue = coupon.promotion
    ? coupon.promotion.discountValue
    : (coupon.discountValue ?? 0)
  const maxDiscount = coupon.promotion
    ? coupon.promotion.maxDiscountAmount
    : coupon.maxDiscountAmount
  const target = coupon.promotion ? coupon.promotion.target : coupon.target

  if (!type || !discountValue) return { itemDiscounts, totalDiscount }

  if (type === 'PERCENTAGE_DISCOUNT') {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      if (target !== 'ALL' && target !== 'CART_VALUE') {
        // Check if coupon has promotion items to match
        const promoItems = coupon.promotion?.items ?? []
        if (
          target === 'PRODUCT' &&
          !promoItems.some((pi) => pi.productId === item.productId)
        )
          continue
        if (
          target === 'CATEGORY' &&
          !promoItems.some(
            (pi) => pi.categoryId && item.categoryIds.includes(pi.categoryId),
          )
        )
          continue
        if (
          target === 'COLLECTION' &&
          !promoItems.some(
            (pi) =>
              pi.collectionId && item.collectionIds.includes(pi.collectionId),
          )
        )
          continue
      }
      const lineTotal = item.finalPrice * item.quantity
      let discount = (lineTotal * discountValue) / 100
      if (maxDiscount !== null && maxDiscount !== undefined && discount > maxDiscount) {
        discount = maxDiscount
      }
      itemDiscounts[i] = discount
      totalDiscount += discount
    }
  } else if (type === 'FIXED_DISCOUNT') {
    let cap = discountValue
    if (maxDiscount !== null && maxDiscount !== undefined && cap > maxDiscount) {
      cap = maxDiscount
    }
    cap = Math.min(cap, subtotal)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      const lineTotal = item.finalPrice * item.quantity
      const share = subtotal > 0 ? lineTotal / subtotal : 0
      itemDiscounts[i] = cap * share
    }
    totalDiscount = cap
  }

  void rule // suppress unused variable warning

  return { itemDiscounts, totalDiscount }
}

export function calculateCart(
  items: CartLineItem[],
  promotions: PromotionRule[],
  coupon?: CouponRule | null,
): CartCalculationResult {
  // Initialize result items
  const resultItems: Array<CartLineItem & { discountAmount: number; finalPrice: number }> =
    items.map((item) => ({
      ...item,
      discountAmount: 0,
      finalPrice: item.unitPrice,
    }))

  const subtotal = resultItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  )

  const appliedPromotions: AppliedDiscount[] = []
  let totalDiscount = 0
  let shippingDiscount = false

  // Sort by priority descending
  const validPromos = promotions
    .filter((p) => p.isAutoApply && isPromotionValid(p))
    .sort((a, b) => b.priority - a.priority)

  let hasNonStackable = false

  for (const promo of validPromos) {
    if (hasNonStackable && !promo.isStackable) continue
    if (!promo.isStackable && appliedPromotions.length > 0) continue

    const { itemDiscounts, totalDiscount: promoDiscount, shippingDiscount: freeShip } =
      applyPromotionToItems(resultItems, promo, subtotal - totalDiscount)

    if (promoDiscount === 0 && !freeShip) continue

    // Apply discounts to items
    for (let i = 0; i < resultItems.length; i++) {
      const ri = resultItems[i]
      const di = itemDiscounts[i]
      if (!ri || di === undefined) continue
      ri.discountAmount += di
      ri.finalPrice = Math.max(0, ri.unitPrice - ri.discountAmount / ri.quantity)
    }

    if (freeShip) shippingDiscount = true
    totalDiscount += promoDiscount

    appliedPromotions.push({
      promotionId: promo.id,
      promotionName: promo.name,
      type: promo.type,
      discountAmount: promoDiscount,
    })

    if (!promo.isStackable) {
      hasNonStackable = true
    }
  }

  // Apply coupon
  if (coupon) {
    const validation = validateCoupon(coupon, {
      subtotal,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    })

    if (validation.valid) {
      const { itemDiscounts: couponDiscounts, totalDiscount: couponDiscount } =
        applyCouponToItems(resultItems, coupon, subtotal - totalDiscount)

      for (let i = 0; i < resultItems.length; i++) {
        const ri = resultItems[i]
        const di = couponDiscounts[i]
        if (!ri || di === undefined) continue
        ri.discountAmount += di
        ri.finalPrice = Math.max(0, ri.unitPrice - ri.discountAmount / ri.quantity)
      }

      totalDiscount += couponDiscount

      if (couponDiscount > 0) {
        appliedPromotions.push({
          promotionId: coupon.id,
          promotionName: `Coupon: ${coupon.code}`,
          type: coupon.type ?? coupon.promotion?.type ?? 'COUPON',
          discountAmount: couponDiscount,
        })
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - totalDiscount)

  return {
    lineItems: resultItems,
    subtotal,
    discountAmount: totalDiscount,
    shippingDiscount,
    total: finalTotal,
    appliedPromotions,
  }
}
