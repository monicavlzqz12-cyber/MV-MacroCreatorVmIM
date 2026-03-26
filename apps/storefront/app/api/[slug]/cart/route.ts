import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@store-builder/database'
import { getOrCreateCart, getCartWithTotals } from '@/lib/store-data'
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from '@/lib/cart-utils'

interface RouteContext {
  params: { slug: string }
}

/**
 * POST /api/[slug]/cart
 * Create or retrieve a cart by token.
 * Body: { token?: string }
 * Returns: { token, items, totals, appliedPromotions, paymentMethods, storeConfig }
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      include: {
        config: {
          select: {
            currencySymbol: true,
            currencyPosition: true,
            currencyDecimals: true,
            checkoutConfig: true,
          },
        },
        cartConfig: {
          select: {
            persistDays: true,
          },
        },
        paymentMethods: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            instructions: true,
            templateBlocks: true,
            redirectUrl: true,
          },
        },
      },
    })

    if (!store || store.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'not_found', message: 'Store not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({})) as { token?: string }
    const inputToken = typeof body.token === 'string' && body.token.length === 32 ? body.token : undefined

    const { cartId, token } = await getOrCreateCart(store.id, inputToken)
    const cartData = await getCartWithTotals(store.id, token)

    const response = NextResponse.json({
      token,
      cartId,
      items: cartData?.items ?? [],
      totals: cartData?.totals ?? {
        subtotal: 0,
        discountAmount: 0,
        shippingAmount: 0,
        taxAmount: 0,
        total: 0,
        currency: store.config?.currencySymbol ?? 'USD',
        itemCount: 0,
        savings: 0,
      },
      appliedPromotions: cartData?.appliedPromotions ?? [],
      couponCode: cartData?.couponCode,
      paymentMethods: store.paymentMethods,
      storeConfig: store.config
        ? {
            currencySymbol: store.config.currencySymbol,
            currencyPosition: store.config.currencyPosition,
            currencyDecimals: store.config.currencyDecimals,
            checkoutConfig: store.config.checkoutConfig,
          }
        : null,
    })

    // Set cart cookie
    response.cookies.set(CART_COOKIE, token, {
      maxAge: CART_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // needs to be readable by JS for localStorage sync
    })

    return response
  } catch (err) {
    console.error('[Cart POST]', err)
    return NextResponse.json(
      { error: 'internal_error', message: 'Internal server error' },
      { status: 500 },
    )
  }
}
