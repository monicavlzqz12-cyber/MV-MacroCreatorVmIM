import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().default(true),
})

interface CategoryWithChildren {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  isActive: boolean
  children: CategoryWithChildren[]
}

function buildTree(
  categories: Array<{ id: string; name: string; slug: string; parentId: string | null; sortOrder: number; isActive: boolean }>,
): CategoryWithChildren[] {
  const map = new Map<string, CategoryWithChildren>()
  const roots: CategoryWithChildren[] = []

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] })
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort each level by sortOrder
  const sort = (nodes: CategoryWithChildren[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)

  return roots
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const categories = await prisma.category.findMany({
    where: { storeId: params.storeId },
    orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      sortOrder: true,
      isActive: true,
    },
  })

  const tree = buildTree(categories)
  return NextResponse.json({ data: tree })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  // Check slug uniqueness within store
  const existing = await prisma.category.findFirst({
    where: { storeId: params.storeId, slug: parsed.data.slug },
  })
  if (existing) return NextResponse.json({ error: 'Slug already exists in this store.' }, { status: 409 })

  // Auto-assign sortOrder
  let sortOrder = parsed.data.sortOrder
  if (sortOrder === undefined) {
    const maxOrder = await prisma.category.aggregate({
      where: { storeId: params.storeId, parentId: parsed.data.parentId ?? null },
      _max: { sortOrder: true },
    })
    sortOrder = (maxOrder._max.sortOrder ?? -1) + 1
  }

  const category = await prisma.category.create({
    data: {
      ...parsed.data,
      storeId: params.storeId,
      sortOrder,
    },
  })

  return NextResponse.json({ data: category }, { status: 201 })
}
