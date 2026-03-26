import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@store-builder/database'
import { sendEmail } from '@/lib/email'

export async function POST(
  _request: NextRequest,
  { params }: { params: { storeId: string } },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } })
  if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

  const result = await sendEmail({
    to: session.user.email,
    subject: `Test Email from ${store.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2>SMTP Test Email</h2>
        <p>This is a test email sent from Store Builder Admin.</p>
        <p><strong>Store:</strong> ${store.name}</p>
        <p><strong>Sent to:</strong> ${session.user.email}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p style="color: #6B7280; font-size: 14px;">If you received this email, your SMTP configuration is working correctly.</p>
      </div>
    `,
    text: `SMTP Test Email\n\nThis is a test from Store Builder Admin.\nStore: ${store.name}\nIf you received this, SMTP is working.`,
    storeId: params.storeId,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ success: true, messageId: result.messageId })
}
