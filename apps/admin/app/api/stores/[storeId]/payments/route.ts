import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { sanitizePaymentInstructions } from '@/lib/sanitize'
import { z } from 'zod'

const createPaymentMethodSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  type: z.enum(['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'CUSTOM_BLOCKS', 'EXTERNAL_LINK', 'MANUAL']),
  instructions: z.string().optional().nullable(),
  redirectUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const methods = await prisma.paymentMethod.findMany({
    where: { storeId: params.storeId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({ data: methods })
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

  const parsed = createPaymentMethodSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = { ...parsed.data }

  // Sanitize HTML instructions
  if (data.instructions) {
    data.instructions = sanitizePaymentInstructions(data.instructions)
  }

  // Auto sortOrder
  let sortOrder = data.sortOrder
  if (sortOrder === undefined) {
    const max = await prisma.paymentMethod.aggregate({
      where: { storeId: params.storeId },
      _max: { sortOrder: true },
    })
    sortOrder = (max._max.sortOrder ?? -1) + 1
  }

  const method = await prisma.paymentMethod.create({
    data: { ...data, storeId: params.storeId, sortOrder },
  })

  return NextResponse.json({ data: method }, { status: 201 })
}
