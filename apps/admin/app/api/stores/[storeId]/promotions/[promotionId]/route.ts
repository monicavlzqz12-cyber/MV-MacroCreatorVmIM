import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const updatePromotionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BUY_X_GET_Y', 'FREE_SHIPPING', 'GIFT']).optional(),
  target: z.enum(['ALL', 'PRODUCT', 'CATEGORY', 'COLLECTION', 'CART_VALUE']).optional(),
  discountValue: z.number().min(0).optional(),
  maxDiscountAmount: z.number().optional().nullable(),
  minOrderAmount: z.number().optional().nullable(),
  isAutoApply: z.boolean().optional(),
  isStackable: z.boolean().optional(),
  priority: z.number().int().optional(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; promotionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const promotion = await prisma.promotion.findFirst({
    where: { id: params.promotionId, storeId: params.storeId },
    include: { items: true },
  })
  if (!promotion) return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })

  return NextResponse.json({ data: promotion })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; promotionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const promotion = await prisma.promotion.findFirst({
    where: { id: params.promotionId, storeId: params.storeId },
  })
  if (!promotion) return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updatePromotionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { startsAt, endsAt, ...updateData } = parsed.data

  const updated = await prisma.promotion.update({
    where: { id: params.promotionId },
    data: {
      ...updateData,
      startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : undefined,
      endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined,
    },
    include: { items: true },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string; promotionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const promotion = await prisma.promotion.findFirst({
    where: { id: params.promotionId, storeId: params.storeId },
  })
  if (!promotion) return NextResponse.json({ error: 'Promotion not found' }, { status: 404 })

  await prisma.promotion.delete({ where: { id: params.promotionId } })
  return NextResponse.json({ success: true })
}
