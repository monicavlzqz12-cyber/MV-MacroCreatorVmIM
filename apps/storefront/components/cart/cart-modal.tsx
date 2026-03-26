'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CartItemRow } from './cart-item-row'
import { CartTotalsDisplay } from './cart-totals'

export function CartModal() {
  const { isOpen, closeCart, items, totals, isLoading, cartConfig, slug } = useCart()
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const cartTitle = cartConfig?.cartTitle ?? 'Your Cart'
  const emptyTitle = cartConfig?.emptyTitle ?? 'Your cart is empty'
  const emptyMessage = cartConfig?.emptyMessage ?? "You haven't added anything yet."
  const checkoutText = cartConfig?.checkoutButtonText ?? 'Checkout'
  const continueText = cartConfig?.continueShoppingText ?? 'Continue Shopping'

  const checkoutHref = cartConfig?.mode === 'PAGE'
    ? `/${slug}/cart`
    : `/${slug}/checkout`

  // Close on overlay click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        overlayRef.current &&
        overlayRef.current === e.target &&
        (cartConfig?.triggerConfig?.closeOnOutsideClick ?? true)
      ) {
        closeCart()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, closeCart, cartConfig])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, closeCart])

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      aria-modal="true"
      role="dialog"
      aria-label={cartTitle}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: cartConfig?.styleTokens?.backgroundColor ?? 'var(--store-bg)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--store-border)',
            backgroundColor: cartConfig?.styleTokens?.headerBg ?? 'var(--store-surface)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: 'var(--store-primary)' }} />
            <h2 className="font-bold text-lg" style={{ color: 'var(--store-text)' }}>
              {cartTitle}
            </h2>
            {cartConfig?.showItemCount && totals.itemCount > 0 && (
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--store-primary)' }}
              >
                {totals.itemCount}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6">
          {isLoading ? (
            <div className="py-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
              <p className="font-semibold" style={{ color: 'var(--store-text)' }}>{emptyTitle}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--store-text-muted)' }}>{emptyMessage}</p>
              <button
                onClick={closeCart}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                {continueText}
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--store-border)' }}>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} cartConfig={cartConfig} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div
            className="border-t px-6 py-5 space-y-4 flex-shrink-0"
            style={{ borderColor: 'var(--store-border)' }}
          >
            <CartTotalsDisplay cartConfig={cartConfig} />

            <Link
              href={checkoutHref}
              onClick={closeCart}
              className="w-full flex items-center justify-center py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{
                backgroundColor: cartConfig?.styleTokens?.checkoutButtonBg ?? 'var(--store-primary)',
                color: cartConfig?.styleTokens?.checkoutButtonColor ?? '#ffffff',
              }}
            >
              {checkoutText}
            </Link>

            <button
              onClick={closeCart}
              className="w-full text-sm font-medium hover:underline text-center"
              style={{ color: 'var(--store-primary)' }}
            >
              {continueText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
