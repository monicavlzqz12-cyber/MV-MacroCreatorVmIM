import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

interface PageProps {
  params: { storeId: string }
  searchParams: { search?: string; page?: string }
}

const PAGE_SIZE = 20

function formatCurrency(val: unknown): string {
  const n = typeof val === 'number' ? val : parseFloat(String(val) || '0')
  return `$${n.toFixed(2)}`
}

export default async function CustomersPage({ params, searchParams }: PageProps) {
  const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { id: true } })
  if (!store) notFound()

  const search = searchParams.search ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const where: Record<string, unknown> = { storeId: params.storeId }
  if (search) {
    where['OR'] = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { orders: true } },
        orders: {
          select: { total: true },
          where: { status: { not: 'CANCELLED' } },
        },
      },
    }),
    prisma.customer.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged: Record<string, string | undefined> = { search, page: String(page), ...updates }
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '' && v !== '1') p.set(k, v)
    }
    return `?${p.toString()}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Customers</h3>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        {/* Search */}
        <div className="px-4 py-3 border-b border-border">
          <form method="GET">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="w-full max-w-sm px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>

        {/* Table */}
        {customers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No customers found for that search.' : 'No customers yet. They appear when orders are placed.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Phone</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Orders</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Spent</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => {
                    const totalSpent = customer.orders.reduce((sum, o) => {
                      const val = typeof o.total === 'object' && o.total !== null && 'toNumber' in o.total
                        ? (o.total as { toNumber: () => number }).toNumber()
                        : parseFloat(String(o.total) || '0')
                      return sum + val
                    }, 0)

                    return (
                      <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary">
                                {(customer.firstName?.[0] ?? customer.email[0] ?? '?').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {customer.firstName || customer.lastName
                                  ? [customer.firstName, customer.lastName].filter(Boolean).join(' ')
                                  : '—'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{customer.email}</td>
                        <td className="px-4 py-3 text-muted-foreground">{customer.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-medium">{customer._count.orders}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(totalSpent)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.createdAt.toISOString())}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} — {total} customers
                </p>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
