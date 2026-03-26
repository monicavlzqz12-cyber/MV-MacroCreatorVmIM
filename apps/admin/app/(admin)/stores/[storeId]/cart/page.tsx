'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, AlignRight, Layers, PanelRight, FileText, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CART_MODES = [
  { value: 'DRAWER', label: 'Drawer', description: 'Slides from the side', Icon: PanelRight },
  { value: 'MODAL', label: 'Modal', description: 'Centered overlay', Icon: Layers },
  { value: 'SIDEBAR', label: 'Sidebar', description: 'Fixed sidebar panel', Icon: AlignRight },
  { value: 'PAGE', label: 'Page', description: 'Full cart page', Icon: FileText },
  { value: 'FLOATING', label: 'Floating', description: 'Floating bubble', Icon: Maximize2 },
]

interface CartFormData {
  mode: string
  style: string
  position: string
  size: string
  showImages: boolean
  showVariantOptions: boolean
  showQuantity: boolean
  showRemove: boolean
  showSubtotal: boolean
  showSavings: boolean
  showItemCount: boolean
  showShipping: boolean
  showTaxes: boolean
  showPromoCode: boolean
  showProgress: boolean
  freeShippingThreshold?: number
  showUpsells: boolean
  upsellTitle?: string
  upsellProductIds: string
  upsellMaxItems: number
  showCrossSells: boolean
  crossSellMaxItems: number
  cartTitle?: string
  emptyTitle?: string
  emptyMessage?: string
  checkoutButtonText?: string
  continueShoppingText?: string
  persistDays: number
  styleTokensBackgroundColor?: string
  styleTokensCheckoutButtonBg?: string
  styleTokensCheckoutButtonColor?: string
  styleTokensCheckoutButtonRadius?: string
}

interface Props {
  params: { storeId: string }
}

