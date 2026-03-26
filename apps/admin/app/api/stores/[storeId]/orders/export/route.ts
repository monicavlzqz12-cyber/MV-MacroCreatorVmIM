import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'

function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  if (typeof val === 'object' && 'toNumber' in (val as object)) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

function escapeCsv(val: string | number | null | undefined): string {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') ?? ''
  const dateFrom = searchParams.get('dateFrom') ?? ''
  const dateTo = searchParams.get('dateTo') ?? ''

  const where: Record<string, unknown> = { storeId: params.storeId }
  if (status && status !== 'All') where.status = status
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59Z')
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 10000,
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true } },
        },
      },
    },
  })

  const HEADERS = [
    'Order Number', 'Date', 'Status', 'Payment Status',
    'Customer Name', 'Customer Email', 'Phone',
    'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total',
    'Items Count', 'Item Names',
    'Shipping Address', 'Notes',
  ]

  const rows: string[][] = [HEADERS]

  for (const order of orders) {
    const itemNames = order.items.map((i) => `${i.product.name} x${i.quantity}`).join('; ')
    const addr = order.shippingAddress as Record<string, string> | null
    const addrStr = addr
      ? [addr['line1'], addr['city'], addr['state'], addr['postalCode'], addr['country']].filter(Boolean).join(', ')
      : ''

    rows.push([
      order.orderNumber,
      order.createdAt.toISOString().slice(0, 10),
      order.status,
      order.paymentStatus,
      [order.guestFirstName, order.guestLastName].filter(Boolean).join(' ') || '',
      order.guestEmail ?? '',
      order.guestPhone ?? '',
      toNum(order.subtotal).toFixed(2),
      toNum(order.discountAmount).toFixed(2),
      toNum(order.shippingAmount).toFixed(2),
      toNum(order.taxAmount).toFixed(2),
      toNum(order.total).toFixed(2),
      String(order.items.length),
      itemNames,
      addrStr,
      order.customerNotes ?? '',
    ].map(escapeCsv))
  }

  const csv = rows.map((row) => row.join(',')).join('\r\n')
  const filename = `orders-${store.slug}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
