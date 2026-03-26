import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  featured: z.boolean().optional(),
  basePrice: z.number().min(0).optional(),
  compareAtPrice: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  trackInventory: z.boolean().optional(),
  inventoryCount: z.number().int().optional().nullable(),
  lowStockThreshold: z.number().int().optional().nullable(),
  allowBackorder: z.boolean().optional(),
  isDigital: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  relatedProductIds: z.array(z.string()).optional(),
  publishedAt: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    sortOrder: z.number().int().default(0),
  })).optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    sku: z.string().optional().nullable(),
    price: z.number().min(0),
    compareAtPrice: z.number().optional().nullable(),
    inventoryCount: z.number().int().optional().nullable(),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; productId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const product = await prisma.product.findFirst({
    where: { id: params.productId, storeId: params.storeId },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      variants: true,
      attributes: true,
      categories: { include: { category: { select: { id: true, name: true } } } },
      collections: { include: { collection: { select: { id: true, name: true } } } },
      optionGroups: { include: { options: true } },
    },
  })

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  return NextResponse.json({ data: product })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; productId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const product = await prisma.product.findFirst({
    where: { id: params.productId, storeId: params.storeId },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { categoryIds, collectionIds, images, variants, publishedAt, ...productData } = parsed.data

  // Slug uniqueness check
  if (productData.slug && productData.slug !== product.slug) {
    const existing = await prisma.product.findFirst({
      where: { storeId: params.storeId, slug: productData.slug, NOT: { id: params.productId } },
    })
    if (existing) return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 })
  }

  // Transaction: update product + sync categories/collections/images/variants
  const updated = await prisma.$transaction(async (tx) => {
    // Sync categories
    if (categoryIds !== undefined) {
      await tx.categoriesOnProducts.deleteMany({ where: { productId: params.productId } })
      if (categoryIds.length > 0) {
        await tx.categoriesOnProducts.createMany({
          data: categoryIds.map((categoryId) => ({ productId: params.productId, categoryId })),
        })
      }
    }

    // Sync collections
    if (collectionIds !== undefined) {
      await tx.collectionsOnProducts.deleteMany({ where: { productId: params.productId } })
      if (collectionIds.length > 0) {
        await tx.collectionsOnProducts.createMany({
          data: collectionIds.map((collectionId) => ({ productId: params.productId, collectionId })),
        })
      }
    }

    // Sync images
    if (images !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: params.productId } })
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img) => ({ ...img, productId: params.productId })),
        })
      }
    }

    // Sync variants
    if (variants !== undefined) {
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: params.productId },
        select: { id: true },
      })
      const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id!))
      const toDelete = existingVariants.filter((v) => !incomingIds.has(v.id)).map((v) => v.id)
      if (toDelete.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: toDelete } } })
      }
      for (const v of variants) {
        const { id, ...variantData } = v
        if (id) {
          await tx.productVariant.update({
            where: { id },
            data: { ...variantData, options: [] },
          })
        } else {
          await tx.productVariant.create({
            data: { ...variantData, productId: params.productId, options: [] },
          })
        }
      }
    }

    // Update product
    return tx.product.update({
      where: { id: params.productId },
      data: {
        ...productData,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
        categories: { include: { category: { select: { id: true, name: true } } } },
      },
    })
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string; productId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const product = await prisma.product.findFirst({
    where: { id: params.productId, storeId: params.storeId },
  })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const updated = await prisma.product.update({
    where: { id: params.productId },
    data: { status: 'ARCHIVED' },
  })

  return NextResponse.json({ data: updated })
}
