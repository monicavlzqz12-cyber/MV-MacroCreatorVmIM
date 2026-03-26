'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Promotion {
  id: string
  name: string
  type: string
  target: string
  discountValue: number
  maxDiscountAmount?: number | null
  minOrderAmount?: number | null
  isAutoApply: boolean
  isStackable: boolean
  priority: number
  startsAt?: string | null
  endsAt?: string | null
  maxUses?: number | null
  currentUses: number
  isActive: boolean
}

interface Coupon {
  id: string
  code: string
  type?: string | null
  discountValue?: number | null
  currentUses: number
  maxUses?: number | null
  startsAt?: string | null
  endsAt?: string | null
  isActive: boolean
  promotion?: { name: string } | null
}

interface PromotionFormData {
  name: string
  description?: string
  type: string
  target: string
  discountValue: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  isAutoApply: boolean
  isStackable: boolean
  priority: number
  startsAt?: string
  endsAt?: string
  maxUses?: number
  isActive: boolean
}

interface CouponFormData {
  code: string
  promotionId?: string
  type?: string
  discountValue?: number
  target: string
  minOrderAmount?: number
  maxDiscountAmount?: number
  maxUses?: number
  maxUsesPerUser?: number
  startsAt?: string
  endsAt?: string
  isActive: boolean
}

interface Props {
  params: { storeId: string }
}

