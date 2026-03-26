'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Plus, Loader2, Pencil, Trash2, X, ChevronUp, ChevronDown, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaymentMethod {
  id: string
  name: string
  type: string
  description?: string | null
  isActive: boolean
  sortOrder: number
  instructions?: string | null
}

interface PaymentFormData {
  name: string
  description?: string
  type: string
  instructions?: string
  redirectUrl?: string
  isActive: boolean
}

interface Props {
  params: { storeId: string }
}

const PAYMENT_TYPES = ['BANK_TRANSFER', 'CASH_ON_DELIVERY', 'CUSTOM_BLOCKS', 'EXTERNAL_LINK', 'MANUAL']

export default function PaymentsPage({ params }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)

  const form = useForm<PaymentFormData>({
    defaultValues: { type: 'BANK_TRANSFER', isActive: true },
  })
  const watchedType = form.watch('type')

  const fetchMethods = async () => {
    const res = await fetch(`/api/stores/${params.storeId}/payments`)
    const json = await res.json()
    setMethods(json.data ?? [])
  }

  useEffect(() => {
    fetchMethods().finally(() => setLoading(false))
  }, [params.storeId])

  const handleSave = async (data: PaymentFormData) => {
    const url = editingMethod
      ? `/api/stores/${params.storeId}/payments/${editingMethod.id}`
      : `/api/stores/${params.storeId}/payments`
    const method = editingMethod ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setShowModal(false)
    setEditingMethod(null)
    form.reset({ type: 'BANK_TRANSFER', isActive: true })
    await fetchMethods()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payment method?')) return
    await fetch(`/api/stores/${params.storeId}/payments/${id}`, { method: 'DELETE' })
    await fetchMethods()
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const sorted = [...methods].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((m) => m.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const swapWith = sorted[swapIdx]
    const current = sorted[idx]
    if (!swapWith || !current) return
    await Promise.all([
      fetch(`/api/stores/${params.storeId}/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: swapWith.sortOrder }),
      }),
      fetch(`/api/stores/${params.storeId}/payments/${swapWith.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ])
    await fetchMethods()
  }

  const openEdit = (method: PaymentMethod) => {
    setEditingMethod(method)
    form.reset({
      name: method.name,
      description: method.description ?? '',
      type: method.type,
      instructions: method.instructions ?? '',
      isActive: method.isActive,
    })
    setShowModal(true)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  const sorted = [...methods].sort((a, b) => a.sortOrder - b.sortOrder)
  const inp = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-sm font-medium mb-1.5'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Payment Methods</h3>
        <button
          onClick={() => { setEditingMethod(null); form.reset({ type: 'BANK_TRANSFER', isActive: true }); setShowModal(true) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm divide-y divide-border">
        {sorted.map((method) => (
          <div key={method.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => handleMove(method.id, 'up')} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleMove(method.id, 'down')} className="p-0.5 hover:bg-muted rounded text-muted-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{method.name}</p>
              <p className="text-xs text-muted-foreground">{method.type}{method.description ? ` · ${method.description}` : ''}</p>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${method.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {method.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(method)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(method.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">No payment methods configured.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={form.handleSubmit(handleSave)} className="p-6 space-y-4">
              <div>
                <label className={lbl}>Name</label>
                <input {...form.register('name', { required: true })} placeholder="Bank Transfer" className={inp} />
              </div>
              <div>
                <label className={lbl}>Type</label>
                <select {...form.register('type')} className={inp}>
                  {PAYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <input {...form.register('description')} placeholder="Brief description" className={inp} />
              </div>

              {(watchedType === 'BANK_TRANSFER' || watchedType === 'MANUAL') && (
                <div>
                  <label className={lbl}>Instructions (HTML)</label>
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2 text-xs flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    HTML is sanitized on save. Only safe tags are allowed.
                  </div>
                  <textarea {...form.register('instructions')} rows={5} placeholder="<p>Please transfer to account...</p>" className={cn(inp, 'resize-y font-mono text-xs')} />
                </div>
              )}

              {watchedType === 'CASH_ON_DELIVERY' && (
                <div>
                  <label className={lbl}>Description / Terms</label>
                  <textarea {...form.register('description')} rows={3} placeholder="Pay with cash on delivery." className={cn(inp, 'resize-none')} />
                </div>
              )}

              {watchedType === 'EXTERNAL_LINK' && (
                <div>
                  <label className={lbl}>Redirect URL</label>
                  <input {...form.register('redirectUrl')} placeholder="https://payment-provider.com/pay" className={inp} />
                </div>
              )}

              {watchedType === 'CUSTOM_BLOCKS' && (
                <div>
                  <label className={lbl}>Instructions (HTML)</label>
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-3 py-2 text-xs mb-2">
                    Custom blocks are rendered as safe HTML. Supported: headings, paragraphs, info boxes, account info sections.
                  </div>
                  <textarea {...form.register('instructions')} rows={5} className={cn(inp, 'resize-y font-mono text-xs')} />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...form.register('isActive')} className="w-4 h-4 rounded" />
                Active
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
                <button type="submit" disabled={form.formState.isSubmitting} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
                  {form.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
