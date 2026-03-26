import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, orderStatusColor, paymentStatusColor } from '@/lib/utils'

interface PageProps {
  params: { storeId: string }
  searchParams: {
    search?: string
    status?: string
    paymentStatus?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }
}

const PAGE_SIZE = 20
const STATUS_TABS = ['All', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default async function OrdersPage({ params, searchParams }: PageProps) {
  const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { id: true } })
  if (!store) notFound()

  const search = searchParams.search ?? ''
  const status = searchParams.status ?? 'All'
  const paymentStatus = searchParams.paymentStatus ?? ''
  const dateFrom = searchParams.dateFrom ?? ''
  const dateTo = searchParams.dateTo ?? ''
  const page = parseInt(searchParams.page ?? '1', 10)

  const where: Record<string, unknown> = { storeId: params.storeId }
  if (status && status !== 'All') where.status = status
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom)
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + 'T23:59:59Z')
  }
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { guestEmail: { contains: search, mode: 'insensitive' } },
      { guestFirstName: { contains: search, mode: 'insensitive' } },
      { guestLastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Orders</h3>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <a
          href={`/api/stores/${params.storeId}/orders/export?status=${status}&search=${search}`}
          className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
        >
          Export CSV
        </a>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        {/* Filters */}
        <div className="px-4 py-3 border-b border-border space-y-3">
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab}
                href={`/stores/${params.storeId}/orders?status=${tab}&search=${search}&paymentStatus=${paymentStatus}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
          <form method="get" action={`/stores/${params.storeId}/orders`} className="flex flex-wrap gap-3">
            <input type="hidden" name="status" value={status} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search orders..."
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
            />
            <select
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
            >
              <option value="">All Payment</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 transition-opacity"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stores/${params.storeId}/orders/${order.id}`}
                      className="font-medium font-mono hover:text-primary"
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
                  <td className="px-4 py-3 text-right">{order._count.items}</td>
                  <td className="px-4 py-3 text-right font-medium">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/stores/${params.storeId}/orders/${order.id}`}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/stores/${params.storeId}/orders?status=${status}&search=${search}&page=${page - 1}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/stores/${params.storeId}/orders?status=${status}&search=${search}&page=${page + 1}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
