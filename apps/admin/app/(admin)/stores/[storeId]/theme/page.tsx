'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const PRESETS = [
  { name: 'default', displayName: 'Default', description: 'Clean and balanced' },
  { name: 'minimal', displayName: 'Minimal', description: 'Less is more' },
  { name: 'bold', displayName: 'Bold', description: 'Strong visual impact' },
  { name: 'elegant', displayName: 'Elegant', description: 'Refined and sophisticated' },
  { name: 'modern', displayName: 'Modern', description: 'Contemporary design' },
]

interface ThemeFormData {
  presetName: string
  cardStyle: string
  cardShowRating: boolean
  cardShowBadges: boolean
  cardShowQuickAdd: boolean
  cardImageRatio: string
  cardHoverEffect: string
  cardPricePosition: string
  headerStyle: string
  headerSticky: boolean
  headerShowSearch: boolean
  headerShowCart: boolean
  headerLogoMaxHeight: number
  headerNavLayout: string
  buttonStyle: string
  buttonRadius: string
  listingDefaultView: string
  listingColumns: number
  listingShowFilters: boolean
  listingShowSort: boolean
  pdpLayout: string
  pdpShowRelated: boolean
  pdpRelatedCount: number
  pdpImageLayout: string
  pdpShowShare: boolean
  pdpShowSku: boolean
  pdpShowStock: boolean
  priceShowOriginal: boolean
  priceShowSavings: boolean
  priceShowSavingsPct: boolean
  priceColorDiscount: string
  customCss?: string
}

interface Props {
  params: { storeId: string }
}

