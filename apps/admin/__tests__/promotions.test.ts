import { describe, it, expect } from 'vitest'
import {
  isPromotionValid,
  validateCoupon,
  calculateCart,
  type CartLineItem,
  type PromotionRule,
  type CouponRule,
} from '../lib/promotions'

// ============================================================
// HELPERS
// ============================================================

function makePromo(overrides: Partial<PromotionRule> = {}): PromotionRule {
  return {
    id: 'promo-1',
    name: 'Test Promo',
    type: 'PERCENTAGE_DISCOUNT',
    target: 'ALL',
    discountValue: 10,
    maxDiscountAmount: null,
    minOrderAmount: null,
    minQuantity: null,
    isAutoApply: true,
    isStackable: true,
    priority: 1,
    startsAt: null,
    endsAt: null,
    maxUses: null,
    currentUses: 0,
    isActive: true,
    items: [],
    ...overrides,
  }
}

function makeItem(overrides: Partial<CartLineItem> = {}): CartLineItem {
  return {
    productId: 'prod-1',
    quantity: 1,
    unitPrice: 100,
    categoryIds: [],
    collectionIds: [],
    ...overrides,
  }
}

function makeCoupon(overrides: Partial<CouponRule> = {}): CouponRule {
  return {
    id: 'coupon-1',
    code: 'SAVE10',
    type: 'PERCENTAGE_DISCOUNT',
    discountValue: 10,
    target: 'ALL',
    minOrderAmount: null,
    maxDiscountAmount: null,
    maxUses: null,
    currentUses: 0,
    maxUsesPerUser: null,
    startsAt: null,
    endsAt: null,
    isActive: true,
    promotion: null,
    ...overrides,
  }
}

// ============================================================
// isPromotionValid
// ============================================================

describe('isPromotionValid', () => {
  it('returns true for a valid active promotion', () => {
    expect(isPromotionValid(makePromo())).toBe(true)
  })

  it('returns false when isActive is false', () => {
    expect(isPromotionValid(makePromo({ isActive: false }))).toBe(false)
  })

  it('returns false when maxUses reached', () => {
    expect(isPromotionValid(makePromo({ maxUses: 5, currentUses: 5 }))).toBe(false)
  })

  it('returns true when currentUses < maxUses', () => {
    expect(isPromotionValid(makePromo({ maxUses: 5, currentUses: 4 }))).toBe(true)
  })

  it('returns false when not yet started', () => {
    const future = new Date(Date.now() + 100_000)
    expect(isPromotionValid(makePromo({ startsAt: future }))).toBe(false)
  })

  it('returns false when already ended', () => {
    const past = new Date(Date.now() - 100_000)
    expect(isPromotionValid(makePromo({ endsAt: past }))).toBe(false)
  })

  it('returns true when within date range', () => {
    const past = new Date(Date.now() - 100_000)
    const future = new Date(Date.now() + 100_000)
    expect(isPromotionValid(makePromo({ startsAt: past, endsAt: future }))).toBe(true)
  })
})

// ============================================================
// validateCoupon
// ============================================================

