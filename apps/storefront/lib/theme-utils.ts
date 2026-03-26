import type { StoreConfigData, StoreThemeData, ProductSummary } from '@store-builder/types'

// ============================================================
// CSS VARIABLE BUILDER
// ============================================================

export function buildThemeCssVars(
  config: StoreConfigData,
  theme: StoreThemeData,
): Record<string, string> {
  return {
    '--store-primary': config.primaryColor,
    '--store-secondary': config.secondaryColor,
    '--store-accent': config.accentColor,
    '--store-bg': config.backgroundColor,
    '--store-surface': config.surfaceColor,
    '--store-text': '#111827',
    '--store-text-muted': '#6B7280',
    '--store-border': '#E5E7EB',
    '--store-price-discount': theme.priceColorDiscount,
    '--store-price-original': theme.priceColorOriginal,
    '--store-font-heading': `'${config.fontHeading}', sans-serif`,
    '--store-font-body': `'${config.fontBody}', sans-serif`,
    '--store-radius': getBorderRadiusValue(config.borderRadius),
  }
}

export function cssVarsToString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ')
}

// ============================================================
// BORDER RADIUS
// ============================================================

const RADIUS_MAP: Record<string, string> = {
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  full: '9999px',
}

function getBorderRadiusValue(radius: string): string {
  return RADIUS_MAP[radius] ?? '0.375rem'
}

export function getBorderRadiusClass(radius: string): string {
  const map: Record<string, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }
  return map[radius] ?? 'rounded-md'
}

// ============================================================
// BUTTON CLASSES
// ============================================================

export function getButtonClasses(
  style: string,
  radius: string,
  size: 'sm' | 'md' | 'lg' = 'md',
): string {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size]

  const radiusClass = getBorderRadiusClass(radius)

  const styleClasses = (() => {
    switch (style) {
      case 'filled':
        return 'bg-[var(--store-primary)] text-white hover:opacity-90 focus:ring-[var(--store-primary)]'
      case 'outlined':
        return 'border border-[var(--store-primary)] text-[var(--store-primary)] bg-transparent hover:bg-[var(--store-primary)] hover:text-white focus:ring-[var(--store-primary)]'
      case 'ghost':
        return 'text-[var(--store-primary)] bg-transparent hover:bg-[var(--store-primary)]/10 focus:ring-[var(--store-primary)]'
      case 'soft':
        return 'bg-[var(--store-primary)]/10 text-[var(--store-primary)] hover:bg-[var(--store-primary)]/20 focus:ring-[var(--store-primary)]'
      default:
        return 'bg-[var(--store-primary)] text-white hover:opacity-90 focus:ring-[var(--store-primary)]'
    }
  })()

  return [baseClasses, sizeClasses, radiusClass, styleClasses].join(' ')
}

// ============================================================
// CARD CLASSES
// ============================================================

export function getCardClasses(cardStyle: string): string {
  const base = 'group relative overflow-hidden bg-white'

  switch (cardStyle) {
    case 'standard':
      return `${base} rounded-lg border border-gray-100 shadow-sm`
    case 'compact':
      return `${base} rounded-md border border-gray-200`
    case 'minimal':
      return `${base} rounded-none border-b border-gray-100`
    case 'bold':
      return `${base} rounded-xl border-2 border-gray-900 shadow-md`
    case 'overlay':
      return `${base} rounded-lg overflow-hidden`
    default:
      return `${base} rounded-lg border border-gray-100 shadow-sm`
  }
}

export function getCardHoverClasses(effect: string): string {
  switch (effect) {
    case 'zoom':
      return 'transition-transform duration-300 group-hover:scale-105'
    case 'fade':
      return 'transition-opacity duration-300 group-hover:opacity-80'
    case 'lift':
      return 'transition-shadow duration-300 group-hover:shadow-lg'
    case 'none':
    default:
      return ''
  }
}

// ============================================================
// IMAGE ASPECT RATIO
// ============================================================

export function getImageAspectRatioClass(ratio: string): string {
  const map: Record<string, string> = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-4/3',
    '3:4': 'aspect-3/4',
    '16:9': 'aspect-video',
  }
  return map[ratio] ?? 'aspect-square'
}

// ============================================================
// PRICE FORMATTING
// ============================================================

export function formatPrice(
  amount: number,
  config: Pick<StoreConfigData, 'currencySymbol' | 'currencyPosition' | 'currencyDecimals'>,
): string {
  const formatted = amount.toFixed(config.currencyDecimals)
  if (config.currencyPosition === 'before') {
    return `${config.currencySymbol}${formatted}`
  }
  return `${formatted}${config.currencySymbol}`
}

// ============================================================
// PRODUCT BADGE
// ============================================================

export function getProductBadge(
  product: Pick<ProductSummary, 'id' | 'badgeLabel' | 'compareAtPrice' | 'basePrice' | 'status'>,
  promotions: Array<{
    productIds?: string[]
    badgeLabel?: string | null
    badgeColor?: string | null
  }>,
): { label: string; color: string } | null {
  // 1. Explicit product badge takes priority
  if (product.badgeLabel) {
    return {
      label: product.badgeLabel,
      color: '#111827',
    }
  }

  // 2. Promotion badge
  if (promotions.length > 0) {
    const promo = promotions.find((p) => {
      if (!p.productIds || p.productIds.length === 0) return true
      return p.productIds.includes(product.id)
    })
    if (promo?.badgeLabel) {
      return {
        label: promo.badgeLabel,
        color: promo.badgeColor ?? '#DC2626',
      }
    }
  }

  // 3. Auto sale badge if compareAtPrice set
  if (product.compareAtPrice && product.compareAtPrice > product.basePrice) {
    const pct = Math.round(
      ((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100,
    )
    return {
      label: `−${pct}%`,
      color: '#DC2626',
    }
  }

  return null
}

// ============================================================
// LISTING GRID COLUMNS
// ============================================================

export function getGridColsClass(columns: number): string {
  const map: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  }
  return map[columns] ?? 'grid-cols-2 md:grid-cols-3'
}
