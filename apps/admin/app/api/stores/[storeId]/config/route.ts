import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const addressSchema = z.object({
  street: z.string().optional(),
  street2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
}).optional().nullable()

const socialLinksSchema = z.object({
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  tiktok: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
}).optional().nullable()

const checkoutConfigSchema = z.object({
  guestCheckout: z.boolean().optional(),
  requirePhone: z.boolean().optional(),
  requireCompany: z.boolean().optional(),
  requireAddress: z.boolean().optional(),
  termsUrl: z.string().optional().nullable(),
  privacyUrl: z.string().optional().nullable(),
  confirmationMessage: z.string().optional().nullable(),
  successRedirectUrl: z.string().optional().nullable(),
}).optional().nullable()

const smtpSchema = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean(),
  user: z.string(),
  password: z.string(),
  fromName: z.string().optional(),
  fromAddress: z.string().optional(),
}).optional()

const updateConfigSchema = z.object({
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  coverImageUrl: z.string().optional().nullable(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  surfaceColor: z.string().optional(),
  fontHeading: z.string().optional(),
  fontBody: z.string().optional(),
  borderRadius: z.enum(['sm', 'md', 'lg', 'xl', 'full']).optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  currencyPosition: z.enum(['before', 'after']).optional(),
  currencyDecimals: z.number().int().min(0).max(4).optional(),
  language: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  weightUnit: z.enum(['kg', 'lb', 'g', 'oz']).optional(),
  dimensionUnit: z.enum(['cm', 'in']).optional(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  address: addressSchema,
  socialLinks: socialLinksSchema,
  checkoutConfig: checkoutConfigSchema,
  emailFromName: z.string().optional().nullable(),
  emailFromAddress: z.string().email().optional().nullable(),
  emailReplyTo: z.string().email().optional().nullable(),
  smtp: smtpSchema,
  googleAnalyticsId: z.string().optional().nullable(),
  metaPixelId: z.string().optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const config = await prisma.storeConfig.findUnique({ where: { storeId: params.storeId } })

  // Mask SMTP credentials — don't expose encrypted value to frontend
  if (config) {
    const { smtpConfigEncrypted: _smtp, ...safeConfig } = config
    return NextResponse.json({ data: { ...safeConfig, hasSmtpConfig: !!_smtp } })
  }

  return NextResponse.json({ data: null })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateConfigSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const { smtp, ...configData } = parsed.data

  let smtpConfigEncrypted: string | undefined = undefined
  if (smtp?.host && smtp.user && smtp.password) {
    try {
      smtpConfigEncrypted = encrypt(JSON.stringify(smtp))
    } catch {
      return NextResponse.json({ error: 'Encryption failed. Check ENCRYPTION_KEY environment variable.' }, { status: 500 })
    }
  }

  const updateData: Record<string, unknown> = { ...configData }
  if (smtpConfigEncrypted !== undefined) {
    updateData.smtpConfigEncrypted = smtpConfigEncrypted
  }

  const config = await prisma.storeConfig.upsert({
    where: { storeId: params.storeId },
    create: {
      storeId: params.storeId,
      ...updateData,
      primaryColor: (configData.primaryColor as string) ?? '#111827',
      secondaryColor: (configData.secondaryColor as string) ?? '#6B7280',
      accentColor: (configData.accentColor as string) ?? '#2563EB',
      backgroundColor: (configData.backgroundColor as string) ?? '#FFFFFF',
      surfaceColor: (configData.surfaceColor as string) ?? '#F9FAFB',
      fontHeading: (configData.fontHeading as string) ?? 'Inter',
      fontBody: (configData.fontBody as string) ?? 'Inter',
      borderRadius: (configData.borderRadius as string) ?? 'md',
      currency: (configData.currency as string) ?? 'USD',
      currencySymbol: (configData.currencySymbol as string) ?? '$',
      currencyPosition: (configData.currencyPosition as string) ?? 'before',
      currencyDecimals: (configData.currencyDecimals as number) ?? 2,
      language: (configData.language as string) ?? 'en',
      country: (configData.country as string) ?? 'US',
      timezone: (configData.timezone as string) ?? 'UTC',
      weightUnit: (configData.weightUnit as string) ?? 'kg',
      dimensionUnit: (configData.dimensionUnit as string) ?? 'cm',
    },
    update: updateData,
  })

  const { smtpConfigEncrypted: _smtp, ...safeConfig } = config
  return NextResponse.json({ data: safeConfig })
}
