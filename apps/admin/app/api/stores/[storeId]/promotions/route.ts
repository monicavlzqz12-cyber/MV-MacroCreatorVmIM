import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const promotionItemSchema = z.object({
  productId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
})

const createPromotionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'GIFT']),
  target: z.enum(['ALL', 'PRODUCT', 'CATEGORY', 'COLLECTION', 'CART_VALUE']).default('ALL'),
  discountValue: z.number().min(0),
  maxDiscountAmount: z.number().optional().nullable(),
  minOrderAmount: z.number().optional().nullable(),
  minQuantity: z.number().int().optional().nullable(),
  isAutoApply: z.boolean().default(true),
  isStackable: z.boolean().default(false),
  priority: z.number().int().default(0),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  isActive: z.boolean().default(true),
  items: z.array(promotionItemSchema).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const promotions = await prisma.promotion.findMany({
    where: { storeId: params.storeId },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    include: { items: true },
  })

  return NextResponse.json({ data: promotions })
}

export async function POST(
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

  const parsed = createPromotionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { items, startsAt, endsAt, ...promoData } = parsed.data

  const promotion = await prisma.promotion.create({
    data: {
      ...promoData,
      storeId: params.storeId,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
      items: items?.length
        ? { create: items }
        : undefined,
    },
    include: { items: true },
  })

  return NextResponse.json({ data: promotion }, { status: 201 })
}