export default function CartConfigPage({ params }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm<CartFormData>({
    defaultValues: {
      mode: 'DRAWER',
      style: 'standard',
      position: 'right',
      size: 'md',
      showImages: true,
      showVariantOptions: true,
      showQuantity: true,
      showRemove: true,
      showSubtotal: true,
      showSavings: true,
      showItemCount: true,
      showShipping: false,
      showTaxes: false,
      showPromoCode: true,
      showProgress: false,
      showUpsells: false,
      upsellMaxItems: 3,
      showCrossSells: false,
      crossSellMaxItems: 3,
      persistDays: 7,
      upsellProductIds: '',
    },
  })

  const watchedMode = watch('mode')

  useEffect(() => {
    fetch(`/api/stores/${params.storeId}/cart-config`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const d = json.data
          reset({
            ...d,
            upsellProductIds: (d.upsellProductIds ?? []).join(', '),
            styleTokensBackgroundColor: d.styleTokens?.backgroundColor ?? '',
            styleTokensCheckoutButtonBg: d.styleTokens?.checkoutButtonBg ?? '',
            styleTokensCheckoutButtonColor: d.styleTokens?.checkoutButtonColor ?? '',
            styleTokensCheckoutButtonRadius: d.styleTokens?.checkoutButtonRadius ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [params.storeId, reset])

  const onSubmit = async (data: CartFormData) => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const payload = {
        ...data,
        upsellProductIds: data.upsellProductIds
          ? data.upsellProductIds.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        freeShippingThreshold: data.freeShippingThreshold ? Number(data.freeShippingThreshold) : undefined,
        upsellMaxItems: Number(data.upsellMaxItems),
        crossSellMaxItems: Number(data.crossSellMaxItems),
        persistDays: Number(data.persistDays),
        styleTokens: {
          backgroundColor: data.styleTokensBackgroundColor || undefined,
          checkoutButtonBg: data.styleTokensCheckoutButtonBg || undefined,
          checkoutButtonColor: data.styleTokensCheckoutButtonColor || undefined,
          checkoutButtonRadius: data.styleTokensCheckoutButtonRadius || undefined,
        },
      }

      const res = await fetch(`/api/stores/${params.storeId}/cart-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveMsg({ type: 'error', text: json.error ?? 'Failed to save' })
      } else {
        setSaveMsg({ type: 'success', text: 'Cart config saved!' })
        setTimeout(() => setSaveMsg(null), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  const inp = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-sm font-medium mb-1.5'

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-6 space-y-8">

            {/* Cart Mode */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Cart Mode</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {CART_MODES.map(({ value, label, description, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('mode', value)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      watchedMode === value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground',
                    )}
                  >
                    <Icon className={cn('w-8 h-8 mb-2', watchedMode === value ? 'text-primary' : 'text-muted-foreground')} />
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Cart Style */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Cart Style</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Style</label>
                  <select {...register('style')} className={inp}>
                    {['standard', 'minimal', 'bold', 'card', 'floating'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Position</label>
                  <select {...register('position')} className={inp}>
                    <option value="right">Right</option>
                    <option value="left">Left</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Size</label>
                  <select {...register('size')} className={inp}>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Content Toggles */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Content Toggles</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {([
                  { name: 'showImages', label: 'Product images' },
                  { name: 'showVariantOptions', label: 'Variant options' },
                  { name: 'showQuantity', label: 'Quantity selector' },
                  { name: 'showRemove', label: 'Remove button' },
                  { name: 'showSubtotal', label: 'Subtotal' },
                  { name: 'showSavings', label: 'Savings amount' },
                  { name: 'showItemCount', label: 'Item count' },
                  { name: 'showShipping', label: 'Shipping estimate' },
                  { name: 'showTaxes', label: 'Tax amount' },
                  { name: 'showPromoCode', label: 'Promo code input' },
                  { name: 'showProgress', label: 'Free shipping progress' },
                ] as const).map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg border border-border hover:bg-muted/30">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="mt-3 max-w-xs">
                <label className={lbl}>Free Shipping Threshold</label>
                <input
                  type="number"
                  {...register('freeShippingThreshold', { valueAsNumber: true })}
                  placeholder="0 = disabled"
                  className={inp}
                />
              </div>
            </section>

            {/* Upsells */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Upsells</h3>
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                <input type="checkbox" {...register('showUpsells')} className="w-4 h-4 rounded" />
                Enable upsells
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Upsell Title</label>
                  <input {...register('upsellTitle')} placeholder="You might also like" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Max Items</label>
                  <input type="number" {...register('upsellMaxItems', { valueAsNumber: true })} min={1} max={10} className={inp} />
                </div>
                <div className="md:col-span-2">
                  <label className={lbl}>Product IDs (comma-separated)</label>
                  <input {...register('upsellProductIds')} placeholder="id1, id2, id3" className={inp} />
                </div>
              </div>
            </section>

            {/* Text Overrides */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Text Overrides</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'cartTitle' as const, label: 'Cart Title', placeholder: 'Your Cart' },
                  { name: 'emptyTitle' as const, label: 'Empty Cart Title', placeholder: 'Your cart is empty' },
                  { name: 'checkoutButtonText' as const, label: 'Checkout Button', placeholder: 'Checkout' },
                  { name: 'continueShoppingText' as const, label: 'Continue Shopping', placeholder: 'Continue Shopping' },
                ].map(({ name, label, placeholder }) => (
                  <div key={name}>
                    <label className={lbl}>{label}</label>
                    <input {...register(name)} placeholder={placeholder} className={inp} />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={lbl}>Empty Cart Message</label>
                  <input {...register('emptyMessage')} placeholder="Add items to get started" className={inp} />
                </div>
              </div>
            </section>

            {/* Style Tokens */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Style Tokens</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'styleTokensBackgroundColor' as const, label: 'Background Color' },
                  { name: 'styleTokensCheckoutButtonBg' as const, label: 'Checkout Button BG' },
                  { name: 'styleTokensCheckoutButtonColor' as const, label: 'Checkout Button Text' },
                  { name: 'styleTokensCheckoutButtonRadius' as const, label: 'Button Radius' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className={lbl}>{label}</label>
                    <input {...register(name)} placeholder="#..." className={cn(inp, 'font-mono text-xs')} />
                  </div>
                ))}
              </div>
              <div className="mt-3 max-w-xs">
                <label className={lbl}>Persist Cart (days)</label>
                <input type="number" {...register('persistDays', { valueAsNumber: true })} min={1} max={365} className={inp} />
              </div>
            </section>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            {saveMsg ? (
              <p className={cn('text-sm', saveMsg.type === 'success' ? 'text-green-600' : 'text-destructive')}>{saveMsg.text}</p>
            ) : <div />}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Cart Config
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
