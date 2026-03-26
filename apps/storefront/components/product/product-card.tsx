'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Eye } from 'lucide-react'
import type { ProductSummary, StoreThemeData, StoreConfigData } from '@store-builder/types'
import { useCart } from '@/lib/cart-context'
import {
  formatPrice,
  getCardClasses,
  getCardHoverClasses,
  getImageAspectRatioClass,
  getProductBadge,
} from '@/lib/theme-utils'

// ============================================================
// HELPERS
// ============================================================

export function getCardVariantClasses(style: string, effect: string): string {
  const card = getCardClasses(style)
  const hover = getCardHoverClasses(effect)
  return `${card} ${hover}`
}

// ============================================================
// COMPONENT
// ============================================================

interface ProductCardProps {
  product: ProductSummary
  slug: string
  theme: StoreThemeData | null
  config: Pick<StoreConfigData, 'currencySymbol' | 'currencyPosition' | 'currencyDecimals'> | null
  promotions?: Array<{
    productIds?: string[]
    badgeLabel?: string | null
    badgeColor?: string | null
  }>
}

export function ProductCard({ product, slug, theme, config, promotions = [] }: ProductCardProps) {
  const { addItem } = useCart()
  const [addingToCart, setAddingToCart] = useState(false)
  const [added, setAdded] = useState(false)

  const cardStyle = theme?.cardStyle ?? 'standard'
  const hoverEffect = theme?.cardHoverEffect ?? 'zoom'
  const imageRatio = theme?.cardImageRatio ?? '1:1'
  const showBadges = theme?.cardShowBadges ?? true
  const showQuickAdd = theme?.cardShowQuickAdd ?? true
  const pricePosition = theme?.cardPricePosition ?? 'below'
  const priceShowOriginal = theme?.priceShowOriginal ?? true
  const priceShowSavings = theme?.priceShowSavings ?? true
  const priceShowSavingsPct = theme?.priceShowSavingsPct ?? true

  const priceConfig = config ?? {
    currencySymbol: '$',
    currencyPosition: 'before' as const,
    currencyDecimals: 2,
  }

  const badge = showBadges
    ? getProductBadge(product, promotions)
    : null

  const hasSavings = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const savingsAmt = hasSavings ? product.compareAtPrice! - product.basePrice : 0
  const savingsPct = hasSavings
    ? Math.round((savingsAmt / product.compareAtPrice!) * 100)
    : 0

  const inStock =
    product.inventoryCount === undefined ||
    product.inventoryCount === null ||
    product.inventoryCount > 0

  const handleQuickAdd = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (addingToCart || product.hasVariants) return
      setAddingToCart(true)
      try {
        await addItem(product.id, undefined, 1)
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      } finally {
        setAddingToCart(false)
      }
    },
    [addItem, addingToCart, product.id, product.hasVariants],
  )

  const cardBaseClass = getCardClasses(cardStyle)
  const imageHoverClass = getCardHoverClasses(hoverEffect === 'lift' ? 'none' : hoverEffect)

  return (
    <Link
      href={`/${slug}/products/${product.slug}`}
      className={`${cardBaseClass} flex flex-col transition-shadow duration-200 ${
        hoverEffect === 'lift' ? 'hover:shadow-xl hover:-translate-y-1' : ''
      }`}
    >
      {/* Image container */}
      <div className={`relative overflow-hidden ${getImageAspectRatioClass(imageRatio)} bg-gray-50`}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover ${imageHoverClass} transition-transform duration-300`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingCart className="w-8 h-8 text-gray-300" />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white z-10"
            style={{ backgroundColor: badge.color }}
          >
            {badge.label}
          </div>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <span className="text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-300">
              Out of Stock
            </span>
          </div>
        )}

        {/* Overlay price (for overlay card style) */}
        {pricePosition === 'overlay' && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
            <PriceDisplay
              basePrice={product.basePrice}
              compareAtPrice={product.compareAtPrice}
              hasSavings={!!hasSavings}
              savingsAmt={savingsAmt}
              savingsPct={savingsPct}
              priceConfig={priceConfig}
              priceShowOriginal={priceShowOriginal}
              priceShowSavings={priceShowSavings}
              priceShowSavingsPct={priceShowSavingsPct}
              theme={theme}
              inverted
            />
          </div>
        )}

        {/* Quick add button (hover) */}
        {showQuickAdd && inStock && (
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            {product.hasVariants ? (
              <Link
                href={`/${slug}/products/${product.slug}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--store-primary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Eye className="w-3.5 h-3.5" />
                View Options
              </Link>
            ) : (
              <button
                onClick={handleQuickAdd}
                disabled={addingToCart}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: 'var(--store-primary)' }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {added ? 'Added!' : addingToCart ? 'Adding…' : 'Quick Add'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        className={`flex flex-col gap-1.5 ${cardStyle === 'compact' ? 'p-2' : 'p-3'} flex-1`}
      >
        {/* Product name */}
        <p
          className="text-sm font-medium leading-tight line-clamp-2"
          style={{ color: 'var(--store-text)' }}
        >
          {product.name}
        </p>

        {/* Category names */}
        {product.categoryNames.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
            {product.categoryNames[0]}
          </p>
        )}

        {/* Price (below image) */}
        {pricePosition !== 'overlay' && (
          <PriceDisplay
            basePrice={product.basePrice}
            compareAtPrice={product.compareAtPrice}
            hasSavings={!!hasSavings}
            savingsAmt={savingsAmt}
            savingsPct={savingsPct}
            priceConfig={priceConfig}
            priceShowOriginal={priceShowOriginal}
            priceShowSavings={priceShowSavings}
            priceShowSavingsPct={priceShowSavingsPct}
            theme={theme}
          />
        )}
      </div>
    </Link>
  )
}

// ============================================================
// PRICE DISPLAY SUB-COMPONENT
// ============================================================

interface PriceDisplayProps {
  basePrice: number
  compareAtPrice?: number
  hasSavings: boolean
  savingsAmt: number
  savingsPct: number
  priceConfig: { currencySymbol: string; currencyPosition: 'before' | 'after'; currencyDecimals: number }
  priceShowOriginal: boolean
  priceShowSavings: boolean
  priceShowSavingsPct: boolean
  theme: StoreThemeData | null
  inverted?: boolean
}

function PriceDisplay({
  basePrice,
  compareAtPrice,
  hasSavings,
  savingsAmt,
  savingsPct,
  priceConfig,
  priceShowOriginal,
  priceShowSavings,
  priceShowSavingsPct,
  theme,
  inverted = false,
}: PriceDisplayProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-1.5">
      <span
        className="text-sm font-bold"
        style={{ color: inverted ? '#ffffff' : 'var(--store-text)' }}
      >
        {formatPrice(basePrice, priceConfig)}
      </span>
      {hasSavings && priceShowOriginal && compareAtPrice && (
        <span
          className="text-xs line-through"
          style={{ color: inverted ? 'rgba(255,255,255,0.6)' : (theme?.priceColorOriginal ?? 'var(--store-price-original)') }}
        >
          {formatPrice(compareAtPrice, priceConfig)}
        </span>
      )}
      {hasSavings && priceShowSavings && (
        <span
          className="text-xs font-semibold"
          style={{ color: inverted ? '#fbbf24' : (theme?.priceColorDiscount ?? 'var(--store-price-discount)') }}
        >
          {priceShowSavingsPct ? `-${savingsPct}%` : `-${formatPrice(savingsAmt, priceConfig)}`}
        </span>
      )}
    </div>
  )
}
