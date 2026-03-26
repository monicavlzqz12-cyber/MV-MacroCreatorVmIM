import Link from 'next/link'
import type { StoreConfigData, StoreThemeData, StoreSocialLinks, FooterColumn } from '@store-builder/types'
import type { StoreWithRelations } from '@/lib/store-data'

interface StoreFooterProps {
  store: StoreWithRelations
  config: StoreConfigData | null
  theme: StoreThemeData | null
}

export function StoreFooter({ store, config, theme }: StoreFooterProps) {
  const footerColumns = (theme?.footerColumns ?? []) as FooterColumn[]
  const socialLinks = config?.socialLinks as StoreSocialLinks | undefined
  const currentYear = new Date().getFullYear()

  const hasSocialLinks =
    socialLinks &&
    Object.values(socialLinks).some((v) => v && v.length > 0)

  return (
    <footer
      className="border-t mt-auto"
      style={{
        borderColor: 'var(--store-border)',
        backgroundColor: 'var(--store-surface)',
        color: 'var(--store-text)',
      }}
    >
      {footerColumns.length > 0 ? (
        /* Multi-column footer */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-8">
            {/* Store info column */}
            <div className="col-span-2 md:col-span-1">
              <p
                className="font-bold text-lg mb-2"
                style={{ color: 'var(--store-text)' }}
              >
                {store.name}
              </p>
              {config?.contactEmail && (
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="text-sm hover:underline block"
                  style={{ color: 'var(--store-text-muted)' }}
                >
                  {config.contactEmail}
                </a>
              )}
              {config?.contactPhone && (
                <p className="text-sm mt-1" style={{ color: 'var(--store-text-muted)' }}>
                  {config.contactPhone}
                </p>
              )}
              {hasSocialLinks && (
                <div className="flex gap-3 mt-4">
                  <SocialLinks links={socialLinks!} />
                </div>
              )}
            </div>

            {/* Footer columns */}
            {footerColumns.map((col, idx) => (
              <div key={idx}>
                <p
                  className="font-semibold text-sm mb-3"
                  style={{ color: 'var(--store-text)' }}
                >
                  {col.title}
                </p>
                <nav className="space-y-2">
                  {col.links.map((link, linkIdx) => (
                    <Link
                      key={linkIdx}
                      href={link.url}
                      className="block text-sm hover:underline transition-opacity hover:opacity-70"
                      style={{ color: 'var(--store-text-muted)' }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div
            className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm"
            style={{ borderColor: 'var(--store-border)' }}
          >
            <p style={{ color: 'var(--store-text-muted)' }}>
              &copy; {currentYear} {store.name}. All rights reserved.
            </p>
          </div>
        </div>
      ) : (
        /* Minimal footer */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p
              className="font-semibold"
              style={{ color: 'var(--store-text)' }}
            >
              {store.name}
            </p>

            {hasSocialLinks && (
              <div className="flex gap-3">
                <SocialLinks links={socialLinks!} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: 'var(--store-text-muted)' }}>
              {config?.contactEmail && (
                <a
                  href={`mailto:${config.contactEmail}`}
                  className="hover:underline"
                  style={{ color: 'var(--store-text-muted)' }}
                >
                  {config.contactEmail}
                </a>
              )}
              <span>&copy; {currentYear} {store.name}</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

// ============================================================
// SOCIAL LINKS
// ============================================================

function SocialLinks({ links }: { links: StoreSocialLinks }) {
  const items = [
    { key: 'facebook' as const, label: 'Facebook', href: links.facebook },
    { key: 'instagram' as const, label: 'Instagram', href: links.instagram },
    { key: 'twitter' as const, label: 'Twitter / X', href: links.twitter },
    { key: 'tiktok' as const, label: 'TikTok', href: links.tiktok },
    { key: 'youtube' as const, label: 'YouTube', href: links.youtube },
    { key: 'linkedin' as const, label: 'LinkedIn', href: links.linkedin },
  ].filter((item) => item.href)

  return (
    <>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors hover:opacity-70"
          style={{ borderColor: 'var(--store-border)', color: 'var(--store-text-muted)' }}
        >
          <SocialIcon platform={item.key} />
        </a>
      ))}
    </>
  )
}

function SocialIcon({ platform }: { platform: string }) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
    instagram: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    twitter: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    tiktok: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.14a8.26 8.26 0 004.83 1.55V7.24a4.85 4.85 0 01-1.06-.55z" />
      </svg>
    ),
    youtube: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  }
  return icons[platform] ?? null
}
