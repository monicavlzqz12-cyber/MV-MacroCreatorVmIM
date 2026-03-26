import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const VALID_TEMPLATE_TYPES = [
  'ORDER_CONFIRMED',
  'PAYMENT_RECEIVED',
  'ORDER_PROCESSING',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'ORDER_REFUNDED',
]

const updateEmailTemplateSchema = z.object({
  subject: z.string().min(1).max(200),
  previewText: z.string().max(200).optional().nullable(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; templateType: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!VALID_TEMPLATE_TYPES.includes(params.templateType)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const template = await prisma.emailTemplate.findUnique({
    where: { storeId_type: { storeId: params.storeId, type: params.templateType } },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json({ data: template })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; templateType: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!VALID_TEMPLATE_TYPES.includes(params.templateType)) {
    return NextResponse.json({ error: 'Invalid template type' }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateEmailTemplateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const template = await prisma.emailTemplate.upsert({
    where: { storeId_type: { storeId: params.storeId, type: params.templateType } },
    create: {
      storeId: params.storeId,
      type: params.templateType,
      name: params.templateType
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      ...parsed.data,
    },
    update: parsed.data,
  })

  return NextResponse.json({ data: template })
}
