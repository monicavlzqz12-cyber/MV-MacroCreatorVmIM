import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { notFound } from 'next/navigation'

interface PageProps {
  params: { storeId: string }
  searchParams: { search?: string; status?: string; page?: string }
}

const PAGE_SIZE = 20
const STATUS_TABS = ['All', 'ACTIVE', 'DRAFT', 'INACTIVE', 'ARCHIVED']

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  INACTIVE: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-red-100 text-red-800',
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { id: true } })
  if (!store) notFound()

  const search = searchParams.search ?? ''
  const status = searchParams.status ?? 'All'
  const page = parseInt(searchParams.page ?? '1', 10)

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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        categories: { include: { category: { select: { name: true } } } },
      },
    }),
    prisma.product.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Products</h3>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Link
          href={`/stores/${params.storeId}/catalog/products/new`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        {/* Filters */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-4 flex-wrap">
          <div className="flex gap-1">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab}
                href={`/stores/${params.storeId}/catalog/products?status=${tab}&search=${search}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  status === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab === 'All' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </Link>
            ))}
          </div>
          <form method="get" action={`/stores/${params.storeId}/catalog/products`}>
            <input type="hidden" name="status" value={status} />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search products..."
              className="px-3 py-1.5 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring w-56"
            />
          </form>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Inventory</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categories</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.images[0].alt ?? product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No img
                        </div>
                      )}
                      <Link
                        href={`/stores/${params.storeId}/catalog/products/${product.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {product.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{product.sku ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[product.status] ?? 'bg-gray-100 text-gray-800'}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">${Number(product.basePrice).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{product.inventoryCount ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {product.categories.map((pc) => pc.category.name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(product.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/stores/${params.storeId}/catalog/products/${product.id}`}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No products found.
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
                  href={`/stores/${params.storeId}/catalog/products?status=${status}&search=${search}&page=${page - 1}`}
                  className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/stores/${params.storeId}/catalog/products?status=${status}&search=${search}&page=${page + 1}`}
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
