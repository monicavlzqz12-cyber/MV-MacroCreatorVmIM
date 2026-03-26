'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Send, Mail, ArrowLeft } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

const TEMPLATE_TYPES = [
  { type: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
  { type: 'PAYMENT_RECEIVED', label: 'Payment Received' },
  { type: 'ORDER_PROCESSING', label: 'Order Processing' },
  { type: 'ORDER_SHIPPED', label: 'Order Shipped' },
  { type: 'ORDER_DELIVERED', label: 'Order Delivered' },
  { type: 'ORDER_CANCELLED', label: 'Order Cancelled' },
]

const AVAILABLE_VARIABLES = [
  { path: '{{order.number}}', desc: 'Order number' },
  { path: '{{order.total}}', desc: 'Order total' },
  { path: '{{order.status}}', desc: 'Order status' },
  { path: '{{customer.firstName}}', desc: 'Customer first name' },
  { path: '{{customer.lastName}}', desc: 'Customer last name' },
  { path: '{{customer.email}}', desc: 'Customer email' },
  { path: '{{store.name}}', desc: 'Store name' },
  { path: '{{store.contactEmail}}', desc: 'Store email' },
  { path: '{{shippingAddress.city}}', desc: 'Shipping city' },
  { path: '{{shippingAddress.country}}', desc: 'Shipping country' },
]

interface EmailTemplate {
  id: string
  type: string
  name: string
  subject: string
  previewText?: string | null
  htmlContent: string
  textContent?: string | null
  isActive: boolean
  updatedAt: string
}

interface TemplateFormData {
  subject: string
  previewText?: string
  htmlContent: string
  textContent?: string
  isActive: boolean
}

interface Props {
  params: { storeId: string }
}

export default function EmailTemplatesPage({ params }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const form = useForm<TemplateFormData>({
    defaultValues: { isActive: true },
  })

  const fetchTemplates = async () => {
    const res = await fetch(`/api/stores/${params.storeId}/emails`)
    const json = await res.json()
    setTemplates(json.data ?? [])
  }

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false))
  }, [params.storeId])

  const handleSelectTemplate = (type: string) => {
    const tpl = templates.find((t) => t.type === type)
    if (tpl) {
      form.reset({
        subject: tpl.subject,
        previewText: tpl.previewText ?? '',
        htmlContent: tpl.htmlContent,
        textContent: tpl.textContent ?? '',
        isActive: tpl.isActive,
      })
    }
    setSelectedType(type)
    setMessage(null)
  }

  const handleSave = async (data: TemplateFormData) => {
    if (!selectedType) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/stores/${params.storeId}/emails/${selectedType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(`Error: ${json.error}`)
      } else {
        setMessage('Template saved!')
        await fetchTemplates()
        setTimeout(() => setMessage(null), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTestSending(true)
    try {
      const res = await fetch(`/api/stores/${params.storeId}/config/smtp-test`, { method: 'POST' })
      const json = await res.json()
      setMessage(json.success ? 'Test email sent!' : `Failed: ${json.error}`)
    } finally {
      setTestSending(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  const inp = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-sm font-medium mb-1.5'

  if (!selectedType) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Email Templates</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {TEMPLATE_TYPES.map(({ type, label }) => {
            const tpl = templates.find((t) => t.type === type)
            return (
              <button
                key={type}
                onClick={() => handleSelectTemplate(type)}
                className="bg-white rounded-xl border border-border shadow-sm p-5 text-left hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tpl?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {tpl?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <h4 className="font-semibold text-sm">{label}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {tpl ? `Last modified: ${formatDate(tpl.updatedAt)}` : 'Click to configure'}
                </p>
              </button>
            )
          })}
        </div>

        {/* SMTP + Deliverability */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">SMTP & Deliverability</h4>
            <button
              onClick={handleTestEmail}
              disabled={testSending}
              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {testSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Test Email
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure your SMTP settings in the{' '}
            <a href={`/stores/${params.storeId}/config`} className="text-primary hover:underline">Store Config → SMTP tab</a>.
          </p>

          <div>
            <h5 className="text-sm font-semibold mb-2">Deliverability DNS Records</h5>
            <p className="text-xs text-muted-foreground mb-3">
              Add these DNS records to your domain to improve email deliverability and avoid spam filters.
            </p>
            <div className="space-y-3">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold mb-1">SPF Record (TXT)</p>
                <code className="text-xs font-mono bg-background px-2 py-1 rounded border border-border block">
                  v=spf1 include:_spf.yourdomain.com ~all
                </code>
                <p className="text-xs text-muted-foreground mt-1">Tells receiving servers which IPs are authorized to send on your behalf.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold mb-1">DKIM Record (TXT)</p>
                <code className="text-xs font-mono bg-background px-2 py-1 rounded border border-border block break-all">
                  mail._domainkey IN TXT "v=DKIM1; k=rsa; p=MIGfMA0..."
                </code>
                <p className="text-xs text-muted-foreground mt-1">Cryptographic signature that verifies emails were not tampered with in transit.</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-semibold mb-1">DMARC Record (TXT)</p>
                <code className="text-xs font-mono bg-background px-2 py-1 rounded border border-border block">
                  _dmarc IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
                </code>
                <p className="text-xs text-muted-foreground mt-1">Instructs receiving servers on how to handle emails failing SPF/DKIM checks.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const templateInfo = TEMPLATE_TYPES.find((t) => t.type === selectedType)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedType(null)}
          className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="font-semibold">{templateInfo?.label}</h3>
      </div>

      <form onSubmit={form.handleSubmit(handleSave)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Editor */}
          <div className="xl:col-span-2 bg-white rounded-xl border border-border shadow-sm">
            <div className="p-6 space-y-4">
              <div>
                <label className={lbl}>Subject</label>
                <input {...form.register('subject', { required: true })} placeholder="Your order #{{order.number}} has been confirmed!" className={inp} />
              </div>
              <div>
                <label className={lbl}>Preview Text</label>
                <input {...form.register('previewText')} placeholder="Thank you for your order..." className={inp} />
              </div>
              <div>
                <label className={lbl}>HTML Content</label>
                <textarea
                  {...form.register('htmlContent', { required: true })}
                  rows={16}
                  placeholder="<p>Hello {{customer.firstName}},</p>&#10;<p>Your order #{{order.number}} has been confirmed.</p>"
                  className={cn(inp, 'resize-y font-mono text-xs')}
                />
              </div>
              <div>
                <label className={lbl}>Plain Text Content (optional)</label>
                <textarea {...form.register('textContent')} rows={4} className={cn(inp, 'resize-none font-mono text-xs')} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" {...form.register('isActive')} className="w-4 h-4 rounded" />
                Enable this template
              </label>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
              {message ? (
                <p className={cn('text-sm', message.startsWith('Error') ? 'text-destructive' : 'text-green-600')}>{message}</p>
              ) : <div />}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Template
              </button>
            </div>
          </div>

          {/* Variables Reference */}
          <div className="bg-white rounded-xl border border-border shadow-sm p-5">
            <h4 className="font-semibold text-sm mb-3">Available Variables</h4>
            <p className="text-xs text-muted-foreground mb-3">Use these in subject and HTML content:</p>
            <div className="space-y-2">
              {AVAILABLE_VARIABLES.map(({ path, desc }) => (
                <div key={path} className="flex items-start gap-2">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono shrink-0">{path}</code>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
