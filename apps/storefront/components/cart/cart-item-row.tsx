'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import type { CartItemDisplay, CartConfigData } from '@store-builder/types'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/theme-utils'

interface CartItemRowProps {
  item: CartItemDisplay
  cartConfig: CartConfigData | null
}

export function CartItemRow({ item, cartConfig }: CartItemRowProps) {
  const { updateItem, removeItem, cartConfig: ctxConfig } = useCart()
  const cfg = cartConfig ?? ctxConfig
  const [isPending, setIsPending] = useState(false)

  const quantityStyle = cfg?.styleTokens?.quantityStyle ?? 'stepper'
  const showImages = cfg?.showImages ?? true
  const showVariantOptions = cfg?.showVariantOptions ?? true
  const showRemove = cfg?.showRemove ?? true

  // For price formatting we use basic defaults when config not available
  const priceConfig = { currencySymbol: '$', currencyPosition: 'before' as const, currencyDecimals: 2 }

  const handleQuantityChange = async (newQty: number) => {
    if (isPending) return
    setIsPending(true)
    try {
      await updateItem(item.id, newQty)
    } finally {
      setIsPending(false)
    }
  }

  const handleRemove = async () => {
    if (isPending) return
    setIsPending(true)
    try {
      await removeItem(item.id)
    } finally {
      setIsPending(false)
    }
  }

  const hasSavings = item.compareAtPrice && item.compareAtPrice > item.price
  const savings = hasSavings ? (item.compareAtPrice! - item.price) * item.quantity : 0

  return (
    <div
      className={`flex gap-3 py-4 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
      style={cfg?.styleTokens?.itemBg ? { backgroundColor: cfg.styleTokens.itemBg } : {}}
    >
      {/* Image */}
      {showImages && item.imageUrl && (
        <div
          className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border bg-gray-50"
          style={{
            borderColor: 'var(--store-border)',
            borderRadius: cfg?.styleTokens?.itemImageRadius ?? undefined,
          }}
        >
          <Image
            src={item.imageUrl}
            alt={item.productName}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-medium leading-tight truncate"
              style={{ color: 'var(--store-text)' }}
            >
              {item.productName}
            </p>
            {showVariantOptions && item.variantName && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--store-text-muted)' }}>
                {item.variantName}
              </p>
            )}
            {showVariantOptions && item.optionValues && item.optionValues.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--store-text-muted)' }}>
                {item.optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(' · ')}
              </p>
            )}
            {!item.inStock && (
              <p className="text-xs text-red-500 mt-0.5 font-medium">Out of stock</p>
            )}
          </div>

          {/* Remove button (compact) */}
          {showRemove && (
            <button
              onClick={() => void handleRemove()}
              className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
              aria-label="Remove item"
            >
              <X className="w-4 h-4" style={{ color: 'var(--store-text-muted)' }} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity control */}
          {quantityStyle === 'stepper' && (
            <div
              className="flex items-center border rounded-lg overflow-hidden"
              style={{ borderColor: 'var(--store-border)' }}
            >
              <button
                onClick={() => void handleQuantityChange(item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-2 py-1 hover:bg-gray-50 transition-colors disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" style={{ color: 'var(--store-text)' }} />
              </button>
              <span
                className="px-3 py-1 text-sm font-medium border-x"
                style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => void handleQuantityChange(item.quantity + 1)}
                className="px-2 py-1 hover:bg-gray-50 transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" style={{ color: 'var(--store-text)' }} />
              </button>
            </div>
          )}

          {quantityStyle === 'input' && (
            <input
              type="number"
              value={item.quantity}
              min={1}
              max={999}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v >= 1) void handleQuantityChange(v)
              }}
              className="w-16 text-center border rounded-lg px-2 py-1 text-sm"
              style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
            />
          )}

          {quantityStyle === 'select' && (
            <select
              value={item.quantity}
              onChange={(e) => void handleQuantityChange(parseInt(e.target.value, 10))}
              className="border rounded-lg px-2 py-1 text-sm bg-white"
              style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}

          {/* Price */}
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: 'var(--store-text)' }}>
              {formatPrice(item.totalPrice, priceConfig)}
            </p>
            {hasSavings && (
              <p className="text-xs" style={{ color: 'var(--store-price-discount)' }}>
                −{formatPrice(savings, priceConfig)}
              </p>
            )}
          </div>
        </div>

        {/* Remove as text link */}
        {showRemove && (
          <button
            onClick={() => void handleRemove()}
            className="text-xs mt-1 hover:underline"
            style={{ color: 'var(--store-text-muted)' }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  )
}
