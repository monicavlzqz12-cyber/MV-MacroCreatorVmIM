'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = ['Branding', 'Commerce', 'SEO', 'Contact', 'Checkout', 'SMTP']

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Raleway', 'Nunito', 'Merriweather', 'Playfair Display', 'Georgia', 'Times New Roman',
]

const BORDER_RADIUS_OPTIONS = ['sm', 'md', 'lg', 'xl', 'full']
const WEIGHT_UNITS = ['kg', 'lb', 'g', 'oz']
const DIMENSION_UNITS = ['cm', 'in']

interface ConfigFormData {
  logoUrl?: string
  faviconUrl?: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  surfaceColor: string
  fontHeading: string
  fontBody: string
  borderRadius: string
  currency: string
  currencySymbol: string
  currencyPosition: string
  currencyDecimals: number
  language: string
  country: string
  timezone: string
  weightUnit: string
  dimensionUnit: string
  metaTitle?: string
  metaDescription?: string
  ogImageUrl?: string
  contactEmail?: string
  contactPhone?: string
  addressStreet?: string
  addressCity?: string
  addressState?: string
  addressZip?: string
  addressCountry?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  checkoutGuestCheckout: boolean
  checkoutRequirePhone: boolean
  checkoutRequireCompany: boolean
  checkoutTermsUrl?: string
  checkoutPrivacyUrl?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure: boolean
  smtpUser?: string
  smtpPassword?: string
  emailFromName?: string
  emailFromAddress?: string
}

interface Props {
  params: { storeId: string }
}

