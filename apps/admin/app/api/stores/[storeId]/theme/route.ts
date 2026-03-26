import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { validateCustomCss } from '@/lib/sanitize'
import { z } from 'zod'

const updateThemeSchema = z.object({
  presetName: z.string().optional(),
  cardStyle: z.enum(['standard', 'compact', 'minimal', 'bold', 'overlay']).optional(),
  cardShowRating: z.boolean().optional(),
  cardShowBadges: z.boolean().optional(),
  cardShowQuickAdd: z.boolean().optional(),
  cardImageRatio: z.enum(['1:1', '4:3', '3:4', '16:9']).optional(),
  cardHoverEffect: z.enum(['zoom', 'fade', 'lift', 'none']).optional(),
  cardPricePosition: z.enum(['below', 'overlay']).optional(),
  headerStyle: z.enum(['standard', 'centered', 'minimal', 'floating']).optional(),
  headerSticky: z.boolean().optional(),
  headerShowSearch: z.boolean().optional(),
  headerShowCart: z.boolean().optional(),
  headerLogoMaxHeight: z.number().int().min(24).max(120).optional(),
  headerNavLayout: z.enum(['horizontal', 'dropdown', 'megamenu']).optional(),
  footerStyle: z.string().optional(),
  buttonStyle: z.enum(['filled', 'outlined', 'ghost', 'soft']).optional(),
  buttonRadius: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
  listingDefaultView: z.enum(['grid', 'list']).optional(),
  listingColumns: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  listingShowFilters: z.boolean().optional(),
  listingShowSort: z.boolean().optional(),
  listingShowCount: z.boolean().optional(),
  pdpLayout: z.enum(['standard', 'wide', 'minimal', 'split']).optional(),
  pdpShowRelated: z.boolean().optional(),
  pdpRelatedCount: z.number().int().min(0).max(12).optional(),
  pdpImageLayout: z.enum(['gallery', 'carousel', 'stacked', 'thumbnails']).optional(),
  pdpShowShare: z.boolean().optional(),
  pdpShowSku: z.boolean().optional(),
  pdpShowStock: z.boolean().optional(),
  priceShowOriginal: z.boolean().optional(),
  priceShowSavings: z.boolean().optional(),
  priceShowSavingsPct: z.boolean().optional(),
  priceColorDiscount: z.string().optional(),
  priceColorOriginal: z.string().optional(),
  customCss: z.string().optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const theme = await prisma.storeTheme.findUnique({ where: { storeId: params.storeId } })
  return NextResponse.json({ data: theme })
}

export async function PUT(
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

  const parsed = updateThemeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = { ...parsed.data }

  // Sanitize custom CSS
  if (data.customCss) {
    const { sanitized } = validateCustomCss(data.customCss)
    data.customCss = sanitized
  }

  const theme = await prisma.storeTheme.upsert({
    where: { storeId: params.storeId },
    create: {
      storeId: params.storeId,
      presetName: data.presetName ?? 'default',
      cardStyle: data.cardStyle ?? 'standard',
      cardShowRating: data.cardShowRating ?? true,
      cardShowBadges: data.cardShowBadges ?? true,
      cardShowQuickAdd: data.cardShowQuickAdd ?? true,
      cardImageRatio: data.cardImageRatio ?? '1:1',
      cardHoverEffect: data.cardHoverEffect ?? 'zoom',
      cardPricePosition: data.cardPricePosition ?? 'below',
      headerStyle: data.headerStyle ?? 'standard',
      headerSticky: data.headerSticky ?? true,
      headerShowSearch: data.headerShowSearch ?? true,
      headerShowCart: data.headerShowCart ?? true,
      headerLogoMaxHeight: data.headerLogoMaxHeight ?? 48,
      headerNavLayout: data.headerNavLayout ?? 'horizontal',
      footerStyle: data.footerStyle ?? 'standard',
      buttonStyle: data.buttonStyle ?? 'filled',
      buttonRadius: data.buttonRadius ?? 'md',
      listingDefaultView: data.listingDefaultView ?? 'grid',
      listingColumns: data.listingColumns ?? 4,
      listingShowFilters: data.listingShowFilters ?? true,
      listingShowSort: data.listingShowSort ?? true,
      listingShowCount: data.listingShowCount ?? true,
      pdpLayout: data.pdpLayout ?? 'standard',
      pdpShowRelated: data.pdpShowRelated ?? true,
      pdpRelatedCount: data.pdpRelatedCount ?? 4,
      pdpImageLayout: data.pdpImageLayout ?? 'gallery',
      pdpShowShare: data.pdpShowShare ?? true,
      pdpShowSku: data.pdpShowSku ?? true,
      pdpShowStock: data.pdpShowStock ?? true,
      priceShowOriginal: data.priceShowOriginal ?? true,
      priceShowSavings: data.priceShowSavings ?? true,
      priceShowSavingsPct: data.priceShowSavingsPct ?? true,
      priceColorDiscount: data.priceColorDiscount ?? '#DC2626',
      priceColorOriginal: data.priceColorOriginal ?? '#6B7280',
      customCss: data.customCss ?? null,
    },
    update: data,
  })

  return NextResponse.json({ data: theme })
}
