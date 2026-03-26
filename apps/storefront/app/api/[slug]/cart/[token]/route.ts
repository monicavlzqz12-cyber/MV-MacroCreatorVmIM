import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@store-builder/database'
import { addToCartSchema, updateCartItemSchema, applyCouponSchema } from '@store-builder/validators'
import { getCartWithTotals } from '@/lib/store-data'
import { isValidCartToken } from '@/lib/cart-utils'

interface RouteContext {
  params: { slug: string; token: string }
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

// ============================================================
// GET — current cart state
// ============================================================

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!isValidCartToken(params.token)) {
    return NextResponse.json({ error: 'invalid_token', message: 'Invalid cart token' }, { status: 400 })
  }

  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      select: { id: true, status: true },
    })
    if (!store || store.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'not_found', message: 'Store not found' }, { status: 404 })
    }

    const cartData = await getCartWithTotals(store.id, params.token)
    if (!cartData) {
      return NextResponse.json({ error: 'cart_not_found', message: 'Cart not found or expired' }, { status: 404 })
    }

    return NextResponse.json({
      token: cartData.token,
      items: cartData.items,
      totals: cartData.totals,
      appliedPromotions: cartData.appliedPromotions,
      couponCode: cartData.couponCode,
    })
  } catch (err) {
    console.error('[Cart GET]', err)
    return NextResponse.json({ error: 'internal_error', message: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================
// PATCH — mutate cart
// ============================================================

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!isValidCartToken(params.token)) {
    return NextResponse.json({ error: 'invalid_token', message: 'Invalid cart token' }, { status: 400 })
  }

  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      select: { id: true, status: true },
    })
    if (!store || store.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'not_found', message: 'Store not found' }, { status: 404 })
    }

    // Find cart
    const cart = await prisma.cart.findFirst({
      where: { token: params.token, storeId: store.id, expiresAt: { gte: new Date() } },
      select: { id: true },
    })
    if (!cart) {
      return NextResponse.json({ error: 'cart_not_found', message: 'Cart not found or expired' }, { status: 404 })
    }

    const body = await request.json() as Record<string, unknown>
    const action = body['action'] as string

    switch (action) {
      case 'add': {
        const parsed = addToCartSchema.safeParse({
          productId: body['productId'],
          variantId: body['variantId'],
          quantity: body['quantity'],
        })
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'validation_error', message: parsed.error.errors[0]?.message ?? 'Invalid input' },
            { status: 400 },
          )
        }

        const { productId, variantId, quantity } = parsed.data

        // Verify product exists and is active in this store
        const product = await prisma.product.findFirst({
          where: { id: productId, storeId: store.id, status: 'ACTIVE' },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            variants: variantId ? { where: { id: variantId, isActive: true } } : undefined,
          },
        })

        if (!product) {
          return NextResponse.json(
            { error: 'product_not_found', message: 'Product not found or unavailable' },
            { status: 404 },
          )
        }

        if (variantId && (!product.variants || product.variants.length === 0)) {
          return NextResponse.json(
            { error: 'variant_not_found', message: 'Variant not found or unavailable' },
            { status: 404 },
          )
        }

        const variant = product.variants?.[0]

        // Inventory check
        const inventoryCount = variant?.inventoryCount ?? product.inventoryCount
        if (product.trackInventory && !product.allowBackorder) {
          if (inventoryCount !== null && inventoryCount !== undefined && inventoryCount < quantity) {
            return NextResponse.json(
              {
                error: 'insufficient_inventory',
                message: inventoryCount <= 0 ? 'This item is out of stock' : `Only ${inventoryCount} available`,
              },
              { status: 409 },
            )
          }
        }

        const price = variant ? toNumber(variant.price) : toNumber(product.basePrice)
        const productName = product.name
        const variantName = variant?.name ?? null
        const imageUrl = variant?.imageUrl ?? product.images[0]?.url ?? null

        // Upsert cart item (unique on cartId + productId + variantId)
        // If variantId is null, look for null variantId
        const existingItem = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId,
            variantId: variantId ?? null,
          },
        })

        if (existingItem) {
          // Check combined quantity against inventory
          const newQty = existingItem.quantity + quantity
          if (product.trackInventory && !product.allowBackorder) {
            if (inventoryCount !== null && inventoryCount !== undefined && inventoryCount < newQty) {
              return NextResponse.json(
                { error: 'insufficient_inventory', message: `Only ${inventoryCount} available` },
                { status: 409 },
              )
            }
          }
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQty, price, productName, variantName, imageUrl, updatedAt: new Date() },
          })
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              variantId: variantId ?? null,
              quantity,
              price,
              productName,
              variantName,
              imageUrl,
            },
          })
        }

        // Update cart touch time
        await prisma.cart.update({
          where: { id: cart.id },
          data: { updatedAt: new Date() },
        })

        break
      }

      case 'update': {
        const cartItemId = body['cartItemId'] as string
        if (!cartItemId) {
          return NextResponse.json({ error: 'validation_error', message: 'cartItemId required' }, { status: 400 })
        }

        const parsed = updateCartItemSchema.safeParse({ quantity: body['quantity'] })
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'validation_error', message: parsed.error.errors[0]?.message ?? 'Invalid quantity' },
            { status: 400 },
          )
        }

        const { quantity } = parsed.data

        if (quantity === 0) {
          await prisma.cartItem.deleteMany({
            where: { id: cartItemId, cartId: cart.id },
          })
        } else {
          // Check inventory before update
          const item = await prisma.cartItem.findFirst({
            where: { id: cartItemId, cartId: cart.id },
            include: {
              variant: true,
            },
          })
          if (!item) {
            return NextResponse.json({ error: 'item_not_found', message: 'Cart item not found' }, { status: 404 })
          }
          const product = await prisma.product.findFirst({
            where: { id: item.productId, storeId: store.id },
            select: { trackInventory: true, allowBackorder: true, inventoryCount: true },
          })
          if (product?.trackInventory && !product.allowBackorder) {
            const invCount = item.variant?.inventoryCount ?? product.inventoryCount
            if (invCount !== null && invCount !== undefined && invCount < quantity) {
              return NextResponse.json(
                { error: 'insufficient_inventory', message: `Only ${invCount} available` },
                { status: 409 },
              )
            }
          }

          await prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity, updatedAt: new Date() },
          })
        }
        break
      }

      case 'remove': {
        const cartItemId = body['cartItemId'] as string
        if (!cartItemId) {
          return NextResponse.json({ error: 'validation_error', message: 'cartItemId required' }, { status: 400 })
        }
        await prisma.cartItem.deleteMany({
          where: { id: cartItemId, cartId: cart.id },
        })
        break
      }

      case 'apply_coupon': {
        const parsed = applyCouponSchema.safeParse({ couponCode: body['couponCode'] })
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'validation_error', message: 'Invalid coupon code' },
            { status: 400 },
          )
        }

        const { couponCode } = parsed.data
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
            { error: 'invalid_coupon', message: 'Coupon code is invalid or expired' },
            { status: 400 },
          )
        }

        // Check max uses
        if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
          return NextResponse.json(
            { error: 'coupon_exhausted', message: 'This coupon has reached its usage limit' },
            { status: 400 },
          )
        }

        await prisma.cart.update({
          where: { id: cart.id },
          data: { couponCode, couponId: coupon.id },
        })
        break
      }

      case 'remove_coupon': {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { couponCode: null, couponId: null },
        })
        break
      }

      default:
        return NextResponse.json({ error: 'unknown_action', message: `Unknown action: ${action}` }, { status: 400 })
    }

    // Return fresh cart state
    const cartData = await getCartWithTotals(store.id, params.token)
    return NextResponse.json({
      token: params.token,
      items: cartData?.items ?? [],
      totals: cartData?.totals ?? {
        subtotal: 0, discountAmount: 0, shippingAmount: 0, taxAmount: 0,
        total: 0, currency: 'USD', itemCount: 0, savings: 0,
      },
      appliedPromotions: cartData?.appliedPromotions ?? [],
      couponCode: cartData?.couponCode,
    })
  } catch (err) {
    console.error('[Cart PATCH]', err)
    return NextResponse.json({ error: 'internal_error', message: 'Internal server error' }, { status: 500 })
  }
}
