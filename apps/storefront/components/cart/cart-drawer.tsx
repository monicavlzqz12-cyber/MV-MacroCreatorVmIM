'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { X, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CartItemRow } from './cart-item-row'
import { CartTotalsDisplay } from './cart-totals'

export function CartDrawer() {
  const { isOpen, closeCart, items, totals, isLoading, cartConfig, slug } = useCart()

  const drawerRef = useRef<HTMLDivElement>(null)
  const position = cartConfig?.position ?? 'right'
  const size = cartConfig?.size ?? 'md'
  const showOverlay = cartConfig?.triggerConfig?.showOverlay ?? true
  const animationStyle = cartConfig?.triggerConfig?.animationStyle ?? 'slide'

  const widthClass = {
    sm: 'w-80',
    md: 'w-96',
    lg: 'w-[448px]',
  }[size] ?? 'w-96'

  // Close on outside click
  useEffect(() => {
    if (!isOpen || !cartConfig?.triggerConfig?.closeOnOutsideClick) return
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeCart()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, closeCart, cartConfig])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, closeCart])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const transformOpen = position === 'right' ? 'translate-x-0' : 'translate-x-0'
  const transformClosed = position === 'right' ? 'translate-x-full' : '-translate-x-full'

  const cartTitle = cartConfig?.cartTitle ?? 'Your Cart'
  const emptyTitle = cartConfig?.emptyTitle ?? 'Your cart is empty'
  const emptyMessage = cartConfig?.emptyMessage ?? "You haven't added anything yet."
  const checkoutText = cartConfig?.checkoutButtonText ?? 'Checkout'
  const continueText = cartConfig?.continueShoppingText ?? 'Continue Shopping'

  const checkoutHref = cartConfig?.mode === 'PAGE'
    ? `/${slug}/cart`
    : `/${slug}/checkout`

  return (
    <>
      {/* Overlay */}
      {showOverlay && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden="true"
          onClick={closeCart}
        />
      )}

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={cartTitle}
        className={`
          fixed top-0 bottom-0 z-50 flex flex-col
          ${position === 'right' ? 'right-0' : 'left-0'}
          ${widthClass}
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? transformOpen : transformClosed}
          max-w-[100vw]
        `}
        style={{
          backgroundColor: cartConfig?.styleTokens?.backgroundColor ?? 'var(--store-bg)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--store-border)',
            backgroundColor: cartConfig?.styleTokens?.headerBg ?? 'var(--store-surface)',
          }}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: 'var(--store-primary)' }} />
            <h2
              className="font-bold"
              style={{
                color: 'var(--store-text)',
                fontSize: cartConfig?.styleTokens?.titleFontSize ?? '1.0625rem',
              }}
            >
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
            aria-label="Close cart"
          >
            <X className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-5">
          {isLoading ? (
            <div className="py-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--store-text)' }}>
                {emptyTitle}
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--store-text-muted)' }}>
                {emptyMessage}
              </p>
              <button
                onClick={closeCart}
                className="text-sm font-medium hover:underline"
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

        {/* Footer — only show when items exist */}
        {items.length > 0 && (
          <div
            className="flex-shrink-0 border-t px-5 py-5 space-y-4"
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
                borderRadius: cartConfig?.styleTokens?.checkoutButtonRadius ?? undefined,
                fontWeight: cartConfig?.styleTokens?.checkoutButtonFontWeight ?? '600',
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
    </>
  )
}
