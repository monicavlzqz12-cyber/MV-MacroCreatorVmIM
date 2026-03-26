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
// SLUG VALIDATION
// ============================================================

/**
 * Validate that a cart token looks like a valid 32-char hex string.
 */
export function isValidCartToken(token: string): boolean {
  return /^[a-f0-9]{32}$/.test(token)
}
