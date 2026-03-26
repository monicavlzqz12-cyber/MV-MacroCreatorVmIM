import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  promotionId: z.string().optional().nullable(),
  type: z.enum(['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'GIFT']).optional().nullable(),
  discountValue: z.number().optional().nullable(),
  target: z.enum(['ALL', 'PRODUCT', 'CATEGORY', 'COLLECTION', 'CART_VALUE']).default('ALL'),
  minOrderAmount: z.number().optional().nullable(),
  maxDiscountAmount: z.number().optional().nullable(),
  maxUses: z.number().int().optional().nullable(),
  maxUsesPerUser: z.number().int().optional().nullable(),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const coupons = await prisma.coupon.findMany({
    where: { storeId: params.storeId },
    orderBy: { createdAt: 'desc' },
    include: { promotion: { select: { id: true, name: true, type: true } } },
  })

  return NextResponse.json({ data: coupons })
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

  const parsed = createCouponSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Check code uniqueness within store
  const existing = await prisma.coupon.findUnique({
    where: { storeId_code: { storeId: params.storeId, code: parsed.data.code } },
  })
  if (existing) return NextResponse.json({ error: 'Coupon code already exists in this store.' }, { status: 409 })

  const { startsAt, endsAt, ...couponData } = parsed.data

  const coupon = await prisma.coupon.create({
    data: {
      ...couponData,
      storeId: params.storeId,
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null,
    },
  })

  return NextResponse.json({ data: coupon }, { status: 201 })
}
