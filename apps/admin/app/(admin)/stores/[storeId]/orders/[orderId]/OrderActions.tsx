'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'ON_HOLD']
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']

interface Props {
  orderId: string
  storeId: string
  currentStatus: string
  currentPaymentStatus: string
  internalNotes: string
}

export default function OrderActions({ orderId, storeId, currentStatus, currentPaymentStatus, internalNotes }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [paymentStatus, setPaymentStatus] = useState(currentPaymentStatus)
  const [statusNote, setStatusNote] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleUpdateStatus = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/stores/${storeId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STATUS', status, note: statusNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(`Error: ${json.error}`)
      } else {
        setMessage('Status updated')
        setStatusNote('')
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePayment = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PAYMENT', paymentStatus }),
      })
      if (res.ok) {
        setMessage('Payment status updated')
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!internalNote.trim()) return
    setNotesSaving(true)
    try {
      const res = await fetch(`/api/stores/${storeId}/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_NOTE', note: internalNote }),
      })
      if (res.ok) {
        setInternalNote('')
        setMessage('Note added')
        router.refresh()
      }
    } finally {
      setNotesSaving(false)
    }
  }

  const sel = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-5">
      <h3 className="font-semibold">Update Order</h3>

      {message && (
        <p className={cn('text-sm', message.startsWith('Error') ? 'text-destructive' : 'text-green-600')}>{message}</p>
      )}

      {/* Status Update */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Order Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <textarea
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          rows={2}
          placeholder="Optional note for this status change..."
          className={cn(sel, 'resize-none')}
        />
        <button
          onClick={handleUpdateStatus}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Status
        </button>
      </div>

      {/* Payment Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Payment Status</label>
        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={sel}>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={handleUpdatePayment}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
        >
          Update Payment
        </button>
      </div>

      {/* Internal Note */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Internal Note</label>
        <textarea
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          rows={3}
          placeholder="Add an internal note (not visible to customer)..."
          className={cn(sel, 'resize-none')}
        />
        <button
          onClick={handleAddNote}
          disabled={notesSaving || !internalNote.trim()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
        >
          {notesSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Note
        </button>
        {internalNotes && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">Current internal notes:</p>
            <p className="text-sm whitespace-pre-wrap">{internalNotes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
