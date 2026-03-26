import nodemailer from 'nodemailer'
import { prisma } from '@store-builder/database'
import { decrypt } from './encryption'

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  storeId?: string
}

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  fromName: string
  fromAddress: string
}

interface EmailTemplate {
  subject: string
  htmlContent: string
  textContent?: string | null
}

async function getSmtpConfig(storeId?: string): Promise<SmtpConfig | null> {
  // Try store SMTP config first
  if (storeId) {
    const config = await prisma.storeConfig.findUnique({
      where: { storeId },
      select: {
        smtpConfigEncrypted: true,
        emailFromName: true,
        emailFromAddress: true,
      },
    })

    if (config?.smtpConfigEncrypted) {
      try {
        const decrypted = decrypt(config.smtpConfigEncrypted)
        const smtpData = JSON.parse(decrypted) as SmtpConfig
        return {
          ...smtpData,
          fromName: config.emailFromName ?? smtpData.fromName ?? 'Store Builder',
          fromAddress: config.emailFromAddress ?? smtpData.fromAddress,
        }
      } catch {
        // Fall through to global config
      }
    }
  }

  // Fall back to global SMTP env vars
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      fromName: process.env.SMTP_FROM_NAME ?? 'Store Builder',
      fromAddress: process.env.SMTP_FROM_ADDRESS ?? process.env.SMTP_USER,
    }
  }

  return null
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smtpConfig = await getSmtpConfig(options.storeId)

  if (!smtpConfig) {
    const error = 'No SMTP configuration available'
    await logEmail(options, null, 'FAILED', undefined, error)
    return { success: false, error }
  }

  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.password,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    await logEmail(options, smtpConfig.fromAddress, 'SENT', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    await logEmail(options, smtpConfig.fromAddress, 'FAILED', undefined, error)
    return { success: false, error }
  }
}

async function logEmail(
  options: SendEmailOptions,
  from: string | null,
  status: string,
  messageId?: string,
  errorMessage?: string,
) {
  if (!options.storeId) return

  try {
    await prisma.emailLog.create({
      data: {
        storeId: options.storeId,
        to: options.to,
        from: from ?? undefined,
        subject: options.subject,
        type: 'TRANSACTIONAL',
        status,
        messageId,
        errorMessage,
        sentAt: status === 'SENT' ? new Date() : undefined,
      },
    })
  } catch {
    // Non-critical — don't throw
  }
}

const ALLOWED_VARIABLE_PATHS = new Set([
  'order.number',
  'order.total',
  'order.subtotal',
  'order.discountAmount',
  'order.shippingAmount',
  'order.taxAmount',
  'order.currency',
  'order.status',
  'order.paymentStatus',
  'order.createdAt',
  'order.customerNotes',
  'order.couponCode',
  'customer.firstName',
  'customer.lastName',
  'customer.email',
  'customer.phone',
  'store.name',
  'store.domain',
  'store.contactEmail',
  'store.contactPhone',
  'shippingAddress.firstName',
  'shippingAddress.lastName',
  'shippingAddress.street',
  'shippingAddress.city',
  'shippingAddress.state',
  'shippingAddress.zip',
  'shippingAddress.country',
])

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return ''
    current = (current as Record<string, unknown>)[part]
  }
  if (current === null || current === undefined) return ''
  return String(current)
}

export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, unknown>,
): string {
  const flatVars = flattenObject(variables)

  const rendered = template.htmlContent.replace(
    /\{\{([^}]+)\}\}/g,
    (match, path: string) => {
      const trimmedPath = path.trim()
      if (!ALLOWED_VARIABLE_PATHS.has(trimmedPath)) {
        return '' // Remove unknown/disallowed variables
      }
      return getNestedValue(flatVars as Record<string, unknown>, trimmedPath)
    },
  )

  return rendered
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    const value = obj[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = value
    }
  }
  return result
}
