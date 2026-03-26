import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { sendEmail } from '@/lib/email'
import { z } from 'zod'

const updateOrderSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('UPDATE_STATUS'),
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'ON_HOLD']),
    note: z.string().optional(),
  }),
  z.object({
    action: z.literal('UPDATE_PAYMENT'),
    paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
  }),
  z.object({
    action: z.literal('ADD_NOTE'),
    note: z.string().min(1),
  }),
])

// Map order status to email template type
const STATUS_EMAIL_MAP: Partial<Record<string, string>> = {
  CONFIRMED: 'ORDER_CONFIRMED',
  PROCESSING: 'ORDER_PROCESSING',
  SHIPPED: 'ORDER_SHIPPED',
  DELIVERED: 'ORDER_DELIVERED',
  CANCELLED: 'ORDER_CANCELLED',
}

const PAYMENT_EMAIL_MAP: Partial<Record<string, string>> = {
  PAID: 'PAYMENT_RECEIVED',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string; orderId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, storeId: params.storeId },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: 'desc' } },
      paymentMethod: { select: { id: true, name: true, type: true } },
      coupon: { select: { id: true, code: true } },
    },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  return NextResponse.json({ data: order })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { storeId: string; orderId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const order = await prisma.order.findFirst({
    where: { id: params.orderId, storeId: params.storeId },
    include: { items: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 })
  }

  const data = parsed.data

  if (data.action === 'UPDATE_STATUS') {
    const updated = await prisma.order.update({
      where: { id: params.orderId },
      data: { status: data.status },
    })

    // Create timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: params.orderId,
        status: `Status updated to ${data.status}`,
        note: data.note,
        isInternal: false,
        createdBy: session.user.email,
      },
    })

    // Send email notification if applicable
    const templateType = STATUS_EMAIL_MAP[data.status]
    if (templateType) {
      const customerEmail = order.guestEmail
      if (customerEmail) {
        const template = await prisma.emailTemplate.findUnique({
          where: { storeId_type: { storeId: params.storeId, type: templateType } },
        })
        if (template?.isActive) {
          const store = await prisma.store.findUnique({ where: { id: params.storeId }, select: { name: true } })
          await sendEmail({
            to: customerEmail,
            subject: template.subject.replace('{{order.number}}', order.orderNumber),
            html: template.htmlContent
              .replace(/\{\{order\.number\}\}/g, order.orderNumber)
              .replace(/\{\{order\.status\}\}/g, data.status)
              .replace(/\{\{customer\.firstName\}\}/g, order.guestFirstName ?? 'Customer')
              .replace(/\{\{store\.name\}\}/g, store?.name ?? 'Store'),
            storeId: params.storeId,
          })
        }
      }
    }

    return NextResponse.json({ data: updated })
  }

  if (data.action === 'UPDATE_PAYMENT') {
    const updated = await prisma.order.update({
      where: { id: params.orderId },
      data: { paymentStatus: data.paymentStatus },
    })

    await prisma.orderTimeline.create({
      data: {
        orderId: params.orderId,
        status: `Payment status updated to ${data.paymentStatus}`,
        isInternal: true,
        createdBy: session.user.email,
      },
    })

    // Send payment received email
    const templateType = PAYMENT_EMAIL_MAP[data.paymentStatus]
    if (templateType) {
      const customerEmail = order.guestEmail
      if (customerEmail) {
        const template = await prisma.emailTemplate.findUnique({
          where: { storeId_type: { storeId: params.storeId, type: templateType } },
        })
        if (template?.isActive) {
          await sendEmail({
            to: customerEmail,
            subject: template.subject.replace('{{order.number}}', order.orderNumber),
            html: template.htmlContent
              .replace(/\{\{order\.number\}\}/g, order.orderNumber)
              .replace(/\{\{customer\.firstName\}\}/g, order.guestFirstName ?? 'Customer'),
            storeId: params.storeId,
          })
        }
      }
    }

    return NextResponse.json({ data: updated })
  }

  if (data.action === 'ADD_NOTE') {
    // Append to internal notes
    const existingNotes = order.internalNotes ?? ''
    const timestamp = new Date().toISOString()
    const newNote = `[${timestamp}] ${session.user.email}: ${data.note}`
    const updatedNotes = existingNotes ? `${existingNotes}\n\n${newNote}` : newNote

    const updated = await prisma.order.update({
      where: { id: params.orderId },
      data: { internalNotes: updatedNotes },
    })

    await prisma.orderTimeline.create({
      data: {
        orderId: params.orderId,
        status: 'Internal Note Added',
        note: data.note,
        isInternal: true,
        createdBy: session.user.email,
      },
    })

    return NextResponse.json({ data: updated })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
