import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { sanitizePaymentInstructions } from '@/lib/sanitize'
import { z } from 'zod'

const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'CUSTOM_BLOCKS', 'EXTERNAL_LINK', 'MANUAL']).optional(),
  instructions: z.string().optional().nullable(),
  redirectUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; paymentId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const method = await prisma.paymentMethod.findFirst({
    where: { id: params.paymentId, storeId: params.storeId },
  })
  if (!method) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })

  return NextResponse.json({ data: method })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; paymentId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const method = await prisma.paymentMethod.findFirst({
    where: { id: params.paymentId, storeId: params.storeId },
  })
  if (!method) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updatePaymentMethodSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = { ...parsed.data }

  if (data.instructions) {
    data.instructions = sanitizePaymentInstructions(data.instructions)
  }

  const updated = await prisma.paymentMethod.update({
    where: { id: params.paymentId },
    data,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string; paymentId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const method = await prisma.paymentMethod.findFirst({
    where: { id: params.paymentId, storeId: params.storeId },
  })
  if (!method) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })

  await prisma.paymentMethod.delete({ where: { id: params.paymentId } })
  return NextResponse.json({ success: true })
}
