import { prisma } from '@store-builder/database'
import type { AppliedPromotion } from '@store-builder/types'

// Re-export for use in API routes
export { getActivePromotions } from './store-data'

// ============================================================
// PROMOTIONS ENGINE (for checkout — server-side only)
// ============================================================

interface PromoForCheckout {
  id: string
  name: string
  type: string
  target: string
  discountValue: number
  maxDiscountAmount: number | null
  minOrderAmount: number | null
  productIds: string[]
  isStackable: boolean
  priority: number
}

interface CartLineForPromo {
  productId: string
  totalPrice: number
}

export function calculatePromotionDiscountsForCheckout(
  lines: CartLineForPromo[],
  promotions: PromoForCheckout[],
): { appliedPromotions: AppliedPromotion[]; totalDiscount: number } {
  const appliedPromotions: AppliedPromotion[] = []
  let totalDiscount = 0
  const subtotal = lines.reduce((s, l) => s + l.totalPrice, 0)

  for (const promo of promotions) {
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) continue

    let discount = 0
    const eligibleLines =
      promo.target === 'ALL' || promo.productIds.length === 0
        ? lines
        : lines.filter((l) => promo.productIds.includes(l.productId))

    const eligibleSubtotal = eligibleLines.reduce((s, l) => s + l.totalPrice, 0)

    if (promo.type === 'PERCENTAGE_DISCOUNT') {
      discount = (eligibleSubtotal * promo.discountValue) / 100
      if (promo.maxDiscountAmount) discount = Math.min(discount, promo.maxDiscountAmount)
    } else if (promo.type === 'FIXED_DISCOUNT') {
      if (eligibleLines.length > 0) discount = promo.discountValue
    }

    if (discount > 0) {
      totalDiscount += discount
      appliedPromotions.push({
        id: promo.id,
        name: promo.name,
        type: promo.type,
        discountAmount: discount,
      })
      if (!promo.isStackable) break
    }
  }

  return { appliedPromotions, totalDiscount }
}
