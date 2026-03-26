'use client'

import { useState } from 'react'
import { Tag, X, ChevronRight } from 'lucide-react'
import type { CartConfigData } from '@store-builder/types'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/theme-utils'

interface CartTotalsDisplayProps {
  cartConfig: CartConfigData | null
  onCheckout?: () => void
}

export function CartTotalsDisplay({ cartConfig: propConfig, onCheckout }: CartTotalsDisplayProps) {
  const { totals, couponCode, appliedPromotions, applyCoupon, removeCoupon, cartConfig: ctxConfig } = useCart()
  const cfg = propConfig ?? ctxConfig

  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const priceConfig = { currencySymbol: '$', currencyPosition: 'before' as const, currencyDecimals: 2 }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    setCouponError(null)
    const result = await applyCoupon(couponInput.trim().toUpperCase())
    setCouponLoading(false)
    if (!result.success) {
      setCouponError(result.error ?? 'Invalid coupon')
    } else {
      setCouponInput('')
    }
  }

  const handleRemoveCoupon = async () => {
    await removeCoupon()
    setCouponError(null)
  }

  const showSavings = cfg?.showSavings ?? true
  const showShipping = cfg?.showShipping ?? false
  const showTaxes = cfg?.showTaxes ?? false
  const showPromoCode = cfg?.showPromoCode ?? true
  const showProgress = cfg?.showProgress ?? false
  const freeShippingThreshold = cfg?.freeShippingThreshold

  const progressPct =
    showProgress && freeShippingThreshold && freeShippingThreshold > 0
      ? Math.min(100, (totals.subtotal / freeShippingThreshold) * 100)
      : 0
  const amountToFreeShipping =
    freeShippingThreshold ? Math.max(0, freeShippingThreshold - totals.subtotal) : 0

  return (
    <div className="space-y-3">
      {/* Free shipping progress */}
      {showProgress && freeShippingThreshold && (
        <div className="space-y-1.5">
          {amountToFreeShipping > 0 ? (
            <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
              Add{' '}
              <span className="font-semibold" style={{ color: 'var(--store-text)' }}>
                {formatPrice(amountToFreeShipping, priceConfig)}
              </span>{' '}
              more for free shipping
            </p>
          ) : (
            <p className="text-xs font-semibold text-green-600">You qualify for free shipping!</p>
          )}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct >= 100 ? '#16a34a' : 'var(--store-primary)',
              }}
            />
          </div>
        </div>
      )}

      {/* Coupon input */}
      {showPromoCode && !couponCode && (
        <div className="space-y-1">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--store-text-muted)' }} />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleApplyCoupon()
                }}
                placeholder="Coupon code"
                className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{
                  borderColor: couponError ? '#DC2626' : 'var(--store-border)',
                  color: 'var(--store-text)',
                  '--tw-ring-color': 'var(--store-primary)',
                } as React.CSSProperties}
              />
            </div>
            <button
              onClick={() => void handleApplyCoupon()}
              disabled={couponLoading || !couponInput.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--store-primary)', color: '#ffffff' }}
            >
              {couponLoading ? '…' : 'Apply'}
            </button>
          </div>
          {couponError && (
            <p className="text-xs text-red-500">{couponError}</p>
          )}
        </div>
      )}

      {/* Applied coupon badge */}
      {couponCode && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg border"
          style={{ borderColor: '#16a34a', backgroundColor: '#f0fdf4' }}
        >
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs font-semibold text-green-700 font-mono">{couponCode}</span>
          </div>
          <button
            onClick={() => void handleRemoveCoupon()}
            className="text-green-600 hover:text-green-800"
            aria-label="Remove coupon"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Line items */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--store-text-muted)' }}>Subtotal</span>
          <span style={{ color: 'var(--store-text)' }}>
            {formatPrice(totals.subtotal, priceConfig)}
          </span>
        </div>

        {showSavings && totals.savings > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--store-price-discount)' }}>Savings</span>
            <span style={{ color: 'var(--store-price-discount)' }}>
              −{formatPrice(totals.savings, priceConfig)}
            </span>
          </div>
        )}

        {totals.discountAmount > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--store-price-discount)' }}>
              Discount
              {appliedPromotions.length > 0 && (
                <span className="ml-1 text-xs opacity-75">({appliedPromotions.map((p) => p.name).join(', ')})</span>
              )}
            </span>
            <span style={{ color: 'var(--store-price-discount)' }}>
              −{formatPrice(totals.discountAmount, priceConfig)}
            </span>
          </div>
        )}

        {showShipping && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--store-text-muted)' }}>Shipping</span>
            <span style={{ color: 'var(--store-text)' }}>
              {totals.shippingAmount === 0 ? 'Free' : formatPrice(totals.shippingAmount, priceConfig)}
            </span>
          </div>
        )}

        {showTaxes && totals.taxAmount > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--store-text-muted)' }}>Tax</span>
            <span style={{ color: 'var(--store-text)' }}>{formatPrice(totals.taxAmount, priceConfig)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div
        className="flex justify-between items-center pt-3 border-t font-bold text-base"
        style={{ borderColor: 'var(--store-border)' }}
      >
        <span style={{ color: 'var(--store-text)' }}>Total</span>
        <span style={{ color: 'var(--store-text)' }}>
          {formatPrice(totals.total, priceConfig)}
        </span>
      </div>
    </div>
  )
}