export default function StoreConfigPage({ params }: Props) {
  const [activeTab, setActiveTab] = useState('Branding')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testEmailSending, setTestEmailSending] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null)
  const metaTitleRef = useRef<HTMLInputElement | null>(null)
  const metaDescRef = useRef<HTMLTextAreaElement | null>(null)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ConfigFormData>({
    defaultValues: {
      primaryColor: '#111827',
      secondaryColor: '#6B7280',
      accentColor: '#2563EB',
      backgroundColor: '#FFFFFF',
      surfaceColor: '#F9FAFB',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      borderRadius: 'md',
      currency: 'USD',
      currencySymbol: '$',
      currencyPosition: 'before',
      currencyDecimals: 2,
      language: 'en',
      country: 'US',
      timezone: 'UTC',
      weightUnit: 'kg',
      dimensionUnit: 'cm',
      checkoutGuestCheckout: true,
      checkoutRequirePhone: false,
      checkoutRequireCompany: false,
      smtpSecure: false,
    },
  })

  const metaTitle = watch('metaTitle') ?? ''
  const metaDescription = watch('metaDescription') ?? ''

  useEffect(() => {
    fetch(`/api/stores/${params.storeId}/config`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const cfg = json.data
          reset({
            logoUrl: cfg.logoUrl ?? '',
            faviconUrl: cfg.faviconUrl ?? '',
            primaryColor: cfg.primaryColor ?? '#111827',
            secondaryColor: cfg.secondaryColor ?? '#6B7280',
            accentColor: cfg.accentColor ?? '#2563EB',
            backgroundColor: cfg.backgroundColor ?? '#FFFFFF',
            surfaceColor: cfg.surfaceColor ?? '#F9FAFB',
            fontHeading: cfg.fontHeading ?? 'Inter',
            fontBody: cfg.fontBody ?? 'Inter',
            borderRadius: cfg.borderRadius ?? 'md',
            currency: cfg.currency ?? 'USD',
            currencySymbol: cfg.currencySymbol ?? '$',
            currencyPosition: cfg.currencyPosition ?? 'before',
            currencyDecimals: cfg.currencyDecimals ?? 2,
            language: cfg.language ?? 'en',
            country: cfg.country ?? 'US',
            timezone: cfg.timezone ?? 'UTC',
            weightUnit: cfg.weightUnit ?? 'kg',
            dimensionUnit: cfg.dimensionUnit ?? 'cm',
            metaTitle: cfg.metaTitle ?? '',
            metaDescription: cfg.metaDescription ?? '',
            ogImageUrl: cfg.ogImageUrl ?? '',
            contactEmail: cfg.contactEmail ?? '',
            contactPhone: cfg.contactPhone ?? '',
            addressStreet: cfg.address?.street ?? '',
            addressCity: cfg.address?.city ?? '',
            addressState: cfg.address?.state ?? '',
            addressZip: cfg.address?.zip ?? '',
            addressCountry: cfg.address?.country ?? '',
            facebookUrl: cfg.socialLinks?.facebook ?? '',
            instagramUrl: cfg.socialLinks?.instagram ?? '',
            twitterUrl: cfg.socialLinks?.twitter ?? '',
            checkoutGuestCheckout: cfg.checkoutConfig?.guestCheckout ?? true,
            checkoutRequirePhone: cfg.checkoutConfig?.requirePhone ?? false,
            checkoutRequireCompany: cfg.checkoutConfig?.requireCompany ?? false,
            checkoutTermsUrl: cfg.checkoutConfig?.termsUrl ?? '',
            checkoutPrivacyUrl: cfg.checkoutConfig?.privacyUrl ?? '',
            emailFromName: cfg.emailFromName ?? '',
            emailFromAddress: cfg.emailFromAddress ?? '',
          })
        }
      })
      .finally(() => setLoading(false))
  }, [params.storeId, reset])

  const onSubmit = async (data: ConfigFormData) => {
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const payload = {
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        backgroundColor: data.backgroundColor,
        surfaceColor: data.surfaceColor,
        fontHeading: data.fontHeading,
        fontBody: data.fontBody,
        borderRadius: data.borderRadius,
        currency: data.currency,
        currencySymbol: data.currencySymbol,
        currencyPosition: data.currencyPosition,
        currencyDecimals: Number(data.currencyDecimals),
        language: data.language,
        country: data.country,
        timezone: data.timezone,
        weightUnit: data.weightUnit,
        dimensionUnit: data.dimensionUnit,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        ogImageUrl: data.ogImageUrl || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        address: data.addressStreet ? {
          street: data.addressStreet,
          city: data.addressCity,
          state: data.addressState,
          zip: data.addressZip,
          country: data.addressCountry,
        } : null,
        socialLinks: {
          facebook: data.facebookUrl || null,
          instagram: data.instagramUrl || null,
          twitter: data.twitterUrl || null,
        },
        checkoutConfig: {
          guestCheckout: data.checkoutGuestCheckout,
          requirePhone: data.checkoutRequirePhone,
          requireCompany: data.checkoutRequireCompany,
          termsUrl: data.checkoutTermsUrl || null,
          privacyUrl: data.checkoutPrivacyUrl || null,
        },
        emailFromName: data.emailFromName || null,
        emailFromAddress: data.emailFromAddress || null,
        smtp: data.smtpHost ? {
          host: data.smtpHost,
          port: Number(data.smtpPort ?? 587),
          secure: data.smtpSecure,
          user: data.smtpUser,
          password: data.smtpPassword,
          fromName: data.emailFromName,
          fromAddress: data.emailFromAddress,
        } : undefined,
      }

      const res = await fetch(`/api/stores/${params.storeId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save')
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    setTestEmailSending(true)
    setTestEmailResult(null)
    try {
      const res = await fetch(`/api/stores/${params.storeId}/config/smtp-test`, {
        method: 'POST',
      })
      const json = await res.json()
      setTestEmailResult(json.success ? 'Test email sent successfully!' : `Failed: ${json.error}`)
    } finally {
      setTestEmailSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const inputClass = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const labelClass = 'block text-sm font-medium mb-1.5'

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-border shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-border px-4 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {/* --- BRANDING --- */}
            {activeTab === 'Branding' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Logo URL</label>
                    <input {...register('logoUrl')} placeholder="https://..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Favicon URL</label>
                    <input {...register('faviconUrl')} placeholder="https://..." className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {(['primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor', 'surfaceColor'] as const).map((field) => (
                    <div key={field}>
                      <label className={labelClass}>
                        {field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                      </label>
                      <div className="flex items-center gap-2">
                        <input type="color" {...register(field)} className="w-10 h-9 rounded border border-input cursor-pointer" />
                        <input {...register(field)} className={cn(inputClass, 'flex-1 font-mono text-xs')} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Heading Font</label>
                    <select {...register('fontHeading')} className={cn(inputClass)}>
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Body Font</label>
                    <select {...register('fontBody')} className={cn(inputClass)}>
                      {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Border Radius</label>
                    <select {...register('borderRadius')} className={cn(inputClass)}>
                      {BORDER_RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* --- COMMERCE --- */}
            {activeTab === 'Commerce' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Currency Code</label>
                  <input {...register('currency')} placeholder="USD" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Currency Symbol</label>
                  <input {...register('currencySymbol')} placeholder="$" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Symbol Position</label>
                  <select {...register('currencyPosition')} className={inputClass}>
                    <option value="before">Before ($ 10.00)</option>
                    <option value="after">After (10.00 $)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Decimal Places</label>
                  <input type="number" {...register('currencyDecimals', { valueAsNumber: true })} min={0} max={4} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Language</label>
                  <input {...register('language')} placeholder="en" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input {...register('country')} placeholder="US" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Timezone</label>
                  <input {...register('timezone')} placeholder="UTC" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Weight Unit</label>
                  <select {...register('weightUnit')} className={inputClass}>
                    {WEIGHT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dimension Unit</label>
                  <select {...register('dimensionUnit')} className={inputClass}>
                    {DIMENSION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* --- SEO --- */}
            {activeTab === 'SEO' && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium">Meta Title</label>
                    <span className={cn('text-xs', metaTitle.length > 70 ? 'text-destructive' : 'text-muted-foreground')}>
                      {metaTitle.length}/70
                    </span>
                  </div>
                  <input
                    {...register('metaTitle')}
                    ref={(e) => {
                      register('metaTitle').ref(e)
                      metaTitleRef.current = e
                    }}
                    placeholder="Store title for search engines..."
                    className={cn(inputClass, metaTitle.length > 70 ? 'border-destructive' : '')}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium">Meta Description</label>
                    <span className={cn('text-xs', metaDescription.length > 160 ? 'text-destructive' : 'text-muted-foreground')}>
                      {metaDescription.length}/160
                    </span>
                  </div>
                  <textarea
                    {...register('metaDescription')}
                    rows={3}
                    placeholder="Store description for search engines..."
                    className={cn(inputClass, 'resize-none', metaDescription.length > 160 ? 'border-destructive' : '')}
                  />
                </div>
                <div>
                  <label className={labelClass}>OG Image URL</label>
                  <input {...register('ogImageUrl')} placeholder="https://..." className={inputClass} />
                </div>
              </div>
            )}

            {/* --- CONTACT --- */}
            {activeTab === 'Contact' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Contact Email</label>
                    <input type="email" {...register('contactEmail')} placeholder="hello@store.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input {...register('contactPhone')} placeholder="+1 555 000 0000" className={inputClass} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Street</label>
                      <input {...register('addressStreet')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input {...register('addressCity')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>State / Region</label>
                      <input {...register('addressState')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>ZIP / Postal Code</label>
                      <input {...register('addressZip')} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Country</label>
                      <input {...register('addressCountry')} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Social Links</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelClass}>Facebook</label>
                      <input {...register('facebookUrl')} placeholder="https://facebook.com/..." className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Instagram</label>
                      <input {...register('instagramUrl')} placeholder="https://instagram.com/..." className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Twitter / X</label>
                      <input {...register('twitterUrl')} placeholder="https://twitter.com/..." className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- CHECKOUT --- */}
            {activeTab === 'Checkout' && (
              <div className="space-y-5">
                <div className="space-y-3">
                  {[
                    { name: 'checkoutGuestCheckout' as const, label: 'Allow guest checkout' },
                    { name: 'checkoutRequirePhone' as const, label: 'Require phone number' },
                    { name: 'checkoutRequireCompany' as const, label: 'Require company name' },
                  ].map(({ name, label }) => (
                    <label key={name} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register(name)} className="w-4 h-4 rounded" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Terms & Conditions URL</label>
                    <input {...register('checkoutTermsUrl')} placeholder="https://..." className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Privacy Policy URL</label>
                    <input {...register('checkoutPrivacyUrl')} placeholder="https://..." className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* --- SMTP --- */}
            {activeTab === 'SMTP' && (
              <div className="space-y-5">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-3 text-sm">
                  SMTP credentials are stored AES-256-GCM encrypted. Password is never exposed in plaintext after saving.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className={labelClass}>SMTP Host</label>
                    <input {...register('smtpHost')} placeholder="smtp.example.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Port</label>
                    <input type="number" {...register('smtpPort', { valueAsNumber: true })} placeholder="587" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Username</label>
                    <input {...register('smtpUser')} placeholder="user@example.com" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <input type="password" {...register('smtpPassword')} placeholder="••••••••" className={inputClass} />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input type="checkbox" {...register('smtpSecure')} className="w-4 h-4 rounded" />
                      <span className="text-sm">Use TLS/SSL</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>From Name</label>
                    <input {...register('emailFromName')} placeholder="My Store" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>From Email</label>
                    <input type="email" {...register('emailFromAddress')} placeholder="no-reply@store.com" className={inputClass} />
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={testEmailSending}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50 transition-colors"
                  >
                    {testEmailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Test Email
                  </button>
                  {testEmailResult && (
                    <p className={cn('mt-2 text-sm', testEmailResult.startsWith('Test') ? 'text-green-600' : 'text-destructive')}>
                      {testEmailResult}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
            {saveSuccess && <p className="text-sm text-green-600">Saved successfully!</p>}
            {!saveError && !saveSuccess && <div />}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