export default function ThemePage({ params }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm<ThemeFormData>({
    defaultValues: {
      presetName: 'default',
      cardStyle: 'standard',
      cardShowRating: true,
      cardShowBadges: true,
      cardShowQuickAdd: true,
      cardImageRatio: '1:1',
      cardHoverEffect: 'zoom',
      cardPricePosition: 'below',
      headerStyle: 'standard',
      headerSticky: true,
      headerShowSearch: true,
      headerShowCart: true,
      headerLogoMaxHeight: 48,
      headerNavLayout: 'horizontal',
      buttonStyle: 'filled',
      buttonRadius: 'md',
      listingDefaultView: 'grid',
      listingColumns: 4,
      listingShowFilters: true,
      listingShowSort: true,
      pdpLayout: 'standard',
      pdpShowRelated: true,
      pdpRelatedCount: 4,
      pdpImageLayout: 'gallery',
      pdpShowShare: true,
      pdpShowSku: true,
      pdpShowStock: true,
      priceShowOriginal: true,
      priceShowSavings: true,
      priceShowSavingsPct: true,
      priceColorDiscount: '#DC2626',
      customCss: '',
    },
  })

  const watchedPreset = watch('presetName')
  const watchedCardStyle = watch('cardStyle')

  useEffect(() => {
    fetch(`/api/stores/${params.storeId}/theme`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) reset(json.data)
      })
      .finally(() => setLoading(false))
  }, [params.storeId, reset])

  const onSubmit = async (data: ThemeFormData) => {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/stores/${params.storeId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveMsg({ type: 'error', text: json.error ?? 'Failed to save' })
      } else {
        setSaveMsg({ type: 'success', text: 'Theme saved!' })
        setTimeout(() => setSaveMsg(null), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  const sel = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-sm font-medium mb-1.5'

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-border shadow-sm">
          <div className="p-6 space-y-8">

            {/* Preset Selector */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Theme Preset</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setValue('presetName', preset.name)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      watchedPreset === preset.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground',
                    )}
                  >
                    <div className="w-full h-16 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 mb-2 flex items-center justify-center text-2xl">
                      {preset.name === 'default' ? '🏠' : preset.name === 'minimal' ? '◻' : preset.name === 'bold' ? '■' : preset.name === 'elegant' ? '✦' : '◈'}
                    </div>
                    <p className="text-xs font-semibold">{preset.displayName}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Product Cards */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Product Cards</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Card Style</label>
                  <select {...register('cardStyle')} className={sel}>
                    {['standard', 'compact', 'minimal', 'bold', 'overlay'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Image Ratio</label>
                  <select {...register('cardImageRatio')} className={sel}>
                    {['1:1', '4:3', '3:4', '16:9'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Hover Effect</label>
                  <select {...register('cardHoverEffect')} className={sel}>
                    {['zoom', 'fade', 'lift', 'none'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Price Position</label>
                  <select {...register('cardPricePosition')} className={sel}>
                    <option value="below">Below image</option>
                    <option value="overlay">Overlay</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-6 mt-3">
                {[
                  { name: 'cardShowRating' as const, label: 'Show rating' },
                  { name: 'cardShowBadges' as const, label: 'Show badges' },
                  { name: 'cardShowQuickAdd' as const, label: 'Quick add button' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
              {/* Mini preview */}
              <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground mb-2">Preview (approximate)</p>
                <div className={cn(
                  'inline-block rounded-xl border border-border overflow-hidden bg-white shadow-sm',
                  watchedCardStyle === 'compact' ? 'w-32' : 'w-44',
                )}>
                  <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl">🛍️</div>
                  <div className="p-2">
                    <p className="text-xs font-medium">Sample Product</p>
                    <p className="text-xs text-primary font-semibold mt-0.5">$29.99</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Header */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Header</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Header Style</label>
                  <select {...register('headerStyle')} className={sel}>
                    {['standard', 'centered', 'minimal', 'floating'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Nav Layout</label>
                  <select {...register('headerNavLayout')} className={sel}>
                    {['horizontal', 'dropdown', 'megamenu'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Logo Max Height (px)</label>
                  <input type="number" {...register('headerLogoMaxHeight', { valueAsNumber: true })} min={24} max={120} className={sel} />
                </div>
              </div>
              <div className="flex gap-6 mt-3">
                {[
                  { name: 'headerSticky' as const, label: 'Sticky header' },
                  { name: 'headerShowSearch' as const, label: 'Show search' },
                  { name: 'headerShowCart' as const, label: 'Show cart' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {/* Buttons */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Buttons</h3>
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div>
                  <label className={lbl}>Button Style</label>
                  <select {...register('buttonStyle')} className={sel}>
                    {['filled', 'outlined', 'ghost', 'soft'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Button Radius</label>
                  <select {...register('buttonRadius')} className={sel}>
                    {['sm', 'md', 'lg', 'xl', 'full'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Listing */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Product Listing</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Default View</label>
                  <select {...register('listingDefaultView')} className={sel}>
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Grid Columns</label>
                  <select {...register('listingColumns', { valueAsNumber: true })} className={sel}>
                    {[2, 3, 4, 5].map((v) => <option key={v} value={v}>{v} columns</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-6 mt-3">
                {[
                  { name: 'listingShowFilters' as const, label: 'Show filters' },
                  { name: 'listingShowSort' as const, label: 'Show sort' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {/* Product Page */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Product Page (PDP)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className={lbl}>Layout</label>
                  <select {...register('pdpLayout')} className={sel}>
                    {['standard', 'wide', 'minimal', 'split'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Image Layout</label>
                  <select {...register('pdpImageLayout')} className={sel}>
                    {['gallery', 'carousel', 'stacked', 'thumbnails'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Related Products Count</label>
                  <input type="number" {...register('pdpRelatedCount', { valueAsNumber: true })} min={0} max={12} className={sel} />
                </div>
              </div>
              <div className="flex flex-wrap gap-6 mt-3">
                {[
                  { name: 'pdpShowRelated' as const, label: 'Show related products' },
                  { name: 'pdpShowShare' as const, label: 'Show share button' },
                  { name: 'pdpShowSku' as const, label: 'Show SKU' },
                  { name: 'pdpShowStock' as const, label: 'Show stock count' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </section>

            {/* Price Display */}
            <section>
              <h3 className="text-sm font-semibold mb-3">Price Display</h3>
              <div className="flex flex-wrap gap-6 mb-4">
                {[
                  { name: 'priceShowOriginal' as const, label: 'Show original price' },
                  { name: 'priceShowSavings' as const, label: 'Show savings amount' },
                  { name: 'priceShowSavingsPct' as const, label: 'Show savings %' },
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 max-w-xs">
                <input type="color" {...register('priceColorDiscount')} className="w-10 h-9 rounded border border-input cursor-pointer" />
                <div className="flex-1">
                  <label className={lbl}>Discount Price Color</label>
                  <input {...register('priceColorDiscount')} className={cn(sel, 'font-mono text-xs')} />
                </div>
              </div>
            </section>

            {/* Custom CSS */}
            <section>
              <h3 className="text-sm font-semibold mb-1.5">Custom CSS</h3>
              <p className="text-xs text-muted-foreground mb-3">Dangerous patterns (url(javascript:), expression(), @import url()) are automatically stripped on save.</p>
              <textarea
                {...register('customCss')}
                rows={8}
                placeholder="/* Add custom CSS here */&#10;.btn { /* custom styles */ }"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </section>
          </div>

          {/* Footer */}
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
              Save Theme
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
