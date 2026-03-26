import { notFound } from 'next/navigation'
import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { formatDate, formatCurrency, orderStatusColor, paymentStatusColor } from '@/lib/utils'
import { RevenueChart } from '@/components/RevenueChart'

interface PageProps {
  params: { storeId: string }
}

function toNum(val: unknown): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return val
  if (typeof val === 'object' && 'toNumber' in (val as object)) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

async function getStoreMetrics(storeId: string) {
  // Last 30 days range for chart
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const [
    totalOrders,
    revenue,
    pendingOrders,
    totalProducts,
    activeProducts,
    totalCustomers,
    recentOrders,
    config,
    recentRevenueOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { storeId } }),
    prisma.order.aggregate({
      where: {
        storeId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { storeId, status: 'PENDING' } }),
    prisma.product.count({ where: { storeId } }),
    prisma.product.count({ where: { storeId, status: 'ACTIVE' } }),
    prisma.customer.count({ where: { storeId } }),
    prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { _count: { select: { items: true } } },
    }),
    prisma.storeConfig.findUnique({
      where: { storeId },
      select: { currency: true, currencySymbol: true, currencyPosition: true, currencyDecimals: true },
    }),
    prisma.order.findMany({
      where: {
        storeId,
        status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const currency = config?.currency ?? 'USD'
  const symbol = config?.currencySymbol ?? '$'
  const position = (config?.currencyPosition as 'before' | 'after') ?? 'before'
  const decimals = config?.currencyDecimals ?? 2

  // Aggregate revenue by day for chart (last 30 days, grouped into ~10 labels)
  const dayMap = new Map<string, number>()
  for (const order of recentRevenueOrders) {
    const key = order.createdAt.toISOString().slice(0, 10)
    dayMap.set(key, (dayMap.get(key) ?? 0) + toNum(order.total))
  }

  // Build 10 evenly-spaced data points over 30 days
  const chartData: { label: string; value: number }[] = []
  const step = Math.ceil(30 / 10)
  for (let i = 0; i < 10; i++) {
    const d = new Date(thirtyDaysAgo)
    d.setDate(d.getDate() + i * step)
    const dEnd = new Date(d)
    dEnd.setDate(dEnd.getDate() + step - 1)
    let sum = 0
    for (let j = 0; j < step; j++) {
      const dd = new Date(d)
      dd.setDate(dd.getDate() + j)
      const key = dd.toISOString().slice(0, 10)
      sum += dayMap.get(key) ?? 0
    }
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    chartData.push({ label, value: sum })
  }

  return {
    totalOrders,
    totalRevenue: toNum(revenue._sum.total),
    pendingOrders,
    totalProducts,
    activeProducts,
    totalCustomers,
    recentOrders,
    chartData,
    currency,
    symbol,
    position,
    decimals,
  }
}

export default async function StoreOverviewPage({ params }: PageProps) {
  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
  })
  if (!store) notFound()

  const metrics = await getStoreMetrics(params.storeId)

  const stats = [
    { label: 'Total Orders', value: metrics.totalOrders.toString(), sub: `${metrics.pendingOrders} pending` },
    {
      label: 'Revenue',
      value: formatCurrency(metrics.totalRevenue, metrics.currency, metrics.symbol, metrics.position, metrics.decimals),
      sub: 'Confirmed+ orders',
    },
    { label: 'Products', value: metrics.totalProducts.toString(), sub: `${metrics.activeProducts} active` },
    { label: 'Customers', value: metrics.totalCustomers.toString(), sub: 'Registered accounts' },
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/stores/${params.storeId}/config`}
          className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          Edit Config
        </Link>
        <Link
          href={`/stores/${params.storeId}/catalog/products`}
          className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          Manage Products
        </Link>
        <Link
          href={`/stores/${params.storeId}/orders`}
          className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          View Orders
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Revenue — Last 30 Days</h3>
          <span className="text-sm text-muted-foreground">Confirmed orders only</span>
        </div>
        <RevenueChart data={metrics.chartData} symbol={metrics.symbol} />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold">Recent Orders</h3>
          <Link
            href={`/stores/${params.storeId}/orders`}
            className="text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/stores/${params.storeId}/orders/${order.id}`}
                      className="font-medium hover:text-primary"
                    >
                      #{order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {order.guestFirstName
                      ? `${order.guestFirstName} ${order.guestLastName ?? ''}`
                      : order.guestEmail ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${orderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(Number(order.total), metrics.currency, metrics.symbol, metrics.position, metrics.decimals)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
              {metrics.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
