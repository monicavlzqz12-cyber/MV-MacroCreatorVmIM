'use client'

import { usePathname } from 'next/navigation'
import { getInitials } from '@/lib/utils'

interface AdminTopBarProps {
  user: {
    name?: string
    email: string
    role: string
  }
}

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/stores') return 'Stores'
  if (pathname.match(/^\/stores\/[^/]+\/config/)) return 'Store Configuration'
  if (pathname.match(/^\/stores\/[^/]+\/theme/)) return 'Theme'
  if (pathname.match(/^\/stores\/[^/]+\/cart/)) return 'Cart Configuration'
  if (pathname.match(/^\/stores\/[^/]+\/catalog\/products\/new/)) return 'New Product'
  if (pathname.match(/^\/stores\/[^/]+\/catalog\/products\/[^/]+/)) return 'Edit Product'
  if (pathname.match(/^\/stores\/[^/]+\/catalog\/products/)) return 'Products'
  if (pathname.match(/^\/stores\/[^/]+\/catalog\/categories/)) return 'Categories'
  if (pathname.match(/^\/stores\/[^/]+\/orders\/[^/]+/)) return 'Order Detail'
  if (pathname.match(/^\/stores\/[^/]+\/orders/)) return 'Orders'
  if (pathname.match(/^\/stores\/[^/]+\/promotions/)) return 'Promotions'
  if (pathname.match(/^\/stores\/[^/]+\/payments/)) return 'Payment Methods'
  if (pathname.match(/^\/stores\/[^/]+\/emails/)) return 'Email Templates'
  if (pathname.match(/^\/stores\/new/)) return 'New Store'
  if (pathname.match(/^\/stores\/[^/]+/)) return 'Store Overview'
  return 'Admin'
}

export default function AdminTopBar({ user }: AdminTopBarProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const displayName = user.name ?? user.email
  const initials = getInitials(displayName)

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shrink-0">
          {initials}
        </div>
      </div>
    </header>
  )
}
