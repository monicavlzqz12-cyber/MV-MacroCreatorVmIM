import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiter (per-process — use Redis in production for multi-instance)
// Map<key, { count: number; windowStart: number }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  checkout: { max: 5, windowMs: 60_000 },   // 5 checkouts/min per IP
  cart:     { max: 60, windowMs: 60_000 },  // 60 cart ops/min per IP
}

// Periodically clear stale entries to prevent unbounded memory growth
let lastCleanup = Date.now()
function maybeCleanup() {
  const now = Date.now()
  if (now - lastCleanup < 300_000) return // clean every 5 min
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    // If the window has been over for 2x its duration, remove it
    const limit = key.startsWith('checkout:') ? LIMITS.checkout : LIMITS.cart
    if (limit && now - entry.windowStart > limit.windowMs * 2) {
      rateLimitMap.delete(key)
    }
  }
}

function checkRateLimit(
  key: string,
  type: 'checkout' | 'cart',
): { allowed: boolean; remaining: number; reset: number } {
  const limit = LIMITS[type]!
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now - entry.windowStart >= limit.windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: limit.max - 1, reset: now + limit.windowMs }
  }

  if (entry.count >= limit.max) {
    return { allowed: false, remaining: 0, reset: entry.windowStart + limit.windowMs }
  }

  entry.count++
  return { allowed: true, remaining: limit.max - entry.count, reset: entry.windowStart + limit.windowMs }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only rate-limit POST requests to checkout and cart mutation endpoints
  if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'DELETE') {
    return NextResponse.next()
  }

  const isCheckout = /^\/api\/[^/]+\/checkout$/.test(pathname)
  const isCart = /^\/api\/[^/]+\/cart(\/[^/]+)?$/.test(pathname)

  if (!isCheckout && !isCart) {
    return NextResponse.next()
  }

  maybeCleanup()

  const ip = getClientIp(request)
  const type = isCheckout ? 'checkout' : 'cart'
  const key = `${type}:${ip}`

  const { allowed, remaining, reset } = checkRateLimit(key, type)

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', String(LIMITS[type]!.max))
  headers.set('X-RateLimit-Remaining', String(remaining))
  headers.set('X-RateLimit-Reset', String(Math.ceil(reset / 1000)))

  if (!allowed) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    headers.set('Retry-After', String(retryAfter))
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429, headers },
    )
  }

  const response = NextResponse.next()
  headers.forEach((value, key) => response.headers.set(key, value))
  return response
}

export const config = {
  matcher: ['/api/:slug/checkout', '/api/:slug/cart', '/api/:slug/cart/:token'],
}
