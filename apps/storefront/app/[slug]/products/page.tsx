import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { getStoreBySlug, getStoreProducts, getStoreCategories, getActivePromotions } from '@/lib/store-data'
import { ProductGrid } from '@/components/product/product-grid'

interface ProductsPageProps {
  params: { slug: string }
  searchParams: {
    search?: string
    category?: string
    sort?: string
    page?: string
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const { theme, config } = store

  const sortBy = (searchParams.sort as 'price_asc' | 'price_desc' | 'newest' | 'featured') ?? 'newest'
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const pageSize = 20

  const [{ products, total, totalPages }, categories, promotions] = await Promise.all([
    getStoreProducts(store.id, {
      search: searchParams.search,
      categorySlug: searchParams.category,
      sortBy,
      page,
      pageSize,
    }),
    getStoreCategories(store.id),
    getActivePromotions(store.id),
  ])

  const showFilters = theme?.listingShowFilters ?? true
  const showSort = theme?.listingShowSort ?? true
  const showCount = theme?.listingShowCount ?? true

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = {
      search: searchParams.search,
      category: searchParams.category,
      sort: searchParams.sort,
      page: searchParams.page,
      ...updates,
    }
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '1') params.set(k, v)
    }
    const qs = params.toString()
    return `/${store.slug}/products${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--store-text)' }}>
            {searchParams.search
              ? `Search results for "${searchParams.search}"`
              : searchParams.category
                ? `Category: ${categories.find((c) => c.slug === searchParams.category)?.name ?? searchParams.category}`
                : 'All Products'}
          </h1>
          {showCount && (
            <p className="text-sm mt-1" style={{ color: 'var(--store-text-muted)' }}>
              {total} product{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Sort dropdown */}
        {showSort && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 hidden md:block">Sort by:</span>
            <div className="relative">
              <select
                className="appearance-none text-sm border border-gray-200 rounded-lg pl-3 pr-8 py-2 bg-white focus:outline-none focus:ring-2 cursor-pointer"
                style={{ '--tw-ring-color': 'var(--store-primary)' } as React.CSSProperties}
                defaultValue={sortBy}
                onChange={(e) => {
                  // handled via Link below for SSR
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        {showFilters && categories.length > 0 && (
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="sticky top-24">
              {/* Sort links (fallback for SSR) */}
              {showSort && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--store-text)' }}>
                    Sort By
                  </h3>
                  <nav className="space-y-1">
                    {SORT_OPTIONS.map((opt) => (
                      <Link
                        key={opt.value}
                        href={buildUrl({ sort: opt.value, page: undefined })}
                        className="block text-sm py-1 px-2 rounded transition-colors"
                        style={{
                          color: sortBy === opt.value ? 'var(--store-primary)' : 'var(--store-text-muted)',
                          fontWeight: sortBy === opt.value ? '600' : '400',
                          backgroundColor: sortBy === opt.value ? 'var(--store-primary)15' : 'transparent',
                        }}
                      >
                        {opt.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              {/* Category filter */}
              <div>
                <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--store-text)' }}>
                  Categories
                </h3>
                <nav className="space-y-1">
                  <Link
                    href={buildUrl({ category: undefined, page: undefined })}
                    className="block text-sm py-1 px-2 rounded transition-colors"
                    style={{
                      color: !searchParams.category ? 'var(--store-primary)' : 'var(--store-text-muted)',
                      fontWeight: !searchParams.category ? '600' : '400',
                    }}
                  >
                    All Products
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={buildUrl({ category: cat.slug, page: undefined })}
                      className="block text-sm py-1 px-2 rounded transition-colors"
                      style={{
                        color:
                          searchParams.category === cat.slug
                            ? 'var(--store-primary)'
                            : 'var(--store-text-muted)',
                        fontWeight: searchParams.category === cat.slug ? '600' : '400',
                      }}
                    >
                      {cat.name}
                      {cat.productCount !== undefined && (
                        <span className="ml-1 text-xs opacity-60">({cat.productCount})</span>
                      )}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
              <Link
                href={`/${store.slug}/products`}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                Clear filters
              </Link>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  {page > 1 && (
                    <Link
                      href={buildUrl({ page: String(page - 1) })}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === totalPages)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1]
                      const showEllipsis = prev !== undefined && p - prev > 1
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && (
                            <span className="px-2 text-gray-400">…</span>
                          )}
                          <Link
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
                        </React.Fragment>
                      )
                    })}
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