describe('validateCoupon', () => {
  it('returns valid for a standard active coupon', () => {
    const result = validateCoupon(makeCoupon(), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(true)
  })

  it('returns invalid when inactive', () => {
    const result = validateCoupon(makeCoupon({ isActive: false }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not active')
  })

  it('returns invalid when maxUses exhausted', () => {
    const result = validateCoupon(makeCoupon({ maxUses: 10, currentUses: 10 }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('usage limit')
  })

  it('returns invalid when minimum order not met', () => {
    const result = validateCoupon(makeCoupon({ minOrderAmount: 200 }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('200')
  })

  it('returns valid when minimum order is exactly met', () => {
    const result = validateCoupon(makeCoupon({ minOrderAmount: 100 }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(true)
  })

  it('returns invalid when not yet started', () => {
    const future = new Date(Date.now() + 100_000)
    const result = validateCoupon(makeCoupon({ startsAt: future }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(false)
  })

  it('returns invalid when expired', () => {
    const past = new Date(Date.now() - 100_000)
    const result = validateCoupon(makeCoupon({ endsAt: past }), { subtotal: 100, itemCount: 1 })
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('expired')
  })
})

// ============================================================
// calculateCart — percentage discount
// ============================================================

describe('calculateCart — PERCENTAGE_DISCOUNT', () => {
  it('applies 10% off to all items', () => {
    const items = [makeItem({ quantity: 2, unitPrice: 50 })] // subtotal = 100
    const promos = [makePromo({ type: 'PERCENTAGE_DISCOUNT', discountValue: 10, target: 'ALL' })]
    const result = calculateCart(items, promos, null)

    expect(result.subtotal).toBe(100)
    expect(result.discountAmount).toBeCloseTo(10)
    expect(result.total).toBeCloseTo(90)
  })

  it('respects maxDiscountAmount cap', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 1000 })]
    const promos = [makePromo({ type: 'PERCENTAGE_DISCOUNT', discountValue: 50, maxDiscountAmount: 100 })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBe(100) // capped at 100
    expect(result.total).toBe(900)
  })

  it('only discounts targeted products', () => {
    const items = [
      makeItem({ productId: 'target-prod', quantity: 1, unitPrice: 100 }),
      makeItem({ productId: 'other-prod', quantity: 1, unitPrice: 100 }),
    ]
    const promos = [makePromo({
      type: 'PERCENTAGE_DISCOUNT',
      discountValue: 20,
      target: 'PRODUCT',
      items: [{ productId: 'target-prod' }],
    })]
    const result = calculateCart(items, promos, null)

    // 20% of 100 = 20
    expect(result.discountAmount).toBeCloseTo(20)
    expect(result.total).toBeCloseTo(180)
  })

  it('discounts products by category', () => {
    const items = [
      makeItem({ productId: 'p1', categoryIds: ['cat-sale'], quantity: 1, unitPrice: 100 }),
      makeItem({ productId: 'p2', categoryIds: [], quantity: 1, unitPrice: 100 }),
    ]
    const promos = [makePromo({
      type: 'PERCENTAGE_DISCOUNT',
      discountValue: 25,
      target: 'CATEGORY',
      items: [{ categoryId: 'cat-sale' }],
    })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBeCloseTo(25)
    expect(result.total).toBeCloseTo(175)
  })
})

// ============================================================
// calculateCart — fixed discount
// ============================================================

describe('calculateCart — FIXED_DISCOUNT', () => {
  it('applies fixed discount to cart total', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 200 })]
    const promos = [makePromo({ type: 'FIXED_DISCOUNT', discountValue: 30, target: 'ALL' })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBe(30)
    expect(result.total).toBe(170)
  })

  it('never discounts below zero', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 20 })]
    const promos = [makePromo({ type: 'FIXED_DISCOUNT', discountValue: 100, target: 'ALL' })]
    const result = calculateCart(items, promos, null)

    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.discountAmount).toBeLessThanOrEqual(20)
  })

  it('applies fixed discount only to matching products', () => {
    const items = [
      makeItem({ productId: 'p1', quantity: 1, unitPrice: 100 }),
      makeItem({ productId: 'p2', quantity: 1, unitPrice: 100 }),
    ]
    const promos = [makePromo({
      type: 'FIXED_DISCOUNT',
      discountValue: 15,
      target: 'PRODUCT',
      items: [{ productId: 'p1' }],
    })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBe(15)
    expect(result.total).toBe(185)
  })
})

// ============================================================
// calculateCart — free shipping
// ============================================================

describe('calculateCart — FREE_SHIPPING', () => {
  it('sets shippingDiscount flag', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 50 })]
    const promos = [makePromo({ type: 'FREE_SHIPPING', target: 'ALL' })]
    const result = calculateCart(items, promos, null)

    expect(result.shippingDiscount).toBe(true)
    expect(result.discountAmount).toBe(0) // no direct price discount
    expect(result.total).toBe(50)
  })
})

// ============================================================
// calculateCart — minimum order amount
// ============================================================

describe('calculateCart — minOrderAmount', () => {
  it('skips promotion when subtotal below minimum', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 50 })] // subtotal = 50
    const promos = [makePromo({ minOrderAmount: 100, discountValue: 20 })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBe(0)
    expect(result.total).toBe(50)
  })

  it('applies promotion when subtotal meets minimum', () => {
    const items = [makeItem({ quantity: 2, unitPrice: 60 })] // subtotal = 120
    const promos = [makePromo({ minOrderAmount: 100, discountValue: 10 })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBeCloseTo(12)
  })
})

// ============================================================
// calculateCart — stackable promotions
// ============================================================

