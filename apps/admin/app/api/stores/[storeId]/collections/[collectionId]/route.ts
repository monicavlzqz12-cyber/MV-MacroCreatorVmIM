import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, Prisma } from '@store-builder/database'
import { z } from 'zod'

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isAutomatic: z.boolean().optional(),
  rules: z.unknown().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  // Product assignment (manual collections)
  addProductIds: z.array(z.string()).optional(),
  removeProductIds: z.array(z.string()).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; collectionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findFirst({
    where: { id: params.collectionId, storeId: params.storeId },
    include: {
      products: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, status: true, basePrice: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  return NextResponse.json({ data: collection })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; collectionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await prisma.collection.findFirst({
    where: { id: params.collectionId, storeId: params.storeId },
  })
  if (!existing) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateCollectionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { rules, addProductIds, removeProductIds, ...rest } = parsed.data

  if (rest.slug && rest.slug !== existing.slug) {
    const conflict = await prisma.collection.findFirst({
      where: { storeId: params.storeId, slug: rest.slug, id: { not: params.collectionId } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const collection = await prisma.$transaction(async (tx) => {
    const updated = await tx.collection.update({
      where: { id: params.collectionId },
      data: {
        ...rest,
        ...(rules !== undefined
          ? { rules: rules === null ? Prisma.JsonNull : rules as Prisma.InputJsonValue }
          : {}),
      },
    })

    if (removeProductIds?.length) {
      await tx.collectionsOnProducts.deleteMany({
        where: {
          collectionId: params.collectionId,
          productId: { in: removeProductIds },
        },
      })
    }

    if (addProductIds?.length) {
      await tx.collectionsOnProducts.createMany({
        data: addProductIds.map((productId, i) => ({
          collectionId: params.collectionId,
          productId,
          sortOrder: i,
        })),
        skipDuplicates: true,
      })
    }

    return updated
  })

  return NextResponse.json({ data: collection })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string; collectionId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const collection = await prisma.collection.findFirst({
    where: { id: params.collectionId, storeId: params.storeId },
  })
  if (!collection) return NextResponse.json({ error: 'Collection not found' }, { status: 404 })

  await prisma.collection.delete({ where: { id: params.collectionId } })

  return NextResponse.json({ success: true })
}
