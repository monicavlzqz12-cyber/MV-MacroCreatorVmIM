import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'

const DEFAULT_TEMPLATES: Record<string, { name: string; subject: string; htmlContent: string }> = {
  ORDER_CONFIRMED: {
    name: 'Order Confirmed',
    subject: 'Your order #{{order.number}} has been confirmed!',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>Thank you for your order! We've received your order and it's being processed.</p>
<p><strong>Order Number:</strong> {{order.number}}</p>
<p><strong>Total:</strong> {{order.total}}</p>
<p>We'll notify you once your order is shipped.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
  PAYMENT_RECEIVED: {
    name: 'Payment Received',
    subject: 'Payment received for order #{{order.number}}',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>We've received your payment for order #{{order.number}}.</p>
<p>Your order is now being processed.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
  ORDER_PROCESSING: {
    name: 'Order Processing',
    subject: 'Your order #{{order.number}} is being processed',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>Your order #{{order.number}} is now being processed and prepared for shipment.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
  ORDER_SHIPPED: {
    name: 'Order Shipped',
    subject: 'Your order #{{order.number}} has been shipped!',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>Great news! Your order #{{order.number}} has been shipped.</p>
<p>You should receive it within the estimated delivery timeframe.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
  ORDER_DELIVERED: {
    name: 'Order Delivered',
    subject: 'Your order #{{order.number}} has been delivered',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>Your order #{{order.number}} has been marked as delivered.</p>
<p>We hope you enjoy your purchase! If you have any questions, please don't hesitate to contact us.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
  ORDER_CANCELLED: {
    name: 'Order Cancelled',
    subject: 'Your order #{{order.number}} has been cancelled',
    htmlContent: `<p>Hi {{customer.firstName}},</p>
<p>We're sorry to inform you that your order #{{order.number}} has been cancelled.</p>
<p>If you have any questions, please contact us at {{store.contactEmail}}.</p>
<p>Thanks,<br>{{store.name}}</p>`,
  },
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  // Fetch existing templates
  const existing = await prisma.emailTemplate.findMany({
    where: { storeId: params.storeId },
  })

  const existingTypes = new Set(existing.map((t) => t.type))

  // Create defaults for missing templates
  const toCreate = Object.entries(DEFAULT_TEMPLATES).filter(([type]) => !existingTypes.has(type))
  if (toCreate.length > 0) {
    await prisma.emailTemplate.createMany({
      data: toCreate.map(([type, tpl]) => ({
        storeId: params.storeId,
        type,
        name: tpl.name,
        subject: tpl.subject,
        htmlContent: tpl.htmlContent,
        isActive: false, // Start inactive until user configures
      })),
      skipDuplicates: true,
    })
  }

  const templates = await prisma.emailTemplate.findMany({
    where: { storeId: params.storeId },
    orderBy: { type: 'asc' },
  })

  return NextResponse.json({ data: templates })
}
