import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getStoreBySlug, getStoreProducts, getActivePromotions } from '@/lib/store-data'
import { ProductGrid } from '@/components/product/product-grid'
import { Search } from 'lucide-react'

interface SearchPageProps {
  params: { slug: string }
  searchParams: { q?: string; sort?: string; page?: string }
}

export async function generateMetadata({ params, searchParams }: SearchPageProps): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)
  if (!store) return { title: 'Not Found' }
  const q = searchParams.q ?? ''
  return {
    title: q ? `Search: "${q}" — ${store.name}` : `Search — ${store.name}`,
    robots: { index: false },
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
]

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const { theme, config } = store
  const q = (searchParams.q ?? '').trim()
  const sortBy = (searchParams.sort as 'price_asc' | 'price_desc' | 'newest' | 'featured') ?? 'newest'
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const pageSize = 20

  const hasQuery = q.length >= 2

  const [{ products, total, totalPages }, promotions] = await Promise.all([
    hasQuery
      ? getStoreProducts(store.id, { search: q, sortBy, page, pageSize })
      : Promise.resolve({ products: [], total: 0, totalPages: 0 }),
    getActivePromotions(store.id),
  ])

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const merged = { q, sort: searchParams.sort, page: searchParams.page, ...updates }
    const qp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '1') qp.set(k, v)
    }
    return `/${store.slug}/search?${qp.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--store-text-muted)' }}>
        <Link href={`/${store.slug}`} className="hover:underline">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--store-text)' }}>Search</span>
      </nav>

      {/* Search bar */}
      <form method="GET" className="mb-8">
        <div className="relative max-w-xl">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
            style={{ color: 'var(--store-text-muted)' }}
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products..."
            autoFocus
            className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 bg-white"
            style={{
              color: 'var(--store-text)',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ['--tw-ring-color' as any]: 'var(--store-primary)',
            }}
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--store-primary)' }}
          >
            Search
          </button>
        </div>
      </form>

      {!hasQuery ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 mb-4" style={{ color: 'var(--store-text-muted)' }} />
          <p className="text-lg" style={{ color: 'var(--store-text-muted)' }}>
            Enter at least 2 characters to search
          </p>
        </div>
      ) : (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: 'var(--store-text)' }}>
                {total > 0
                  ? `${total} result${total !== 1 ? 's' : ''} for "${q}"`
                  : `No results for "${q}"`}
              </h1>
            </div>
            {total > 0 && (theme?.listingShowSort ?? true) && (
              <div className="flex items-center gap-2">
                <span className="text-sm hidden md:block" style={{ color: 'var(--store-text-muted)' }}>Sort:</span>
                <div className="flex gap-1 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.value}
                      href={buildUrl({ sort: opt.value, page: undefined })}
                      className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                      style={{
                        borderColor: sortBy === opt.value ? 'var(--store-primary)' : '#E5E7EB',
                        backgroundColor: sortBy === opt.value ? 'var(--store-primary)' : 'transparent',
                        color: sortBy === opt.value ? '#ffffff' : 'var(--store-text-muted)',
                      }}
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium" style={{ color: 'var(--store-text-muted)' }}>
                No products found matching your search
              </p>
              <div className="mt-6 flex gap-3">
                <Link
                  href={`/${store.slug}/products`}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  style={{ color: 'var(--store-text)' }}
                >
                  Browse all products
                </Link>
                <Link
                  href={`/${store.slug}`}
                  className="text-sm px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  Go to home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <ProductGrid
                products={products}
                theme={theme}
                config={config}
                promotions={promotions}
                slug={params.slug}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                    .map((p) => (
                      <Link
                        key={p}
                        href={buildUrl({ page: String(p) })}
                        className="px-4 py-2 text-sm border rounded-lg transition-colors"
                        style={{
                          borderColor: p === page ? 'var(--store-primary)' : '#E5E7EB',
                          backgroundColor: p === page ? 'var(--store-primary)' : 'transparent',
                          color: p === page ? '#ffffff' : 'var(--store-text)',
                        }}
                      >
                        {p}
                      </Link>
                    ))}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
