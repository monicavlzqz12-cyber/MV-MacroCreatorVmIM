import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
  featured: z.boolean().default(false),
  basePrice: z.number().min(0),
  compareAtPrice: z.number().optional().nullable(),
  costPrice: z.number().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  trackInventory: z.boolean().default(false),
  inventoryCount: z.number().int().optional().nullable(),
  lowStockThreshold: z.number().int().optional().nullable(),
  allowBackorder: z.boolean().default(false),
  isDigital: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    sortOrder: z.number().int().default(0),
  })).optional(),
  variants: z.array(z.object({
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
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const searchParams = request.nextUrl.searchParams
  const search = searchParams.get('search') ?? ''
  const status = searchParams.get('status') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10)

  const where: Record<string, unknown> = { storeId: params.storeId }
  if (status && status !== 'All') where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        categories: { include: { category: { select: { name: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({
    data: products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
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

  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { categoryIds, collectionIds, images, variants, ...productData } = parsed.data

  // Check slug uniqueness within store
  const existing = await prisma.product.findFirst({
    where: { storeId: params.storeId, slug: productData.slug },
  })
  if (existing) {
    return NextResponse.json({ error: 'A product with this slug already exists in this store.' }, { status: 409 })
  }

  const product = await prisma.product.create({
    data: {
      ...productData,
      storeId: params.storeId,
      tags: productData.tags ?? [],
      images: images
        ? { create: images }
        : undefined,
      variants: variants?.length
        ? {
          create: variants.map((v) => ({
            ...v,
            options: [],
          })),
        }
        : undefined,
      categories: categoryIds?.length
        ? {
          create: categoryIds.map((categoryId) => ({ categoryId })),
        }
        : undefined,
      collections: collectionIds?.length
        ? {
          create: collectionIds.map((collectionId) => ({ collectionId })),
        }
        : undefined,
    },
    include: {
      images: true,
      variants: true,
      categories: { include: { category: true } },
    },
  })

  return NextResponse.json({ data: product }, { status: 201 })
}
