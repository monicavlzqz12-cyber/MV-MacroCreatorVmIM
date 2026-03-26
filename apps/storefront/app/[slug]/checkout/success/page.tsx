import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Package } from 'lucide-react'
import { prisma } from '@store-builder/database'
import { getStoreBySlug } from '@/lib/store-data'
import { formatPrice } from '@/lib/theme-utils'
import type { PaymentBlock } from '@store-builder/types'

interface SuccessPageProps {
  params: { slug: string }
  searchParams: { orderId?: string }
}

function toNumber(val: unknown): number {
  if (typeof val === 'number') return val
  if (typeof val === 'object' && val !== null && 'toNumber' in val) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return parseFloat(String(val)) || 0
}

export default async function OrderSuccessPage({ params, searchParams }: SuccessPageProps) {
  const { orderId } = searchParams

  if (!orderId) notFound()

  const store = await getStoreBySlug(params.slug)
  if (!store) notFound()

  const order = await prisma.order.findFirst({
    where: { id: orderId, storeId: store.id },
    include: {
      items: true,
      paymentMethod: true,
    },
  })

  if (!order) notFound()

  const { config } = store
  const priceConfig = config ?? {
    currencySymbol: '$',
    currencyPosition: 'before' as const,
    currencyDecimals: 2,
  }

  const customerName = order.customerId
    ? undefined
    : `${order.guestFirstName ?? ''} ${order.guestLastName ?? ''}`.trim()

  const templateBlocks = order.paymentMethod?.templateBlocks as PaymentBlock[] | null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Success header */}
      <div className="text-center mb-10">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'color-mix(in srgb, #16a34a 10%, transparent)' }}
        >
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--store-text)' }}>
          Thank you for your order!
        </h1>
        {customerName && (
          <p className="text-lg" style={{ color: 'var(--store-text-muted)' }}>
            Hi {customerName}! Your order has been received.
          </p>
        )}
      </div>

      {/* Order details card */}
      <div
        className="rounded-xl border p-6 mb-6"
        style={{ borderColor: 'var(--store-border)', backgroundColor: 'var(--store-surface)' }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Package className="w-5 h-5" style={{ color: 'var(--store-primary)' }} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--store-text-muted)' }}>
              Order Number
            </p>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--store-text)' }}>
              {order.orderNumber}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {order.items.map((item) => {
            const optionValues = item.optionValues as Array<{ name: string; value: string }> | null
            return (
              <div key={item.id} className="flex items-center gap-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.productName}
                    className="w-14 h-14 object-cover rounded-lg border flex-shrink-0"
                    style={{ borderColor: 'var(--store-border)' }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--store-text)' }}>
                    {item.productName}
                  </p>
                  {item.variantName && (
                    <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
                      {item.variantName}
                    </p>
                  )}
                  {optionValues && optionValues.length > 0 && (
                    <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
                      {optionValues.map((ov) => `${ov.name}: ${ov.value}`).join(', ')}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
                    Qty: {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--store-text)' }}>
                  {formatPrice(toNumber(item.totalPrice), priceConfig)}
                </p>
              </div>
            )
          })}
        </div>

        {/* Totals */}
        <div
          className="border-t pt-4 space-y-1.5 text-sm"
          style={{ borderColor: 'var(--store-border)' }}
        >
          <div className="flex justify-between">
            <span style={{ color: 'var(--store-text-muted)' }}>Subtotal</span>
            <span style={{ color: 'var(--store-text)' }}>{formatPrice(toNumber(order.subtotal), priceConfig)}</span>
          </div>
          {toNumber(order.discountAmount) > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--store-text-muted)' }}>Discount</span>
              <span style={{ color: '#DC2626' }}>−{formatPrice(toNumber(order.discountAmount), priceConfig)}</span>
            </div>
          )}
          {toNumber(order.shippingAmount) > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--store-text-muted)' }}>Shipping</span>
              <span style={{ color: 'var(--store-text)' }}>{formatPrice(toNumber(order.shippingAmount), priceConfig)}</span>
            </div>
          )}
          {toNumber(order.taxAmount) > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--store-text-muted)' }}>Tax</span>
              <span style={{ color: 'var(--store-text)' }}>{formatPrice(toNumber(order.taxAmount), priceConfig)}</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold text-base pt-2 border-t"
            style={{ borderColor: 'var(--store-border)' }}
          >
            <span style={{ color: 'var(--store-text)' }}>Total</span>
            <span style={{ color: 'var(--store-text)' }}>{formatPrice(toNumber(order.total), priceConfig)}</span>
          </div>
        </div>
      </div>

      {/* Payment instructions */}
      {order.paymentMethod && (
        <div
          className="rounded-xl border p-6 mb-6"
          style={{ borderColor: 'var(--store-border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--store-text)' }}>
            Payment Instructions
          </h2>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--store-primary)' }}>
            {order.paymentMethod.name}
          </p>

          {/* Text/HTML instructions */}
          {order.paymentMethod.instructions && (
            <div
              className="text-sm leading-relaxed"
              style={{ color: 'var(--store-text-muted)' }}
              dangerouslySetInnerHTML={{ __html: order.paymentMethod.instructions }}
            />
          )}

          {/* Custom blocks */}
          {templateBlocks && templateBlocks.length > 0 && (
            <div className="space-y-3 mt-3">
              {templateBlocks.map((block, idx) => {
                if (block.type === 'heading') {
                  return (
                    <h3 key={idx} className="font-semibold text-sm" style={{ color: 'var(--store-text)' }}>
                      {block.content}
                    </h3>
                  )
                }
                if (block.type === 'paragraph') {
                  return (
                    <p key={idx} className="text-sm" style={{ color: 'var(--store-text-muted)' }}>
                      {block.content}
                    </p>
                  )
                }
                if (block.type === 'info_box' || block.type === 'account_info') {
                  return (
                    <div
                      key={idx}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800"
                    >
                      {block.content}
                    </div>
                  )
                }
                if (block.type === 'divider') {
                  return <hr key={idx} style={{ borderColor: 'var(--store-border)' }} />
                }
                if (block.type === 'link') {
                  const href = typeof block.props?.url === 'string' ? block.props.url : '#'
                  return (
                    <a
                      key={idx}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium hover:underline"
                      style={{ color: 'var(--store-primary)' }}
                    >
                      {block.content}
                    </a>
                  )
                }
                return null
              })}
            </div>
          )}
        </div>
      )}

      {/* Store contact */}
      {(config?.contactEmail ?? config?.contactPhone) && (
        <div
          className="rounded-xl border p-6 mb-6 text-sm"
          style={{ borderColor: 'var(--store-border)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--store-text)' }}>
            Need Help?
          </h2>
          <p style={{ color: 'var(--store-text-muted)' }}>
            Contact us if you have any questions about your order:
          </p>
          <div className="mt-2 space-y-1">
            {config?.contactEmail && (
              <a
                href={`mailto:${config.contactEmail}`}
                className="flex items-center gap-2 font-medium hover:underline"
                style={{ color: 'var(--store-primary)' }}
              >
                {config.contactEmail}
              </a>
            )}
            {config?.contactPhone && (
              <p className="font-medium" style={{ color: 'var(--store-text)' }}>
                {config.contactPhone}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/${params.slug}/products`}
          className="flex-1 py-3 rounded-lg font-semibold text-white text-center transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--store-primary)' }}
        >
          Continue Shopping
        </Link>
        <Link
          href={`/${params.slug}`}
          className="flex-1 py-3 rounded-lg font-medium border text-center transition-colors hover:bg-gray-50"
          style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
