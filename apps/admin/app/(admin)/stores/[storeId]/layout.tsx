import { notFound } from 'next/navigation'
import { prisma } from '@store-builder/database'
import Link from 'next/link'
import { storeStatusColor } from '@/lib/utils'

interface StoreLayoutProps {
  children: React.ReactNode
  params: { storeId: string }
}

const storeNavItems = (storeId: string) => [
  { href: `/stores/${storeId}`, label: 'Overview' },
  { href: `/stores/${storeId}/config`, label: 'Config' },
  { href: `/stores/${storeId}/theme`, label: 'Theme' },
  { href: `/stores/${storeId}/cart`, label: 'Cart' },
  { href: `/stores/${storeId}/catalog/products`, label: 'Products' },
  { href: `/stores/${storeId}/catalog/categories`, label: 'Categories' },
  { href: `/stores/${storeId}/catalog/collections`, label: 'Collections' },
  { href: `/stores/${storeId}/customers`, label: 'Customers' },
  { href: `/stores/${storeId}/orders`, label: 'Orders' },
  { href: `/stores/${storeId}/promotions`, label: 'Promotions' },
  { href: `/stores/${storeId}/payments`, label: 'Payments' },
  { href: `/stores/${storeId}/emails`, label: 'Emails' },
]

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
    select: { id: true, name: true, status: true, slug: true, domain: true },
  })

  if (!store) notFound()

  const navItems = storeNavItems(store.id)

  return (
    <div className="space-y-4">
      {/* Store Sub-header */}
      <div className="bg-white rounded-xl border border-border shadow-sm px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/stores" className="text-sm text-muted-foreground hover:text-foreground">
              Stores
            </Link>
            <span className="text-muted-foreground">/</span>
            <h2 className="font-semibold text-foreground">{store.name}</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${storeStatusColor(store.status)}`}
            >
              {store.status}
            </span>
          </div>
          {(store.domain || store.slug) && (
            <a
              href={store.domain ? `https://${store.domain}` : `#`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              {store.domain ?? store.slug}
            </a>
          )}
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mt-4 flex-wrap">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {children}
    </div>
  )
}
