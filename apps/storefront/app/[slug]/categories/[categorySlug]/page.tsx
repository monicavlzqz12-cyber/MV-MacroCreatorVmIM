import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getStoreBySlug, getStoreProducts, getStoreCategories, getActivePromotions } from '@/lib/store-data'
import { ProductGrid } from '@/components/product/product-grid'

interface CategoryPageProps {
  params: { slug: string; categorySlug: string }
  searchParams: {
    sort?: string
    page?: string
    search?: string
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)
  if (!store) return { title: 'Category Not Found' }
  const categories = await getStoreCategories(store.id)
  const category = categories.find((c) => c.slug === params.categorySlug)
  if (!category) return { title: 'Category Not Found' }

  return {
    title: `${category.name} — ${store.name}`,
    description: category.description ?? undefined,
  }
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'featured', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const { theme, config } = store

  const categories = await getStoreCategories(store.id)
  const category = categories.find((c) => c.slug === params.categorySlug)

  if (!category) notFound()

  const sortBy = (searchParams.sort as 'price_asc' | 'price_desc' | 'newest' | 'featured') ?? 'newest'
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const pageSize = 20

  const [{ products, total, totalPages }, promotions] = await Promise.all([
    getStoreProducts(store.id, {
      search: searchParams.search,
      categorySlug: params.categorySlug,
      sortBy,
      page,
      pageSize,
    }),
    getActivePromotions(store.id),
  ])

  const showSort = theme?.listingShowSort ?? true
  const showCount = theme?.listingShowCount ?? true

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const merged = {
      sort: searchParams.sort,
      page: searchParams.page,
      search: searchParams.search,
      ...updates,
    }
    const qp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== '1') qp.set(k, v)
    }
    const qs = qp.toString()
    return `/${store.slug}/categories/${params.categorySlug}${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--store-text-muted)' }}>
        <Link href={`/${store.slug}`} className="hover:underline">Home</Link>
        <span>/</span>
        <Link href={`/${store.slug}/products`} className="hover:underline">Products</Link>
        <span>/</span>
        <span style={{ color: 'var(--store-text)' }}>{category.name}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          {category.imageUrl && (
            <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 bg-gray-100">
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <h1 className="text-3xl font-bold text-white">{category.name}</h1>
              </div>
            </div>
          )}
          {!category.imageUrl && (
            <h1 className="text-2xl font-bold" style={{ color: 'var(--store-text)' }}>
              {category.name}
            </h1>
          )}
          {category.description && (
            <p className="text-sm mt-2" style={{ color: 'var(--store-text-muted)' }}>
              {category.description}
            </p>
          )}
          {showCount && (
            <p className="text-sm mt-1" style={{ color: 'var(--store-text-muted)' }}>
              {total} product{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Sort */}
        {showSort && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm text-gray-500 hidden md:block">Sort:</span>
            <div className="flex flex-wrap gap-1">
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

      {/* Subcategories */}
      {(() => {
        const subs = categories.filter((c) => c.parentId === category.id)
        if (subs.length === 0) return null
        return (
          <div className="flex gap-2 flex-wrap mb-6">
            {subs.map((sub) => (
              <Link
                key={sub.id}
                href={`/${store.slug}/categories/${sub.slug}`}
                className="text-sm px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ color: 'var(--store-text)' }}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )
      })()}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-lg font-medium">No products in this category</p>
          <Link
            href={`/${store.slug}/products`}
            className="mt-4 text-sm font-medium hover:underline"
            style={{ color: 'var(--store-primary)' }}
          >
            Browse all products
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
    </div>
  )
}
