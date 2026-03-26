import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { z } from 'zod'

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  move: z.enum(['up', 'down']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; categoryId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({
    where: { id: params.categoryId, storeId: params.storeId },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  return NextResponse.json({ data: category })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string; categoryId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({
    where: { id: params.categoryId, storeId: params.storeId },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateCategorySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { move, ...updateData } = parsed.data

  // Handle up/down move
  if (move) {
    const siblings = await prisma.category.findMany({
      where: { storeId: params.storeId, parentId: category.parentId },
      orderBy: { sortOrder: 'asc' },
    })
    const idx = siblings.findIndex((s) => s.id === params.categoryId)
    const swapIdx = move === 'up' ? idx - 1 : idx + 1
    if (swapIdx >= 0 && swapIdx < siblings.length) {
      const swapWith = siblings[swapIdx]
      if (swapWith) {
        await prisma.$transaction([
          prisma.category.update({ where: { id: params.categoryId }, data: { sortOrder: swapWith.sortOrder } }),
          prisma.category.update({ where: { id: swapWith.id }, data: { sortOrder: category.sortOrder } }),
        ])
      }
    }
    const updated = await prisma.category.findUnique({ where: { id: params.categoryId } })
    return NextResponse.json({ data: updated })
  }

  const updated = await prisma.category.update({
    where: { id: params.categoryId },
    data: updateData,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { storeId: string; categoryId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const category = await prisma.category.findFirst({
    where: { id: params.categoryId, storeId: params.storeId },
  })
  if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 })

  // Prevent deletion if it has children
  const children = await prisma.category.count({
    where: { parentId: params.categoryId },
  })
  if (children > 0) {
    return NextResponse.json({ error: 'Cannot delete a category that has sub-categories. Remove or reassign them first.' }, { status: 409 })
  }

  await prisma.category.delete({ where: { id: params.categoryId } })
  return NextResponse.json({ success: true })
}