const PROMO_TYPES = ['PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'GIFT']
const TARGETS = ['ALL', 'PRODUCT', 'CATEGORY', 'COLLECTION', 'CART_VALUE']

export default function PromotionsPage({ params }: Props) {
  const [activeTab, setActiveTab] = useState<'promotions' | 'coupons'>('promotions')
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showPromoModal, setShowPromoModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const promoForm = useForm<PromotionFormData>({
    defaultValues: {
      type: 'PERCENTAGE_DISCOUNT',
      target: 'ALL',
      discountValue: 10,
      isAutoApply: true,
      isStackable: false,
      priority: 0,
      isActive: true,
    },
  })

  const couponForm = useForm<CouponFormData>({
    defaultValues: {
      target: 'ALL',
      isActive: true,
    },
  })

  const fetchData = async () => {
    const [promosRes, couponsRes] = await Promise.all([
      fetch(`/api/stores/${params.storeId}/promotions`),
      fetch(`/api/stores/${params.storeId}/coupons`),
    ])
    const [promosJson, couponsJson] = await Promise.all([promosRes.json(), couponsRes.json()])
    setPromotions(promosJson.data ?? [])
    setCoupons(couponsJson.data ?? [])
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [params.storeId])

  const handleSavePromo = async (data: PromotionFormData) => {
    const url = editingPromo
      ? `/api/stores/${params.storeId}/promotions/${editingPromo.id}`
      : `/api/stores/${params.storeId}/promotions`
    const method = editingPromo ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setShowPromoModal(false)
    setEditingPromo(null)
    promoForm.reset()
    await fetchData()
  }

  const handleSaveCoupon = async (data: CouponFormData) => {
    await fetch(`/api/stores/${params.storeId}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setShowCouponModal(false)
    couponForm.reset()
    await fetchData()
  }

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Delete this promotion?')) return
    setDeletingId(id)
    await fetch(`/api/stores/${params.storeId}/promotions/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    await fetchData()
  }

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    await fetch(`/api/stores/${params.storeId}/coupons/${id}`, { method: 'DELETE' })
    await fetchData()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  const inp = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-xs font-medium mb-1'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Promotions & Coupons</h3>
        {activeTab === 'promotions' ? (
          <button
            onClick={() => { setEditingPromo(null); promoForm.reset({ type: 'PERCENTAGE_DISCOUNT', target: 'ALL', discountValue: 10, isAutoApply: true, isStackable: false, priority: 0, isActive: true }); setShowPromoModal(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Promotion
          </button>
        ) : (
          <button
            onClick={() => { couponForm.reset({ target: 'ALL', isActive: true }); setShowCouponModal(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Coupon
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm">
        {/* Tabs */}
        <div className="flex border-b border-border px-4">
          {(['promotions', 'coupons'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap capitalize transition-colors',
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'promotions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Target</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{promo.name}</p>
                        {promo.isAutoApply && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Auto-apply</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{promo.type}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{promo.target}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {promo.type === 'PERCENTAGE_DISCOUNT' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {promo.startsAt ? formatDate(promo.startsAt) : '—'} → {promo.endsAt ? formatDate(promo.endsAt) : '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditingPromo(promo); promoForm.reset({ name: promo.name, type: promo.type, target: promo.target, discountValue: promo.discountValue, maxDiscountAmount: promo.maxDiscountAmount ?? undefined, minOrderAmount: promo.minOrderAmount ?? undefined, maxUses: promo.maxUses ?? undefined, isAutoApply: promo.isAutoApply, isStackable: promo.isStackable, priority: promo.priority, isActive: promo.isActive, startsAt: promo.startsAt ? promo.startsAt.split('T')[0] : undefined, endsAt: promo.endsAt ? promo.endsAt.split('T')[0] : undefined }); setShowPromoModal(true) }}
                          className="p-1.5 hover:bg-muted rounded text-muted-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePromo(promo.id)}
                          disabled={deletingId === promo.id}
                          className="p-1.5 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promotions.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No promotions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Linked Promotion</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Discount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uses</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dates</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold">{coupon.code}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{coupon.promotion?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {coupon.type && coupon.discountValue
                        ? `${coupon.type === 'PERCENTAGE_DISCOUNT' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">{coupon.currentUses} / {coupon.maxUses ?? '∞'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {coupon.startsAt ? formatDate(coupon.startsAt) : '—'} → {coupon.endsAt ? formatDate(coupon.endsAt) : '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteCoupon(coupon.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No coupons yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editingPromo ? 'Edit Promotion' : 'New Promotion'}</h3>
              <button onClick={() => setShowPromoModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={promoForm.handleSubmit(handleSavePromo)} className="p-6 space-y-4">
              <div><label className={lbl}>Name</label><input {...promoForm.register('name', { required: true })} className={inp} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Type</label>
                  <select {...promoForm.register('type')} className={inp}>
                    {PROMO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Target</label>
                  <select {...promoForm.register('target')} className={inp}>
                    {TARGETS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Discount Value</label>
                  <input type="number" step="0.01" {...promoForm.register('discountValue', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Max Discount Cap</label>
                  <input type="number" step="0.01" {...promoForm.register('maxDiscountAmount', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Min Order Amount</label>
                  <input type="number" step="0.01" {...promoForm.register('minOrderAmount', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Max Uses</label>
                  <input type="number" {...promoForm.register('maxUses', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Priority</label>
                  <input type="number" {...promoForm.register('priority', { valueAsNumber: true })} className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Starts At</label><input type="date" {...promoForm.register('startsAt')} className={inp} /></div>
                <div><label className={lbl}>Ends At</label><input type="date" {...promoForm.register('endsAt')} className={inp} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                {[{ name: 'isAutoApply' as const, label: 'Auto-apply' }, { name: 'isStackable' as const, label: 'Stackable' }, { name: 'isActive' as const, label: 'Active' }].map(({ name, label }) => (
                  <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...promoForm.register(name)} className="w-4 h-4 rounded" />
                    {label}
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPromoModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={promoForm.formState.isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  {promoForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">New Coupon</h3>
              <button onClick={() => setShowCouponModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={couponForm.handleSubmit(handleSaveCoupon)} className="p-6 space-y-4">
              <div><label className={lbl}>Coupon Code</label><input {...couponForm.register('code', { required: true })} placeholder="SUMMER20" className={cn(inp, 'uppercase font-mono')} /></div>
              <div>
                <label className={lbl}>Link to Promotion (optional)</label>
                <select {...couponForm.register('promotionId')} className={inp}>
                  <option value="">Standalone coupon</option>
                  {promotions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Type</label>
                  <select {...couponForm.register('type')} className={inp}>
                    <option value="">—</option>
                    {PROMO_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Discount Value</label>
                  <input type="number" step="0.01" {...couponForm.register('discountValue', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Max Uses</label>
                  <input type="number" {...couponForm.register('maxUses', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Min Order Amount</label>
                  <input type="number" step="0.01" {...couponForm.register('minOrderAmount', { valueAsNumber: true })} className={inp} />
                </div>
                <div><label className={lbl}>Starts At</label><input type="date" {...couponForm.register('startsAt')} className={inp} /></div>
                <div><label className={lbl}>Ends At</label><input type="date" {...couponForm.register('endsAt')} className={inp} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...couponForm.register('isActive')} className="w-4 h-4 rounded" />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCouponModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={couponForm.formState.isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  {couponForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
