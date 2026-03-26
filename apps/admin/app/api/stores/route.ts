import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED', 'All']).optional(),
})

const createStoreSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const parsed = paginationSchema.safeParse(params)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { page, pageSize, search, status } = parsed.data
  const where: Record<string, unknown> = {}
  if (status && status !== 'All') where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { domain: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { orders: true, products: true } },
      },
    }),
    prisma.store.count({ where }),
  ])

  return NextResponse.json({
    data: stores,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = createStoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { name, slug, domain, description, status } = parsed.data

  // Check slug uniqueness
  const existing = await prisma.store.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already exists. Please choose a different slug.' }, { status: 409 })
  }

  // Check domain uniqueness
  if (domain) {
    const domainExists = await prisma.store.findUnique({ where: { domain } })
    if (domainExists) {
      return NextResponse.json({ error: 'Domain already in use.' }, { status: 409 })
    }
  }

  const store = await prisma.store.create({
    data: {
      name,
      slug,
      domain: domain ?? undefined,
      description: description ?? undefined,
      status: status as 'DRAFT' | 'ACTIVE' | 'INACTIVE',
      config: {
        create: {
          primaryColor: '#111827',
          secondaryColor: '#6B7280',
          accentColor: '#2563EB',
          backgroundColor: '#FFFFFF',
          surfaceColor: '#F9FAFB',
          fontHeading: 'Inter',
          fontBody: 'Inter',
          borderRadius: 'md',
          currency: 'USD',
          currencySymbol: '$',
          currencyPosition: 'before',
          currencyDecimals: 2,
          language: 'en',
          country: 'US',
          timezone: 'UTC',
          weightUnit: 'kg',
          dimensionUnit: 'cm',
        },
      },
      theme: {
        create: {
          presetName: 'default',
          cardStyle: 'standard',
          cardShowRating: true,
          cardShowBadges: true,
          cardShowQuickAdd: true,
          cardImageRatio: '1:1',
          cardHoverEffect: 'zoom',
          cardPricePosition: 'below',
          headerStyle: 'standard',
          headerSticky: true,
          headerShowSearch: true,
          headerShowCart: true,
          headerLogoMaxHeight: 48,
          headerNavLayout: 'horizontal',
          footerStyle: 'standard',
          buttonStyle: 'filled',
          buttonRadius: 'md',
          listingDefaultView: 'grid',
          listingColumns: 4,
          listingShowFilters: true,
          listingShowSort: true,
          listingShowCount: true,
          pdpLayout: 'standard',
          pdpShowRelated: true,
          pdpRelatedCount: 4,
          pdpImageLayout: 'gallery',
          pdpShowShare: true,
          pdpShowSku: true,
          pdpShowStock: true,
          priceShowOriginal: true,
          priceShowSavings: true,
          priceShowSavingsPct: true,
          priceColorDiscount: '#DC2626',
          priceColorOriginal: '#6B7280',
        },
      },
      cartConfig: {
        create: {
          mode: 'DRAWER',
          style: 'standard',
          position: 'right',
          size: 'md',
          showImages: true,
          showVariantOptions: true,
          showQuantity: true,
          showRemove: true,
          showSubtotal: true,
          showSavings: true,
          showItemCount: true,
          showShipping: false,
          showTaxes: false,
          showPromoCode: true,
          showProgress: false,
          showUpsells: false,
          upsellProductIds: [],
          upsellMaxItems: 3,
          showCrossSells: false,
          crossSellMaxItems: 3,
          persistDays: 7,
        },
      },
    },
    include: {
      config: true,
      theme: true,
      cartConfig: true,
    },
  })

  return NextResponse.json({ data: store }, { status: 201 })
}
