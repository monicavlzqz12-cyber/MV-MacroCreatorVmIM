import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
    select: { id: true },
  })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const [
    totalOrders,
    revenue,
    pendingOrders,
    totalProducts,
    activeProducts,
    totalCustomers,
    recentOrders,
    config,
  ] = await Promise.all([
    prisma.order.count({ where: { storeId: params.storeId } }),
    prisma.order.aggregate({
      where: {
        storeId: params.storeId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { storeId: params.storeId, status: 'PENDING' } }),
    prisma.product.count({ where: { storeId: params.storeId } }),
    prisma.product.count({ where: { storeId: params.storeId, status: 'ACTIVE' } }),
    prisma.customer.count({ where: { storeId: params.storeId } }),
    prisma.order.findMany({
      where: { storeId: params.storeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        currency: true,
        guestEmail: true,
        guestFirstName: true,
        guestLastName: true,
        createdAt: true,
        updatedAt: true,
        storeId: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.storeConfig.findUnique({
      where: { storeId: params.storeId },
      select: { currency: true },
    }),
  ])

  const metrics = {
    totalOrders,
    totalRevenue: Number(revenue._sum.total ?? 0),
    totalProducts,
    activeProducts,
    pendingOrders,
    totalCustomers,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      storeId: o.storeId,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      total: Number(o.total),
      currency: o.currency,
      customerName: o.guestFirstName
        ? `${o.guestFirstName} ${o.guestLastName ?? ''}`.trim()
        : o.guestEmail ?? undefined,
      customerEmail: o.guestEmail ?? undefined,
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    })),
    currency: config?.currency ?? 'USD',
  }

  return NextResponse.json({ data: metrics })
}