describe('calculateCart — stacking', () => {
  it('applies multiple stackable promotions', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 100 })]
    const promos = [
      makePromo({ id: 'p1', type: 'PERCENTAGE_DISCOUNT', discountValue: 10, isStackable: true, priority: 2 }),
      makePromo({ id: 'p2', type: 'FIXED_DISCOUNT', discountValue: 5, isStackable: true, priority: 1 }),
    ]
    const result = calculateCart(items, promos, null)

    // Both discounts applied (order depends on priority): 10% of 100 = 10, then $5 flat
    expect(result.appliedPromotions).toHaveLength(2)
    expect(result.discountAmount).toBeGreaterThan(10)
  })

  it('blocks a second non-stackable promotion after a non-stackable one', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 100 })]
    const promos = [
      makePromo({ id: 'p1', type: 'PERCENTAGE_DISCOUNT', discountValue: 20, isStackable: false, priority: 2 }),
      makePromo({ id: 'p2', type: 'PERCENTAGE_DISCOUNT', discountValue: 10, isStackable: false, priority: 1 }),
    ]
    const result = calculateCart(items, promos, null)

    // Only the first (highest-priority) non-stackable applies; second non-stackable is skipped
    expect(result.appliedPromotions).toHaveLength(1)
    expect(result.appliedPromotions[0]!.promotionId).toBe('p1')
    expect(result.discountAmount).toBeCloseTo(20)
  })

  it('allows a stackable promo to apply after a non-stackable one', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 100 })]
    const promos = [
      makePromo({ id: 'p1', type: 'PERCENTAGE_DISCOUNT', discountValue: 20, isStackable: false, priority: 2 }),
      makePromo({ id: 'p2', type: 'FIXED_DISCOUNT', discountValue: 5, isStackable: true, priority: 1 }),
    ]
    const result = calculateCart(items, promos, null)

    // Both apply: non-stackable (20%) then stackable ($5)
    expect(result.appliedPromotions).toHaveLength(2)
    expect(result.discountAmount).toBeCloseTo(25)
  })
})

// ============================================================
// calculateCart — coupon
// ============================================================

describe('calculateCart — coupon', () => {
  it('applies coupon percentage discount', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 200 })]
    const coupon = makeCoupon({ type: 'PERCENTAGE_DISCOUNT', discountValue: 15 })
    const result = calculateCart(items, [], coupon)

    expect(result.discountAmount).toBeCloseTo(30) // 15% of 200
    expect(result.total).toBeCloseTo(170)
  })

  it('applies coupon fixed discount', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 200 })]
    const coupon = makeCoupon({ type: 'FIXED_DISCOUNT', discountValue: 25 })
    const result = calculateCart(items, [], coupon)

    expect(result.discountAmount).toBe(25)
    expect(result.total).toBe(175)
  })

  it('combines coupon with auto-apply promotion', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 100 })]
    const promos = [makePromo({ type: 'PERCENTAGE_DISCOUNT', discountValue: 10 })]
    const coupon = makeCoupon({ type: 'FIXED_DISCOUNT', discountValue: 5 })
    const result = calculateCart(items, promos, coupon)

    // 10% off = 10, then $5 coupon = 5 → total discount should be around 15
    expect(result.discountAmount).toBeCloseTo(15)
    expect(result.total).toBeCloseTo(85)
  })

  it('applies coupon maxDiscountAmount cap', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 1000 })]
    const coupon = makeCoupon({ type: 'PERCENTAGE_DISCOUNT', discountValue: 50, maxDiscountAmount: 80 })
    const result = calculateCart(items, [], coupon)

    expect(result.discountAmount).toBe(80)
  })
})

// ============================================================
// calculateCart — empty cart
// ============================================================

describe('calculateCart — edge cases', () => {
  it('handles empty cart', () => {
    const result = calculateCart([], [], null)
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
    expect(result.discountAmount).toBe(0)
  })

  it('handles no promotions', () => {
    const items = [makeItem({ quantity: 3, unitPrice: 40 })]
    const result = calculateCart(items, [], null)
    expect(result.subtotal).toBe(120)
    expect(result.total).toBe(120)
    expect(result.discountAmount).toBe(0)
  })

  it('skips inactive promotions', () => {
    const items = [makeItem({ quantity: 1, unitPrice: 100 })]
    const promos = [makePromo({ isActive: false, discountValue: 50 })]
    const result = calculateCart(items, promos, null)

    expect(result.discountAmount).toBe(0)
  })

  it('uses unitPrice as finalPrice in line items result', () => {
    const items = [makeItem({ quantity: 2, unitPrice: 50 })]
    const result = calculateCart(items, [], null)
    const line = result.lineItems[0]!
    expect(line.finalPrice).toBe(50)
    expect(line.discountAmount).toBe(0)
  })
})
