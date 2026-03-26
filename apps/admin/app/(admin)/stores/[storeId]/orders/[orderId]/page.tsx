import { notFound } from 'next/navigation'
import { prisma } from '@store-builder/database'
import { formatDate, orderStatusColor, paymentStatusColor } from '@/lib/utils'
import OrderActions from './OrderActions'

interface PageProps {
  params: { storeId: string; orderId: string }
}

export default async function OrderDetailPage({ params }: PageProps) {
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, storeId: params.storeId },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: 'desc' } },
      paymentMethod: { select: { name: true, type: true } },
    },
  })

  if (!order) notFound()

  const appliedPromotions = (order.appliedPromotions as Array<{ id: string; name: string; type: string; discountAmount: number }> | null) ?? []
  const shippingAddress = order.shippingAddress as Record<string, string> | null
  const billingAddress = order.billingAddress as Record<string, string> | null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold font-mono">Order #{order.orderNumber}</h2>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${orderStatusColor(order.status)}`}>
              {order.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${paymentStatusColor(order.paymentStatus)}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Items + Pricing */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Order Items ({order.items.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.productName}</p>
                    {item.variantName && <p className="text-xs text-muted-foreground">{item.variantName}</p>}
                    {item.sku && <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${Number(item.totalPrice).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">${Number(item.unitPrice).toFixed(2)} each</p>
                    {Number(item.discountAmount) > 0 && (
                      <p className="text-xs text-green-600">-${Number(item.discountAmount).toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="px-5 py-4 border-t border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {appliedPromotions.map((promo) => (
                <div key={promo.id} className="flex justify-between text-xs text-muted-foreground pl-3">
                  <span>{promo.name}</span>
                  <span>-${Number(promo.discountAmount).toFixed(2)}</span>
                </div>
              ))}
              {order.couponCode && (
                <div className="flex justify-between text-xs text-muted-foreground pl-3">
                  <span>Coupon: {order.couponCode}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{Number(order.shippingAmount) === 0 ? 'Free' : `$${Number(order.shippingAmount).toFixed(2)}`}</span>
              </div>
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${Number(order.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)} {order.currency}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-border shadow-sm">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Order Timeline</h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              {order.timeline.map((event) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{event.status}</p>
                    {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.createdAt)} {event.createdBy ? `· ${event.createdBy}` : ''}
                      {event.isInternal && ' · Internal'}
                    </p>
                  </div>
                </div>
              ))}
              {order.timeline.length === 0 && (
                <p className="text-sm text-muted-foreground">No timeline events yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: customer, addresses, payment, actions */}
        <div className="space-y-5">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-semibold mb-3">Customer</h3>
            {order.guestEmail ? (
              <div className="space-y-1 text-sm">
                <p>{order.guestFirstName} {order.guestLastName}</p>
                <p className="text-muted-foreground">{order.guestEmail}</p>
                {order.guestPhone && <p className="text-muted-foreground">{order.guestPhone}</p>}
                <p className="text-xs text-muted-foreground mt-1">Guest checkout</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No customer info</p>
            )}
          </div>

          {/* Shipping Address */}
          {shippingAddress && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-semibold mb-3">Shipping Address</h3>
              <div className="text-sm space-y-0.5 text-muted-foreground">
                <p className="text-foreground font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
                {shippingAddress.company && <p>{shippingAddress.company}</p>}
                <p>{shippingAddress.street}</p>
                {shippingAddress.street2 && <p>{shippingAddress.street2}</p>}
                <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}</p>
                <p>{shippingAddress.country}</p>
                {shippingAddress.phone && <p>{shippingAddress.phone}</p>}
              </div>
            </div>
          )}

          {/* Billing Address */}
          {billingAddress && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-semibold mb-3">Billing Address</h3>
              <div className="text-sm space-y-0.5 text-muted-foreground">
                <p className="text-foreground font-medium">{billingAddress.firstName} {billingAddress.lastName}</p>
                <p>{billingAddress.street}</p>
                <p>{billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                <p>{billingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h3 className="font-semibold mb-3">Payment</h3>
            <div className="text-sm space-y-1">
              <p>{order.paymentMethod?.name ?? 'Unknown method'}</p>
              <p className="text-muted-foreground">{order.paymentMethod?.type}</p>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div className="bg-white rounded-xl border border-border shadow-sm p-5">
              <h3 className="font-semibold mb-2">Customer Notes</h3>
              <p className="text-sm text-muted-foreground">{order.customerNotes}</p>
            </div>
          )}

          {/* Admin Actions (Client Component) */}
          <OrderActions
            orderId={params.orderId}
            storeId={params.storeId}
            currentStatus={order.status}
            currentPaymentStatus={order.paymentStatus}
            internalNotes={order.internalNotes ?? ''}
          />
        </div>
      </div>
    </div>
  )
}
