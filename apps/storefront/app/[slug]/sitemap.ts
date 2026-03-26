import type { MetadataRoute } from 'next'
import { prisma } from '@store-builder/database'

interface Props {
  params: { slug: string }
}

export default async function sitemap({ params }: Props): Promise<MetadataRoute.Sitemap> {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    include: {
      config: { select: { canonicalUrl: true } },
    },
  })

  if (!store || store.status !== 'ACTIVE') return []

  // Determine base URL for this store
  const base = store.config?.canonicalUrl?.replace(/\/$/, '') ?? `http://localhost:3001`
  const storeBase = `${base}/${store.slug}`
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { url: storeBase, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${storeBase}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${storeBase}/collections`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ]

  // Products
  const products = await prisma.product.findMany({
    where: { storeId: store.id, status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })
  for (const p of products) {
    entries.push({
      url: `${storeBase}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  }

  // Categories
  const categories = await prisma.category.findMany({
    where: { storeId: store.id, isActive: true },
    select: { slug: true, updatedAt: true },
  })
  for (const c of categories) {
    entries.push({
      url: `${storeBase}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  // Collections
  const collections = await prisma.collection.findMany({
    where: { storeId: store.id, isActive: true },
    select: { slug: true, updatedAt: true },
  })
  for (const col of collections) {
    entries.push({
      url: `${storeBase}/collections/${col.slug}`,
      lastModified: col.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  }

  return entries
}
