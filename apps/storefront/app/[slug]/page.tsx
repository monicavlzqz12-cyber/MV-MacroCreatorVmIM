import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getStoreBySlug, getStoreProducts, getStoreCategories, getActivePromotions } from '@/lib/store-data'
import { ProductGrid } from '@/components/product/product-grid'
import type { StoreBanner, ContentBlock } from '@store-builder/types'

interface StoreHomeProps {
  params: { slug: string }
}

export default async function StoreHomePage({ params }: StoreHomeProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const [{ products: featuredProducts }, categories, promotions] = await Promise.all([
    getStoreProducts(store.id, { featured: true, pageSize: 8, sortBy: 'featured' }),
    getStoreCategories(store.id),
    getActivePromotions(store.id),
  ])

  const { config, theme } = store
  const banners = (config?.banners ?? []) as StoreBanner[]
  const contentBlocks = (config?.contentBlocks ?? []) as ContentBlock[]

  const activeBanners = banners.filter((b) => {
    if (!b.isActive) return false
    const now = new Date()
    if (b.startsAt && new Date(b.startsAt) > now) return false
    if (b.endsAt && new Date(b.endsAt) < now) return false
    return true
  })

  const heroBanner = activeBanners.find((b) => b.type === 'hero')
  const stripBanners = activeBanners.filter((b) => b.type === 'strip' || b.type === 'announcement')

  const homeTopBlocks = contentBlocks.filter(
    (b) => b.isActive && b.position === 'home_top',
  )
  const homeBottomBlocks = contentBlocks.filter(
    (b) => b.isActive && b.position === 'home_bottom',
  )
  const homeMiddleBlocks = contentBlocks.filter(
    (b) => b.isActive && b.position === 'home_middle',
  )

  return (
    <div>
      {/* Announcement strip banners */}
      {stripBanners.map((banner) => (
        <div
          key={banner.id}
          className="w-full py-2 px-4 text-center text-sm font-medium"
          style={{
            backgroundColor: banner.bgColor ?? 'var(--store-primary)',
            color: banner.textColor ?? '#ffffff',
          }}
        >
          {banner.text ?? banner.title}
          {banner.ctaLabel && banner.ctaUrl && (
            <Link
              href={banner.ctaUrl}
              className="ml-2 underline underline-offset-2"
            >
              {banner.ctaLabel}
            </Link>
          )}
        </div>
      ))}

      {/* Home top blocks */}
      {homeTopBlocks.map((block) => (
        <ContentBlockRenderer key={block.id} block={block} />
      ))}

      {/* Hero banner */}
      {heroBanner && (
        <section
          className="relative w-full overflow-hidden"
          style={{
            backgroundColor: heroBanner.bgColor ?? 'var(--store-surface)',
            minHeight: '400px',
          }}
        >
          {heroBanner.imageUrl && (
            <Image
              src={heroBanner.imageUrl}
              alt={heroBanner.title ?? 'Banner'}
              fill
              className="object-cover"
              priority
            />
          )}
          <div
            className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32"
            style={{ color: heroBanner.textColor ?? 'var(--store-text)' }}
          >
            {heroBanner.title && (
              <h1 className="text-4xl md:text-6xl font-bold mb-4 max-w-2xl">
                {heroBanner.title}
              </h1>
            )}
            {heroBanner.text && (
              <p className="text-lg md:text-xl mb-8 max-w-xl opacity-90">
                {heroBanner.text}
              </p>
            )}
            {heroBanner.ctaLabel && heroBanner.ctaUrl && (
              <Link
                href={heroBanner.ctaUrl}
                className="inline-flex items-center px-8 py-3 text-base font-semibold rounded-lg transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: heroBanner.textColor
                    ? 'rgba(255,255,255,0.15)'
                    : 'var(--store-primary)',
                  color: heroBanner.textColor ?? '#ffffff',
                  border: '2px solid currentColor',
                }}
              >
                {heroBanner.ctaLabel}
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Home middle blocks */}
        {homeMiddleBlocks.map((block) => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}

        {/* Featured products */}
        {featuredProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--store-text)' }}>
                Featured Products
              </h2>
              <Link
                href={`/${params.slug}/products`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                View all →
              </Link>
            </div>
            <ProductGrid
              products={featuredProducts}
              theme={theme}
              config={config}
              promotions={promotions}
              slug={params.slug}
            />
          </section>
        )}

        {/* Categories section */}
        {categories.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--store-text)' }}>
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={`/${params.slug}/categories/${category.slug}`}
                  className="group relative overflow-hidden rounded-xl aspect-square bg-gray-100 flex items-end p-4 transition-shadow hover:shadow-lg"
                >
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="relative z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 w-full">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {category.name}
                    </p>
                    {category.productCount !== undefined && (
                      <p className="text-xs text-gray-500">{category.productCount} products</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Home bottom blocks */}
        {homeBottomBlocks.map((block) => (
          <ContentBlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// CONTENT BLOCK RENDERER
// ============================================================

function ContentBlockRenderer({ block }: { block: ContentBlock }) {
  if (block.type === 'html_safe') {
    // Content is sanitized server-side before saving
    return (
      <div
        className="content-block w-full"
        dangerouslySetInnerHTML={{ __html: String(block.content) }}
      />
    )
  }

  if (block.type === 'text') {
    return (
      <div className="content-block max-w-3xl mx-auto py-8 px-4 text-center">
        <p className="text-gray-700 leading-relaxed">{String(block.content)}</p>
      </div>
    )
  }

  if (block.type === 'spacer') {
    const height =
      typeof block.content === 'object' &&
      block.content !== null &&
      'height' in block.content
        ? (block.content as { height: number }).height
        : 40
    return <div style={{ height: `${height}px` }} />
  }

  if (block.type === 'image') {
    const content = block.content as { url?: string; alt?: string; link?: string }
    if (!content?.url) return null
    const img = (
      <div className="relative w-full" style={{ aspectRatio: '16/6' }}>
        <Image
          src={content.url}
          alt={content.alt ?? ''}
          fill
          className="object-cover"
        />
      </div>
    )
    if (content.link) {
      return <Link href={content.link}>{img}</Link>
    }
    return img
  }

  return null
}
