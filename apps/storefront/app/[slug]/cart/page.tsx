'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { CartItemRow } from '@/components/cart/cart-item-row'
import { CartTotalsDisplay } from '@/components/cart/cart-totals'

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>()
  const { items, totals, isLoading, cartConfig } = useCart()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="h-32 bg-gray-100 rounded" />
          <div className="h-32 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>
          {cartConfig?.emptyTitle ?? 'Your cart is empty'}
        </h1>
        <p className="text-gray-500 mb-8">
          {cartConfig?.emptyMessage ?? 'Looks like you haven\'t added anything yet.'}
        </p>
        <Link
          href={`/${slug}/products`}
          className="inline-flex items-center px-6 py-3 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--store-primary)' }}
        >
          {cartConfig?.continueShoppingText ?? 'Continue Shopping'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--store-text)' }}>
        {cartConfig?.cartTitle ?? 'Your Cart'} ({totals.itemCount})
      </h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Cart items */}
        <div className="space-y-0 divide-y" style={{ borderColor: 'var(--store-border)' }}>
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              cartConfig={cartConfig}
            />
          ))}
        </div>

        {/* Totals + checkout */}
        <div>
          <div
            className="sticky top-24 rounded-xl border p-6"
            style={{
              borderColor: 'var(--store-border)',
              backgroundColor: 'var(--store-surface)',
            }}
          >
            <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--store-text)' }}>
              {cartConfig?.orderSummaryTitle ?? 'Order Summary'}
            </h2>

            <CartTotalsDisplay cartConfig={cartConfig} />

            <Link
              href={`/${slug}/checkout`}
              className="w-full flex items-center justify-center mt-6 px-6 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              {cartConfig?.checkoutButtonText ?? 'Proceed to Checkout'}
            </Link>

            <Link
              href={`/${slug}/products`}
              className="w-full flex items-center justify-center mt-3 text-sm font-medium hover:underline"
              style={{ color: 'var(--store-primary)' }}
            >
              {cartConfig?.continueShoppingText ?? 'Continue Shopping'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
