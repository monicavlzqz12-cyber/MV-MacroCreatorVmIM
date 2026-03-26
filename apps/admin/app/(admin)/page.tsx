import { prisma } from '@store-builder/database'
import { formatCurrency, formatDate, orderStatusColor, storeStatusColor } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardData() {
  const [
    storesByStatus,
    orderAggregate,
    revenueAggregate,
    pendingCount,
    recentStores,
    recentOrders,
  ] = await Promise.all([
    prisma.store.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.order.aggregate({ _count: { id: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { orders: true, products: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        store: { select: { name: true, slug: true } },
        _count: { select: { items: true } },
      },
    }),
  ])

  const activeStores =
    storesByStatus.find((s) => s.status === 'ACTIVE')?._count.id ?? 0
  const totalStores = storesByStatus.reduce((sum, s) => sum + s._count.id, 0)
  const totalRevenue = Number(revenueAggregate._sum.total ?? 0)

  return {
    activeStores,
    totalStores,
    totalOrders: orderAggregate._count.id,
    totalRevenue,
    pendingCount,
    recentStores,
    recentOrders,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const stats = [
    { label: 'Active Stores', value: data.activeStores.toString(), sub: `${data.totalStores} total` },
    { label: 'Total Orders', value: data.totalOrders.toString(), sub: `${data.pendingCount} pending` },
    { label: 'Total Revenue', value: formatCurrency(data.totalRevenue, 'USD', '$', 'before', 2), sub: 'Confirmed+ orders' },
    { label: 'Pending Orders', value: data.pendingCount.toString(), sub: 'Awaiting confirmation' },
  ]

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Stores */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Stores</h2>
            <Link href="/stores" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentStores.map((store) => (
              <div key={store.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link
                    href={`/stores/${store.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {store.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {store._count.orders} orders · {store._count.products} products
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${storeStatusColor(store.status)}`}
                >
                  {store.status}
                </span>
              </div>
            ))}
            {data.recentStores.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No stores yet.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
          </div>
          <div className="divide-y divide-border">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <Link
                    href={`/stores/${order.storeId}/orders/${order.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    #{order.orderNumber}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {order.store.name} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    ${Number(order.total).toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="px-5 py-4 text-sm text-muted-foreground">No orders yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
