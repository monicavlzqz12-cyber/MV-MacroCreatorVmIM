import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import crypto from 'crypto'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'])

function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_EXT.has(ext) ? ext : '.bin'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Failed to parse form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File exceeds 5 MB limit' }, { status: 413 })
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 415 })
  }

  const ext = safeExt(file.name)
  if (ext === '.bin') {
    return NextResponse.json({ error: 'File extension not allowed' }, { status: 415 })
  }

  // Store uploads under /public/uploads/<storeId>/
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', params.storeId)
  await mkdir(uploadDir, { recursive: true })

  // Random filename to avoid path traversal / collisions
  const randomName = crypto.randomBytes(16).toString('hex') + ext
  const filePath = path.join(uploadDir, randomName)

  const arrayBuffer = await file.arrayBuffer()
  await writeFile(filePath, Buffer.from(arrayBuffer))

  // Public URL (relative to Next.js public dir)
  const url = `/uploads/${params.storeId}/${randomName}`

  return NextResponse.json({ url }, { status: 201 })
}
