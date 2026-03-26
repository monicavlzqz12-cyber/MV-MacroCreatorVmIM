import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate, storeStatusColor } from '@/lib/utils'

interface PageProps {
  searchParams: {
    search?: string
    status?: string
    page?: string
  }
}

const PAGE_SIZE = 20
const STATUS_TABS = ['All', 'ACTIVE', 'DRAFT', 'INACTIVE', 'ARCHIVED']

async function getStores(search: string, status: string, page: number) {
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { orders: true, products: true } },
      },
    }),
    prisma.store.count({ where }),
  ])

  return { stores, total, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export default async function StoresPage({ searchParams }: PageProps) {
  const search = searchParams.search ?? ''
  const status = searchParams.status ?? 'All'
  const page = parseInt(searchParams.page ?? '1', 10)

  const { stores, total, totalPages } = await getStores(search, status, page)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Stores</h2>
          <p className="text-sm text-muted-foreground">{total} stores total</p>
        </div>
        <Link
          href="/stores/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Store
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-4 flex-wrap">
          {/* Status Tabs */}
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab}
                href={`/stores?status=${tab}&search=${search}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === tab || (tab === 'All' && !status)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
          {/* Search */}
          <form method="get" action="/stores">
            <input type="hidden" name="status" value={status} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search stores..."
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug / Domain</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Products</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stores/${store.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {store.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div>{store.slug}</div>
                    {store.domain && <div className="text-xs">{store.domain}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${storeStatusColor(store.status)}`}
                    >
                      {store.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{store._count.orders}</td>
                  <td className="px-4 py-3 text-right">{store._count.products}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(store.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/stores/${store.id}`}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                      >
                        View
                      </Link>
                      <Link
                        href={`/stores/${store.id}/config`}
                        className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No stores found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/stores?status=${status}&search=${search}&page=${page - 1}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/stores?status=${status}&search=${search}&page=${page + 1}`}
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
