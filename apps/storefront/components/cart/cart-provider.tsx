'use client'

import type { CartConfigData } from '@store-builder/types'
import { CartContextProvider, useCart } from '@/lib/cart-context'
import { CartDrawer } from './cart-drawer'
import { CartModal } from './cart-modal'

interface CartProviderProps {
  children: React.ReactNode
  cartConfig: CartConfigData | null
  slug: string
}

function CartOverlayRenderer() {
  const { cartConfig } = useCart()

  if (!cartConfig) return null

  const mode = cartConfig.mode

  if (mode === 'DRAWER' || mode === 'FLOATING' || mode === 'SIDEBAR') {
    return <CartDrawer />
  }

  if (mode === 'MODAL') {
    return <CartModal />
  }

  // PAGE mode: no overlay, user navigates to /[slug]/cart
  return null
}

export function CartProvider({ children, cartConfig, slug }: CartProviderProps) {
  return (
    <CartContextProvider cartConfig={cartConfig} slug={slug}>
      {children}
      <CartOverlayRenderer />
    </CartContextProvider>
  )
}
