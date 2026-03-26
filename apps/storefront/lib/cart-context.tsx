'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from 'react'
import type { CartItemDisplay, CartTotals, AppliedPromotion, CartConfigData } from '@store-builder/types'
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from './cart-utils'

// ============================================================
// TYPES
// ============================================================

export interface CartContextValue {
  items: CartItemDisplay[]
  totals: CartTotals
  appliedPromotions: AppliedPromotion[]
  couponCode: string | undefined
  isLoading: boolean
  isOpen: boolean
  cartConfig: CartConfigData | null
  slug: string
  openCart: () => void
  closeCart: () => void
  addItem: (productId: string, variantId: string | undefined, quantity: number) => Promise<void>
  updateItem: (cartItemId: string, quantity: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>
  removeCoupon: () => Promise<void>
  refreshCart: () => Promise<void>
}

// ============================================================
// STATE
// ============================================================

interface CartState {
  items: CartItemDisplay[]
  totals: CartTotals
  appliedPromotions: AppliedPromotion[]
  couponCode: string | undefined
  isLoading: boolean
  isOpen: boolean
  token: string | null
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_OPEN'; payload: boolean }
  | { type: 'SET_CART'; payload: { items: CartItemDisplay[]; totals: CartTotals; appliedPromotions: AppliedPromotion[]; couponCode?: string; token: string } }
  | { type: 'SET_TOKEN'; payload: string }

const DEFAULT_TOTALS: CartTotals = {
  subtotal: 0,
  discountAmount: 0,
  shippingAmount: 0,
  taxAmount: 0,
  total: 0,
  currency: 'USD',
  itemCount: 0,
  savings: 0,
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_OPEN':
      return { ...state, isOpen: action.payload }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items,
        totals: action.payload.totals,
        appliedPromotions: action.payload.appliedPromotions,
        couponCode: action.payload.couponCode,
        token: action.payload.token,
        isLoading: false,
      }
    default:
      return state
  }
}

const initialState: CartState = {
  items: [],
  totals: DEFAULT_TOTALS,
  appliedPromotions: [],
  couponCode: undefined,
  isLoading: true,
  isOpen: false,
  token: null,
}

// ============================================================
// CONTEXT
// ============================================================

const CartContext = createContext<CartContextValue | null>(null)

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}

// ============================================================
// PROVIDER
// ============================================================

const LOCALSTORAGE_TOKEN_KEY = 'sb_cart_token'

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(LOCALSTORAGE_TOKEN_KEY)
  } catch {
    return null
  }
}

function storeToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCALSTORAGE_TOKEN_KEY, token)
    // Also set cookie for SSR access
    document.cookie = `${CART_COOKIE}=${token}; max-age=${CART_COOKIE_MAX_AGE}; path=/; SameSite=Lax`
  } catch {
    // ignore storage errors
  }
}

interface CartProviderProps {
  children: React.ReactNode
  cartConfig: CartConfigData | null
  slug: string
}

export function CartContextProvider({ children, cartConfig, slug }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const initRef = useRef(false)

  // ---- API helpers ----

  const getToken = useCallback((): string | null => {
    return state.token ?? getStoredToken()
  }, [state.token])

  const initializeCart = useCallback(async () => {
    const existingToken = getStoredToken()
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const body = existingToken ? JSON.stringify({ token: existingToken }) : JSON.stringify({})
      const res = await fetch(`/api/${slug}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
      const data = await res.json()
      storeToken(data.token)
      dispatch({
        type: 'SET_CART',
        payload: {
          items: data.items ?? [],
          totals: data.totals ?? DEFAULT_TOTALS,
          appliedPromotions: data.appliedPromotions ?? [],
          couponCode: data.couponCode,
          token: data.token,
        },
      })
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [slug])

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      void initializeCart()
    }
  }, [initializeCart])

  // ---- Refresh ----

  const refreshCart = useCallback(async () => {
    const token = getToken()
    if (!token) return
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const res = await fetch(`/api/${slug}/cart/${token}`)
      if (!res.ok) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }
      const data = await res.json()
      dispatch({
        type: 'SET_CART',
        payload: {
          items: data.items ?? [],
          totals: data.totals ?? DEFAULT_TOTALS,
          appliedPromotions: data.appliedPromotions ?? [],
          couponCode: data.couponCode,
          token: data.token,
        },
      })
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [getToken, slug])

  // ---- Cart mutation helper ----

  const patchCart = useCallback(
    async (body: Record<string, unknown>): Promise<void> => {
      const token = getToken()
      if (!token) {
        await initializeCart()
        return
      }
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const res = await fetch(`/api/${slug}/cart/${token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          console.error('[Cart] PATCH error:', err)
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }
        const data = await res.json()
        dispatch({
          type: 'SET_CART',
          payload: {
            items: data.items ?? [],
            totals: data.totals ?? DEFAULT_TOTALS,
            appliedPromotions: data.appliedPromotions ?? [],
            couponCode: data.couponCode,
            token: data.token,
          },
        })
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },
    [getToken, initializeCart, slug],
  )

  // ---- Actions ----

  const addItem = useCallback(
    async (productId: string, variantId: string | undefined, quantity: number) => {
      await patchCart({ action: 'add', productId, variantId, quantity })
      // Open cart if configured
      const openOnAdd = cartConfig?.triggerConfig?.openOnAdd ?? true
      if (openOnAdd && cartConfig?.mode !== 'PAGE') {
        dispatch({ type: 'SET_OPEN', payload: true })
      }
    },
    [patchCart, cartConfig],
  )

  const updateItem = useCallback(
    async (cartItemId: string, quantity: number) => {
      await patchCart({ action: quantity === 0 ? 'remove' : 'update', cartItemId, quantity })
    },
    [patchCart],
  )

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await patchCart({ action: 'remove', cartItemId })
    },
    [patchCart],
  )

  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      const token = getToken()
      if (!token) return { success: false, error: 'Cart not initialized' }
      dispatch({ type: 'SET_LOADING', payload: true })
      try {
        const res = await fetch(`/api/${slug}/cart/${token}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'apply_coupon', couponCode: code }),
        })
        const data = await res.json()
        if (!res.ok) {
          dispatch({ type: 'SET_LOADING', payload: false })
          return { success: false, error: data.message ?? 'Invalid coupon' }
        }
        dispatch({
          type: 'SET_CART',
          payload: {
            items: data.items ?? [],
            totals: data.totals ?? DEFAULT_TOTALS,
            appliedPromotions: data.appliedPromotions ?? [],
            couponCode: data.couponCode,
            token: data.token,
          },
        })
        return { success: true }
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false })
        return { success: false, error: 'Failed to apply coupon' }
      }
    },
    [getToken, slug],
  )

  const removeCoupon = useCallback(async () => {
    await patchCart({ action: 'remove_coupon' })
  }, [patchCart])

  const openCart = useCallback(() => dispatch({ type: 'SET_OPEN', payload: true }), [])
  const closeCart = useCallback(() => dispatch({ type: 'SET_OPEN', payload: false }), [])

  const value: CartContextValue = {
    items: state.items,
    totals: state.totals,
    appliedPromotions: state.appliedPromotions,
    couponCode: state.couponCode,
    isLoading: state.isLoading,
    isOpen: state.isOpen,
    cartConfig,
    slug,
    openCart,
    closeCart,
    addItem,
    updateItem,
    removeItem,
    applyCoupon,
    removeCoupon,
    refreshCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
