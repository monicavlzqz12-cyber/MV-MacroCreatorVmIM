import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const updateStoreSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  notes: z.string().optional().nullable(),
})

async function getStore(storeId: string) {
  return prisma.store.findUnique({
    where: { id: storeId },
    include: {
      config: true,
      theme: true,
      cartConfig: true,
    },
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await getStore(params.storeId)
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  return NextResponse.json({ data: store })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateStoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { slug, domain } = parsed.data

  if (slug && slug !== store.slug) {
    const existing = await prisma.store.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
  }

  if (domain && domain !== store.domain) {
    const existing = await prisma.store.findUnique({ where: { domain } })
    if (existing) {
      return NextResponse.json({ error: 'Domain already in use' }, { status: 409 })
    }
  }

  const updated = await prisma.store.update({
    where: { id: params.storeId },
    data: parsed.data,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) {
    return NextResponse.json({ error: 'Store not found' }, { status: 404 })
  }

  // Soft delete — archive instead of deleting
  const updated = await prisma.store.update({
    where: { id: params.storeId },
    data: { status: 'ARCHIVED' },
  })

  return NextResponse.json({ data: updated })
}
