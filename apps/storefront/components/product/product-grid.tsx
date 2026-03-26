import type { ProductSummary, StoreThemeData, StoreConfigData } from '@store-builder/types'
import { ProductCard } from './product-card'
import { getGridColsClass } from '@/lib/theme-utils'

interface ProductGridProps {
  products: ProductSummary[]
  theme: StoreThemeData | null
  config: StoreConfigData | null
  promotions?: Array<{
    id: string
    productIds?: string[]
    badgeLabel?: string | null
    badgeColor?: string | null
  }>
  slug: string
}

export function ProductGrid({ products, theme, config, promotions = [], slug }: ProductGridProps) {
  const columns = theme?.listingColumns ?? 3
  const gridCols = getGridColsClass(columns)

  if (products.length === 0) return null

  return (
    <div className={`grid ${gridCols} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          slug={slug}
          theme={theme}
          config={config}
          promotions={promotions}
        />
      ))}
    </div>
  )
}
