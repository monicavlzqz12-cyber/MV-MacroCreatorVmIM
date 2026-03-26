import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreBySlug, getProductBySlug, getStoreProducts, getActivePromotions } from '@/lib/store-data'
import { ProductImageGallery } from '@/components/product/product-image-gallery'
import { VariantSelector } from '@/components/product/variant-selector'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { ProductGrid } from '@/components/product/product-grid'
import { formatPrice } from '@/lib/theme-utils'

interface ProductPageProps {
  params: { slug: string; productSlug: string }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)
  if (!store) return { title: 'Product Not Found' }
  const product = await getProductBySlug(store.id, params.productSlug)
  if (!product) return { title: 'Product Not Found' }

  const title = product.metaTitle ?? `${product.name} — ${store.name}`
  const description = product.metaDescription ?? product.shortDescription ?? undefined
  const ogImage = product.imageUrl
    ? [{ url: product.imageUrl, alt: product.name, width: 1200, height: 630 }]
    : undefined
  const canonicalBase = store.config?.canonicalUrl ?? undefined
  const canonical = canonicalBase
    ? `${canonicalBase.replace(/\/$/, '')}/${store.slug}/products/${product.slug}`
    : undefined

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: store.name,
      images: ogImage,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const product = await getProductBySlug(store.id, params.productSlug)
  if (!product) notFound()

  const { theme, config } = store

  // Related products
  let relatedProducts: Awaited<ReturnType<typeof getStoreProducts>>['products'] = []
  const promotions = await getActivePromotions(store.id)

  if (theme?.pdpShowRelated && product.relatedProductIds.length > 0) {
    const { products } = await getStoreProducts(store.id, {
      pageSize: theme.pdpRelatedCount ?? 4,
    })
    relatedProducts = products.filter(
      (p) => product.relatedProductIds.includes(p.id) && p.id !== product.id,
    )
  } else if (theme?.pdpShowRelated) {
    // Fallback: fetch recent products excluding current
    const { products } = await getStoreProducts(store.id, {
      pageSize: (theme.pdpRelatedCount ?? 4) + 1,
      sortBy: 'newest',
    })
    relatedProducts = products.filter((p) => p.id !== product.id).slice(0, theme.pdpRelatedCount ?? 4)
  }

  const defaultVariant = product.variants.find((v) => v.isDefault) ?? product.variants[0]
  const basePrice = defaultVariant?.price ?? product.basePrice
  const compareAtPrice = defaultVariant?.compareAtPrice ?? product.compareAtPrice

  const hasSavings = compareAtPrice && compareAtPrice > basePrice
  const savingsAmount = hasSavings ? compareAtPrice! - basePrice : 0
  const savingsPct = hasSavings
    ? Math.round((savingsAmount / compareAtPrice!) * 100)
    : 0

  const showStock = theme?.pdpShowStock ?? true
  const showSku = theme?.pdpShowSku ?? true
  const inStock =
    !product.trackInventory ||
    product.allowBackorder ||
    (product.inventoryCount !== undefined && product.inventoryCount !== null && product.inventoryCount > 0)
  const isLowStock =
    product.trackInventory &&
    product.lowStockThreshold !== undefined &&
    product.inventoryCount !== undefined &&
    product.inventoryCount !== null &&
    product.inventoryCount > 0 &&
    product.inventoryCount <= product.lowStockThreshold

  const priceConfig = config ?? {
    currencySymbol: '$',
    currencyPosition: 'before' as const,
    currencyDecimals: 2,
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? product.shortDescription ?? undefined,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: config?.currency ?? 'USD',
      price: basePrice.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: store.name },
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className={`grid gap-8 lg:gap-16 ${
          theme?.pdpLayout === 'wide' ? 'lg:grid-cols-[55%_1fr]' : 'lg:grid-cols-2'
        }`}
      >
        {/* Image gallery */}
        <ProductImageGallery
          images={product.images}
          productName={product.name}
          layout={theme?.pdpImageLayout ?? 'gallery'}
        />

        {/* Product info */}
        <div className="flex flex-col gap-6">
          {/* Breadcrumb */}
          {product.categoryNames.length > 0 && (
            <nav className="text-sm text-gray-500">
              <span>{product.categoryNames[0]}</span>
            </nav>
          )}

          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--store-text)' }}>
              {product.name}
            </h1>
            {showSku && product.sku && (
              <p className="text-sm mt-1" style={{ color: 'var(--store-text-muted)' }}>
                SKU: {product.sku}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-bold" style={{ color: 'var(--store-text)' }}>
              {formatPrice(basePrice, priceConfig)}
            </span>
            {hasSavings && (theme?.priceShowOriginal ?? true) && (
              <span
                className="text-lg line-through"
                style={{ color: 'var(--store-price-original)' }}
              >
                {formatPrice(compareAtPrice!, priceConfig)}
              </span>
            )}
            {hasSavings && (theme?.priceShowSavings ?? true) && (
              <span
                className="text-sm font-semibold px-2 py-0.5 rounded"
                style={{
                  color: 'var(--store-price-discount)',
                  backgroundColor: 'color-mix(in srgb, var(--store-price-discount) 10%, transparent)',
                }}
              >
                Save {theme?.priceShowSavingsPct ? `${savingsPct}%` : formatPrice(savingsAmount, priceConfig)}
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-base leading-relaxed" style={{ color: 'var(--store-text-muted)' }}>
              {product.shortDescription}
            </p>
          )}

          {/* Stock status */}
          {showStock && (
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: inStock ? '#16a34a' : '#dc2626' }}
              />
              <span className="text-sm font-medium" style={{ color: inStock ? '#16a34a' : '#dc2626' }}>
                {!inStock
                  ? 'Out of Stock'
                  : isLowStock
                    ? `Low Stock — only ${product.inventoryCount} left`
                    : 'In Stock'}
              </span>
            </div>
          )}

          {/* Variant selector (client) */}
          {product.hasVariants && product.optionGroups.length > 0 && (
            <VariantSelector
              optionGroups={product.optionGroups}
              variants={product.variants}
              config={config}
            />
          )}

          {/* Add to cart (client) */}
          <AddToCartButton
            productId={product.id}
            defaultVariantId={defaultVariant?.id}
            hasVariants={product.hasVariants}
            inventoryCount={product.inventoryCount ?? undefined}
            trackInventory={product.trackInventory}
            allowBackorder={product.allowBackorder}
            theme={theme}
          />

          {/* Attributes */}
          {product.attributes.length > 0 && (
            <div className="border-t pt-6" style={{ borderColor: 'var(--store-border)' }}>
              <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--store-text)' }}>
                Product Details
              </h3>
              <dl className="space-y-2">
                {product.attributes.map((attr, i) => (
                  <div key={i} className="flex gap-4 text-sm">
                    <dt className="font-medium w-32 flex-shrink-0" style={{ color: 'var(--store-text-muted)' }}>
                      {attr.name}
                    </dt>
                    <dd style={{ color: 'var(--store-text)' }}>{attr.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Full description */}
      {product.description && (
        <div className="mt-16 border-t pt-10" style={{ borderColor: 'var(--store-border)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--store-text)' }}>
            Description
          </h2>
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16 border-t pt-10" style={{ borderColor: 'var(--store-border)' }}>
          <h2 className="text-xl font-bold mb-8" style={{ color: 'var(--store-text)' }}>
            You Might Also Like
          </h2>
          <ProductGrid
            products={relatedProducts}
            theme={theme}
            config={config}
            promotions={promotions}
            slug={params.slug}
          />
        </div>
      )}
    </div>
  )
}
