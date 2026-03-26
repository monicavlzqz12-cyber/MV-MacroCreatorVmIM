'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search, ShoppingCart } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import type { StoreConfigData, StoreThemeData } from '@store-builder/types'
import type { CategorySummary } from '@/lib/store-data'

interface StoreHeaderProps {
  store: {
    id: string
    name: string
    slug: string
  }
  config: StoreConfigData | null
  theme: StoreThemeData | null
  categories: CategorySummary[]
}

export function StoreHeader({ store, config, theme, categories }: StoreHeaderProps) {
  const { totals, openCart, cartConfig } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const headerStyle = theme?.headerStyle ?? 'standard'
  const headerSticky = theme?.headerSticky ?? true
  const headerShowSearch = theme?.headerShowSearch ?? true
  const headerShowCart = theme?.headerShowCart ?? true
  const headerLogoMaxHeight = theme?.headerLogoMaxHeight ?? 48

  const isCentered = headerStyle === 'centered'
  const isMinimal = headerStyle === 'minimal'

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/${store.slug}/products?search=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const handleCartClick = () => {
    if (cartConfig?.mode === 'PAGE') {
      window.location.href = `/${store.slug}/cart`
    } else {
      openCart()
    }
  }

  const navCategories = categories.filter((c) => !c.parentId).slice(0, 6)

  const logoEl = config?.logoUrl ? (
    <Image
      src={config.logoUrl}
      alt={store.name}
      height={headerLogoMaxHeight}
      width={headerLogoMaxHeight * 3}
      style={{ maxHeight: headerLogoMaxHeight, width: 'auto', objectFit: 'contain' }}
      priority
    />
  ) : (
    <span
      className="font-bold text-xl tracking-tight"
      style={{ color: 'var(--store-primary)' }}
    >
      {store.name}
    </span>
  )

  return (
    <header
      className={`w-full z-30 border-b ${headerSticky ? 'sticky top-0' : 'relative'}`}
      style={{
        backgroundColor: 'var(--store-bg)',
        borderColor: 'var(--store-border)',
      }}
    >
      {/* Search overlay */}
      {isSearchOpen && (
        <div className="absolute inset-0 z-50 flex items-center" style={{ backgroundColor: 'var(--store-bg)' }}>
          <form onSubmit={handleSearch} className="flex-1 flex items-center px-4 sm:px-6 gap-3">
            <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--store-text-muted)' }} />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              className="flex-1 text-base outline-none bg-transparent"
              style={{ color: 'var(--store-text)' }}
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Close search"
            >
              <X className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
            </button>
          </form>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isCentered ? (
          /* Centered header layout */
          <div>
            {/* Top row: Logo */}
            <div className="flex items-center justify-center py-4 border-b" style={{ borderColor: 'var(--store-border)' }}>
              <Link href={`/${store.slug}`}>{logoEl}</Link>
            </div>
            {/* Bottom row: nav + actions */}
            <div className="flex items-center justify-between h-12">
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href={`/${store.slug}/products`}
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--store-text)' }}
                >
                  All Products
                </Link>
                {navCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${store.slug}/categories/${cat.slug}`}
                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--store-text)' }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2 ml-auto">
                <HeaderActions
                  showSearch={headerShowSearch}
                  showCart={headerShowCart}
                  itemCount={totals.itemCount}
                  onSearchClick={() => setIsSearchOpen(true)}
                  onCartClick={handleCartClick}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Standard / minimal header layout */
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
              )}
            </button>

            {/* Logo */}
            <Link href={`/${store.slug}`} className="flex-shrink-0">
              {logoEl}
            </Link>

            {/* Desktop nav */}
            {!isMinimal && (
              <nav className="hidden md:flex items-center gap-6 flex-1 ml-8">
                <Link
                  href={`/${store.slug}/products`}
                  className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--store-text)' }}
                >
                  All Products
                </Link>
                {navCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${store.slug}/categories/${cat.slug}`}
                    className="text-sm font-medium hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--store-text)' }}
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 ml-auto">
              <HeaderActions
                showSearch={headerShowSearch}
                showCart={headerShowCart}
                itemCount={totals.itemCount}
                onSearchClick={() => setIsSearchOpen(true)}
                onCartClick={handleCartClick}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: 'var(--store-border)', backgroundColor: 'var(--store-bg)' }}
        >
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            <MobileNavLink
              href={`/${store.slug}/products`}
              onClick={() => setIsMenuOpen(false)}
            >
              All Products
            </MobileNavLink>
            {navCategories.map((cat) => (
              <MobileNavLink
                key={cat.id}
                href={`/${store.slug}/categories/${cat.slug}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {cat.name}
              </MobileNavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

function HeaderActions({
  showSearch,
  showCart,
  itemCount,
  onSearchClick,
  onCartClick,
}: {
  showSearch: boolean
  showCart: boolean
  itemCount: number
  onSearchClick: () => void
  onCartClick: () => void
}) {
  return (
    <>
      {showSearch && (
        <button
          onClick={onSearchClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
        </button>
      )}

      {showCart && (
        <button
          onClick={onCartClick}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={`Cart (${itemCount} items)`}
        >
          <ShoppingCart className="w-5 h-5" style={{ color: 'var(--store-text)' }} />
          {itemCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
              style={{ backgroundColor: 'var(--store-primary)' }}
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      )}
    </>
  )
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      style={{ color: 'var(--store-text)' }}
    >
      {children}
    </Link>
  )
}
