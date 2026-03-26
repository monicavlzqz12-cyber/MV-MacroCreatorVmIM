'use client'

import { useState, useCallback } from 'react'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import type { StoreThemeData } from '@store-builder/types'
import { useCart } from '@/lib/cart-context'
import { getButtonClasses } from '@/lib/theme-utils'

interface AddToCartButtonProps {
  productId: string
  defaultVariantId?: string
  hasVariants: boolean
  inventoryCount?: number
  trackInventory: boolean
  allowBackorder: boolean
  theme: StoreThemeData | null
  selectedVariantId?: string
}

export function AddToCartButton({
  productId,
  defaultVariantId,
  hasVariants,
  inventoryCount,
  trackInventory,
  allowBackorder,
  theme,
  selectedVariantId,
}: AddToCartButtonProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const buttonStyle = theme?.buttonStyle ?? 'filled'
  const buttonRadius = theme?.buttonRadius ?? 'md'

  const inStock =
    !trackInventory ||
    allowBackorder ||
    (inventoryCount !== undefined && inventoryCount !== null && inventoryCount > 0)

  const maxQty =
    trackInventory && !allowBackorder && inventoryCount !== undefined && inventoryCount !== null
      ? inventoryCount
      : 999

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1))
  }, [])

  const handleIncrement = useCallback(() => {
    setQuantity((q) => Math.min(maxQty, q + 1))
  }, [maxQty])

  const handleAddToCart = useCallback(async () => {
    if (!inStock || isAdding) return

    const variantId = selectedVariantId ?? defaultVariantId

    setIsAdding(true)
    try {
      await addItem(productId, variantId, quantity)
      setIsAdded(true)
      setTimeout(() => setIsAdded(false), 2000)
    } finally {
      setIsAdding(false)
    }
  }, [addItem, inStock, isAdding, productId, quantity, selectedVariantId, defaultVariantId])

  const btnClasses = getButtonClasses(buttonStyle, buttonRadius, 'lg')

  return (
    <div className="flex items-stretch gap-3">
      {/* Quantity stepper */}
      <div
        className="flex items-center border rounded-lg overflow-hidden"
        style={{ borderColor: 'var(--store-border)' }}
      >
        <button
          onClick={handleDecrement}
          disabled={quantity <= 1 || !inStock}
          className="px-3 py-3 hover:bg-gray-50 transition-colors disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" style={{ color: 'var(--store-text)' }} />
        </button>
        <span
          className="px-4 py-3 text-sm font-medium border-x min-w-[3rem] text-center"
          style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
        >
          {quantity}
        </span>
        <button
          onClick={handleIncrement}
          disabled={quantity >= maxQty || !inStock}
          className="px-3 py-3 hover:bg-gray-50 transition-colors disabled:opacity-40"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" style={{ color: 'var(--store-text)' }} />
        </button>
      </div>

      {/* Add to cart button */}
      <button
        onClick={() => void handleAddToCart()}
        disabled={!inStock || isAdding}
        className={`flex-1 ${btnClasses} gap-2`}
        style={
          !inStock
            ? { backgroundColor: '#9CA3AF', cursor: 'not-allowed', color: '#ffffff' }
            : undefined
        }
      >
        {isAdded ? (
          <>
            <Check className="w-5 h-5" />
            Added!
          </>
        ) : isAdding ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Adding…
          </>
        ) : !inStock ? (
          <>
            <ShoppingCart className="w-5 h-5" />
            Out of Stock
          </>
        ) : hasVariants && !selectedVariantId ? (
          <>
            <ShoppingCart className="w-5 h-5" />
            Select Options
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </>
        )}
      </button>
    </div>
  )
}
