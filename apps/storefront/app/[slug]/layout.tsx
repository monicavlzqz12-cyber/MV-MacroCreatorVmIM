import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getStoreBySlug } from '@/lib/store-data'
import { buildThemeCssVars, cssVarsToString } from '@/lib/theme-utils'
import { CartProvider } from '@/components/cart/cart-provider'
import { StoreHeader } from '@/components/layout/store-header'
import { StoreFooter } from '@/components/layout/store-footer'
import { getStoreCategories } from '@/lib/store-data'

interface StoreLayoutProps {
  children: React.ReactNode
  params: { slug: string }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const store = await getStoreBySlug(params.slug)
  if (!store) return { title: 'Store Not Found' }

  const config = store.config
  return {
    title: config?.metaTitle ?? store.name,
    description: config?.metaDescription ?? undefined,
    keywords: config?.metaKeywords ?? undefined,
    openGraph: {
      title: config?.metaTitle ?? store.name,
      description: config?.metaDescription ?? undefined,
      images: config?.ogImageUrl ? [{ url: config.ogImageUrl }] : undefined,
    },
    icons: config?.faviconUrl ? { icon: config.faviconUrl } : undefined,
  }
}

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const store = await getStoreBySlug(params.slug)

  if (!store) {
    notFound()
  }

  const { config, theme, cartConfig } = store

  // Build per-store CSS variables
  const cssVars =
    config && theme
      ? cssVarsToString(buildThemeCssVars(config, theme))
      : ''

  // Load categories for the header nav
  const categories = await getStoreCategories(store.id)

  return (
    <>
      {/* Inject store theme CSS variables */}
      {cssVars && (
        <style
          dangerouslySetInnerHTML={{
            __html: `:root { ${cssVars} }`,
          }}
        />
      )}

      {/* Inject store custom CSS (sanitized server-side before persisting) */}
      {theme?.customCss && (
        <style
          dangerouslySetInnerHTML={{
            __html: theme.customCss,
          }}
        />
      )}

      <CartProvider cartConfig={cartConfig} slug={params.slug}>
        <div
          className="min-h-screen flex flex-col"
          style={{ backgroundColor: 'var(--store-bg)', color: 'var(--store-text)' }}
        >
          <StoreHeader
            store={{
              id: store.id,
              name: store.name,
              slug: store.slug,
            }}
            config={config}
            theme={theme}
            categories={categories}
          />

          <main className="flex-1">{children}</main>

          <StoreFooter store={store} config={config} theme={theme} />
        </div>
      </CartProvider>
    </>
  )
}
