import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getStoreBySlug, getStoreCollections } from '@/lib/store-data'
import { Layers } from 'lucide-react'

interface CollectionsPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: CollectionsPageProps): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)
  if (!store) return { title: 'Not Found' }
  return {
    title: `Collections — ${store.name}`,
    description: `Browse all curated collections at ${store.name}`,
  }
}

export default async function CollectionsPage({ params }: CollectionsPageProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const collections = await getStoreCollections(store.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--store-text-muted)' }}>
        <Link href={`/${store.slug}`} className="hover:underline">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--store-text)' }}>Collections</span>
      </nav>

      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--store-text)' }}>Collections</h1>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Layers className="w-12 h-12 mb-4" style={{ color: 'var(--store-text-muted)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--store-text-muted)' }}>
            No collections yet
          </p>
          <Link
            href={`/${store.slug}/products`}
            className="mt-4 text-sm font-medium hover:underline"
            style={{ color: 'var(--store-primary)' }}
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/${store.slug}/collections/${col.slug}`}
              className="group block rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-all"
            >
              {col.imageUrl ? (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={col.imageUrl}
                    alt={col.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
                    <div>
                      <h2 className="text-lg font-bold text-white">{col.name}</h2>
                      <p className="text-xs text-white/80 mt-0.5">
                        {col.productCount} product{col.productCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: 'var(--store-surface)' }}
                >
                  <Layers className="w-8 h-8" style={{ color: 'var(--store-text-muted)' }} />
                </div>
              )}
              {!col.imageUrl && (
                <div className="p-4">
                  <h2 className="font-semibold" style={{ color: 'var(--store-text)' }}>{col.name}</h2>
                  {col.description && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--store-text-muted)' }}>
                      {col.description}
                    </p>
                  )}
                  <p className="text-xs mt-2 font-medium" style={{ color: 'var(--store-primary)' }}>
                    {col.productCount} product{col.productCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
