import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@store-builder/database'
import { createCheckoutSchema } from '@store-builder/validators'
import { getActivePromotions, calculatePromotionDiscountsForCheckout } from '@/lib/checkout-utils'
import { isValidCartToken } from '@/lib/cart-utils'

interface RouteContext {
  params: { slug: string }
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

function generateOrderNumber(slug: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `#${slug.toUpperCase().slice(0, 8)}-${ts}-${rand}`
}

/**
 * POST /api/[slug]/checkout
 * Create an order from a cart.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Parse + validate body
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'bad_request', message: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createCheckoutSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: parsed.error.errors[0]?.message ?? 'Validation failed',
          details: parsed.error.errors,
        },
        { status: 400 },
      )
    }

    const input = parsed.data

    // Validate cart token format
    if (!isValidCartToken(input.cartToken)) {
      return NextResponse.json({ error: 'invalid_token', message: 'Invalid cart token' }, { status: 400 })
    }

    // 2. Get store (must be ACTIVE)
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      include: {
        config: {
          select: {
            currency: true,
            currencySymbol: true,
            currencyPosition: true,
            currencyDecimals: true,
            emailFromName: true,
            emailFromAddress: true,
          },
        },
      },
    })

    if (!store || store.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'not_found', message: 'Store not found' }, { status: 404 })
    }

    // 3. Get cart (must belong to this store and be non-expired)
    const cart = await prisma.cart.findFirst({
      where: {
        token: input.cartToken,
        storeId: store.id,
        expiresAt: { gte: new Date() },
      },
      include: {
        items: {
          include: {
            variant: true,
          },
        },
      },
    })

    if (!cart) {
      return NextResponse.json(
        { error: 'cart_not_found', message: 'Cart not found or has expired' },
        { status: 404 },
      )
    }

    // 4. Verify cart is not empty
    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: 'cart_empty', message: 'Your cart is empty' },
        { status: 400 },
      )
    }

    // 5. Fetch current product/variant data for all cart items
    const productIds = [...new Set(cart.items.map((i) => i.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
      include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Build order line items
    interface LineItem {
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
      inventoryCount?: number
      trackInventory: boolean
      allowBackorder: boolean
    }

    const lineItems: LineItem[] = []
    for (const item of cart.items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: 'product_unavailable', message: `Product ${item.productId} is no longer available` },
          { status: 409 },
        )
      }
      if (product.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'product_unavailable', message: `"${product.name}" is no longer available` },
          { status: 409 },
        )
      }

      const variant = item.variant
      const unitPrice = variant ? toNumber(variant.price) : toNumber(product.basePrice)
      const inventoryCount = variant?.inventoryCount ?? product.inventoryCount

      // Inventory check
      if (product.trackInventory && !product.allowBackorder) {
        if (inventoryCount !== null && inventoryCount !== undefined && inventoryCount < item.quantity) {
          return NextResponse.json(
            {
              error: 'insufficient_inventory',
              message:
                inventoryCount <= 0
                  ? `"${product.name}" is out of stock`
                  : `Only ${inventoryCount} of "${product.name}" available`,
            },
            { status: 409 },
          )
        }
      }

      const optionValues = variant
        ? (variant.options as Array<{ groupName: string; optionLabel: string }>).map((o) => ({
            name: o.groupName,
            value: o.optionLabel,
          }))
        : undefined

      lineItems.push({
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        productName: product.name,
        variantName: variant?.name ?? undefined,
        sku: variant?.sku ?? product.sku ?? undefined,
        imageUrl: variant?.imageUrl ?? product.images[0]?.url ?? undefined,
        optionValues,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
        discountAmount: 0,
        inventoryCount: inventoryCount ?? undefined,
        trackInventory: product.trackInventory,
        allowBackorder: product.allowBackorder,
      })
    }

    // 6. Validate payment method
    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: { id: input.paymentMethodId, storeId: store.id, isActive: true },
    })
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'invalid_payment_method', message: 'Selected payment method is not available' },
        { status: 400 },
      )
    }

    // 7. Apply promotions engine
    const promotions = await getActivePromotions(store.id)
    const cartTotalsForPromo = lineItems.map((li) => ({
      productId: li.productId,
      totalPrice: li.totalPrice,
    }))
    const { appliedPromotions, totalDiscount } = calculatePromotionDiscountsForCheckout(
      cartTotalsForPromo,
      promotions,
    )

    // Distribute discount across items proportionally
    const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0)
    if (totalDiscount > 0 && subtotal > 0) {
      lineItems.forEach((li) => {
        li.discountAmount = Math.round((li.totalPrice / subtotal) * totalDiscount * 100) / 100
      })
    }

    // 8. Validate coupon
    let couponId: string | undefined
    let couponDiscount = 0
    const couponCode = input.couponCode ?? cart.couponCode ?? undefined

    if (couponCode) {
      const now = new Date()
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          storeId: store.id,
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
        },
      })

      if (!coupon) {
        return NextResponse.json(
          { error: 'invalid_coupon', message: 'The coupon code is invalid or expired' },
          { status: 400 },
        )
      }
      if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
        return NextResponse.json(
          { error: 'coupon_exhausted', message: 'This coupon has reached its usage limit' },
          { status: 400 },
        )
      }

      couponId = coupon.id
      // Calculate coupon discount
      const subtotalAfterPromo = Math.max(0, subtotal - totalDiscount)
      if (coupon.minOrderAmount && subtotalAfterPromo < toNumber(coupon.minOrderAmount)) {
        return NextResponse.json(
          { error: 'coupon_min_order', message: `Minimum order of ${toNumber(coupon.minOrderAmount)} required for this coupon` },
          { status: 400 },
        )
      }
      if (coupon.type === 'PERCENTAGE_DISCOUNT' && coupon.discountValue) {
        couponDiscount = (subtotalAfterPromo * toNumber(coupon.discountValue)) / 100
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, toNumber(coupon.maxDiscountAmount))
        }
      } else if (coupon.type === 'FIXED_DISCOUNT' && coupon.discountValue) {
        couponDiscount = Math.min(toNumber(coupon.discountValue), subtotalAfterPromo)
      } else if (coupon.type === 'FREE_SHIPPING') {
        // Handled via shippingAmount
      }
    }

    const totalDiscountAll = totalDiscount + couponDiscount
    const shippingAmount = 0
    const taxAmount = 0
    const total = Math.max(0, subtotal - totalDiscountAll + shippingAmount + taxAmount)
    const currency = store.config?.currency ?? 'USD'

    // 9. Generate order number
    const orderNumber = generateOrderNumber(params.slug)

    // 10. Find or create customer
    let customerId: string | undefined

    try {
      const existing = await prisma.customer.findUnique({
        where: { storeId_email: { storeId: store.id, email: input.email } },
        select: { id: true },
      })
      if (existing) {
        customerId = existing.id
      }
    } catch {
      // guest order — no customer found
    }

    // 11. Build billing address
    const billingAddress = input.billingSameAsShipping
      ? input.shippingAddress
      : (input.billingAddress ?? input.shippingAddress)

    // 12. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          storeId: store.id,
          orderNumber,
          customerId: customerId ?? null,
          guestEmail: !customerId ? input.email : null,
          guestFirstName: !customerId ? input.firstName : null,
          guestLastName: !customerId ? input.lastName : null,
          guestPhone: !customerId ? (input.phone ?? null) : null,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          subtotal,
          discountAmount: totalDiscountAll,
          shippingAmount,
          taxAmount,
          total,
          currency,
          shippingAddress: input.shippingAddress as Prisma.InputJsonValue,
          billingAddress: billingAddress !== null ? (billingAddress as Prisma.InputJsonValue) : Prisma.JsonNull,
          paymentMethodId: paymentMethod.id,
          couponId: couponId ?? null,
          couponCode: couponCode ?? null,
          appliedPromotions: appliedPromotions as unknown as Prisma.InputJsonValue,
          customerNotes: input.customerNotes ?? null,
          ipAddress: request.ip ?? request.headers.get('x-forwarded-for') ?? null,
          userAgent: request.headers.get('user-agent') ?? null,
        },
      })

      // Create order items
      await tx.orderItem.createMany({
        data: lineItems.map((li) => ({
          orderId: newOrder.id,
          productId: li.productId,
          variantId: li.variantId ?? null,
          productName: li.productName,
          variantName: li.variantName ?? null,
          sku: li.sku ?? null,
          imageUrl: li.imageUrl ?? null,
          optionValues: (li.optionValues ?? []) as Prisma.InputJsonValue,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
          totalPrice: li.totalPrice,
          discountAmount: li.discountAmount,
        })),
      })

      // Create order timeline entry
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          status: 'PENDING',
          note: 'Order placed by customer',
          createdBy: 'system',
        },
      })

      // Update coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } },
        })
      }

      // Update promotion usage
      for (const promo of appliedPromotions) {
        await tx.promotion.updateMany({
          where: { id: promo.id, storeId: store.id },
          data: { currentUses: { increment: 1 } },
        })
      }

      // Update inventory counts
      for (const li of lineItems) {
        if (li.trackInventory && !li.allowBackorder) {
          if (li.variantId) {
            await tx.productVariant.updateMany({
              where: { id: li.variantId },
              data: { inventoryCount: { decrement: li.quantity } },
            })
          } else {
            await tx.product.updateMany({
              where: { id: li.productId, storeId: store.id },
              data: { inventoryCount: { decrement: li.quantity } },
            })
          }
        }
      }

      // Update customer stats
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
          },
        })
      } else if (input.email) {
        // Create new customer record
        try {
          await tx.customer.create({
            data: {
              storeId: store.id,
              email: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
              phone: input.phone ?? null,
              company: input.company ?? null,
              acceptsMarketing: input.acceptsMarketing ?? false,
              totalOrders: 1,
              totalSpent: total,
            },
          })
        } catch {
          // Customer might already exist (race condition) — ignore
        }
      }

      // Clear cart items
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      // Mark cart as expired so it's cleaned up
      await tx.cart.update({
        where: { id: cart.id },
        data: { expiresAt: new Date(), couponCode: null, couponId: null },
      })

      return newOrder
    })

    // 13. Return success
    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: {
        id: paymentMethod.id,
        name: paymentMethod.name,
        type: paymentMethod.type,
      },
      paymentInstructions: paymentMethod.instructions ?? null,
    })
  } catch (err) {
    console.error('[Checkout POST]', err)
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to place order. Please try again.' },
      { status: 500 },
    )
  }
}
