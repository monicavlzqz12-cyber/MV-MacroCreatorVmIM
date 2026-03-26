import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

// ============================================================
// CONSTANTS
// ============================================================

export const CART_COOKIE = 'sb_cart_token'
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a cryptographically random 32-char hex cart token.
 */
export function generateCartToken(): string {
  return randomBytes(16).toString('hex')
}

// ============================================================
// COOKIE ACCESS (Server Components)
// ============================================================

/**
 * Get the cart token from Next.js cookies (for use in Server Components / API routes).
 * Returns undefined if not set.
 */
export function getCartTokenFromCookies(): string | undefined {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(CART_COOKIE)?.value
    return token && token.length === 32 ? token : undefined
  } catch {
    // cookies() throws outside of request context
    return undefined
  }
}

// ============================================================
// SLUG VALIDATION
// ============================================================

/**
 * Validate that a cart token looks like a valid 32-char hex string.
 */
export function isValidCartToken(token: string): boolean {
  return /^[a-f0-9]{32}$/.test(token)
}
