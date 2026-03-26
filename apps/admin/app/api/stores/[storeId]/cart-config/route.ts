import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@store-builder/database'
import { z } from 'zod'

const cartStyleTokensSchema = z.object({
  backgroundColor: z.string().optional(),
  headerBg: z.string().optional(),
  itemBg: z.string().optional(),
  borderColor: z.string().optional(),
  fontFamily: z.string().optional(),
  checkoutButtonBg: z.string().optional(),
  checkoutButtonColor: z.string().optional(),
  checkoutButtonRadius: z.string().optional(),
  checkoutButtonFontWeight: z.string().optional(),
  itemImageRadius: z.string().optional(),
  quantityStyle: z.enum(['input', 'stepper', 'select']).optional(),
}).optional().nullable()

const updateCartConfigSchema = z.object({
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
  freeShippingThreshold: z.number().optional().nullable(),
  showUpsells: z.boolean().optional(),
  upsellTitle: z.string().optional().nullable(),
  upsellProductIds: z.array(z.string()).optional(),
  upsellMaxItems: z.number().int().min(0).max(20).optional(),
  showCrossSells: z.boolean().optional(),
  crossSellTitle: z.string().optional().nullable(),
  crossSellMaxItems: z.number().int().min(0).max(20).optional(),
  cartTitle: z.string().optional().nullable(),
  emptyTitle: z.string().optional().nullable(),
  emptyMessage: z.string().optional().nullable(),
  checkoutButtonText: z.string().optional().nullable(),
  continueShoppingText: z.string().optional().nullable(),
  orderSummaryTitle: z.string().optional().nullable(),
  persistDays: z.number().int().min(1).max(365).optional(),
  styleTokens: cartStyleTokensSchema,
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const config = await prisma.cartConfig.findUnique({ where: { storeId: params.storeId } })
  return NextResponse.json({ data: config })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateCartConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { styleTokens, ...restData } = parsed.data
  const styleTokensJson =
    styleTokens === null ? Prisma.JsonNull : styleTokens === undefined ? undefined : styleTokens

  const config = await prisma.cartConfig.upsert({
    where: { storeId: params.storeId },
    create: {
      storeId: params.storeId,
      mode: parsed.data.mode ?? 'DRAWER',
      style: parsed.data.style ?? 'standard',
      position: parsed.data.position ?? 'right',
      size: parsed.data.size ?? 'md',
      showImages: parsed.data.showImages ?? true,
      showVariantOptions: parsed.data.showVariantOptions ?? true,
      showQuantity: parsed.data.showQuantity ?? true,
      showRemove: parsed.data.showRemove ?? true,
      showSubtotal: parsed.data.showSubtotal ?? true,
      showSavings: parsed.data.showSavings ?? true,
      showItemCount: parsed.data.showItemCount ?? true,
      showShipping: parsed.data.showShipping ?? false,
      showTaxes: parsed.data.showTaxes ?? false,
      showPromoCode: parsed.data.showPromoCode ?? true,
      showProgress: parsed.data.showProgress ?? false,
      showUpsells: parsed.data.showUpsells ?? false,
      upsellProductIds: parsed.data.upsellProductIds ?? [],
      upsellMaxItems: parsed.data.upsellMaxItems ?? 3,
      showCrossSells: parsed.data.showCrossSells ?? false,
      crossSellMaxItems: parsed.data.crossSellMaxItems ?? 3,
      persistDays: parsed.data.persistDays ?? 7,
      ...restData,
      styleTokens: styleTokensJson,
    },
    update: { ...restData, styleTokens: styleTokensJson },
  })

  return NextResponse.json({ data: config })
}
