'use client'

import { useEffect, useReducer, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronRight, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/theme-utils'
import { CART_COOKIE } from '@/lib/cart-utils'

// ============================================================
// TYPES
// ============================================================

interface CheckoutFormData {
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  street: string
  street2: string
  city: string
  state: string
  zip: string
  country: string
  customerNotes: string
  billingSameAsShipping: boolean
}

interface FieldErrors {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

interface PaymentMethodItem {
  id: string
  name: string
  description: string | null
  type: string
  instructions: string | null
  templateBlocks: unknown
}

type Step = 'contact' | 'review'

// ============================================================
// FORM REDUCER
// ============================================================

type FormAction =
  | { type: 'SET_FIELD'; field: keyof CheckoutFormData; value: string | boolean }
  | { type: 'RESET' }

const initialForm: CheckoutFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  company: '',
  street: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  customerNotes: '',
  billingSameAsShipping: true,
}

function formReducer(state: CheckoutFormData, action: FormAction): CheckoutFormData {
  if (action.type === 'RESET') return initialForm
  return { ...state, [action.field]: action.value }
}

// ============================================================
// HELPERS
// ============================================================

function getCartToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${CART_COOKIE}=([^;]*)`))
  if (match?.[1]) return decodeURIComponent(match[1])
  try {
    return localStorage.getItem('sb_cart_token')
  } catch {
    return null
  }
}

function validateContactStep(form: CheckoutFormData, requirePhone: boolean): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Valid email is required'
  }
  if (!form.firstName.trim()) errors.firstName = 'First name is required'
  if (!form.lastName.trim()) errors.lastName = 'Last name is required'
  if (requirePhone && !form.phone.trim()) errors.phone = 'Phone is required'
  if (!form.street.trim()) errors.street = 'Street address is required'
  if (!form.city.trim()) errors.city = 'City is required'
  if (!form.state.trim()) errors.state = 'State is required'
  if (!form.zip.trim()) errors.zip = 'ZIP code is required'
  if (!form.country.trim() || form.country.trim().length !== 2) errors.country = 'Valid 2-letter country code required'
  return errors
}

// ============================================================
// STEP INDICATOR
// ============================================================

function StepIndicator({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'contact', label: 'Contact & Shipping' },
    { id: 'review', label: 'Review & Payment' },
  ]
  const currentIdx = steps.findIndex((s) => s.id === current)

  return (
    <nav className="flex items-center gap-0 mb-10">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center gap-0">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
              style={{
                backgroundColor:
                  idx < currentIdx
                    ? '#16a34a'
                    : idx === currentIdx
                      ? 'var(--store-primary)'
                      : '#E5E7EB',
                color: idx <= currentIdx ? '#ffffff' : '#9CA3AF',
              }}
            >
              {idx < currentIdx ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span
              className="text-sm font-medium hidden sm:block"
              style={{
                color:
                  idx === currentIdx
                    ? 'var(--store-primary)'
                    : idx < currentIdx
                      ? '#16a34a'
                      : '#9CA3AF',
              }}
            >
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && (
            <ChevronRight className="mx-3 text-gray-300 w-4 h-4" />
          )}
        </div>
      ))}
    </nav>
  )
}

// ============================================================
// INPUT COMPONENT
// ============================================================

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--store-text)' }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  hasError,
  maxLength,
  className = '',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  hasError?: boolean
  maxLength?: number
  className?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${className}`}
      style={{
        borderColor: hasError ? '#DC2626' : 'var(--store-border)',
        color: 'var(--store-text)',
        backgroundColor: 'var(--store-bg)',
      }}
    />
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { items, totals, cartConfig } = useCart()

  const [form, dispatch] = useReducer(formReducer, initialForm)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [step, setStep] = useState<Step>('contact')
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([])
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [checkoutConfig, setCheckoutConfig] = useState<{
    requirePhone?: boolean
    requireCompany?: boolean
    requireAddress?: boolean
    guestCheckout?: boolean
  } | null>(null)
  const [priceConfig, setPriceConfig] = useState<{
    currencySymbol: string
    currencyPosition: 'before' | 'after'
    currencyDecimals: number
  }>({ currencySymbol: '$', currencyPosition: 'before', currencyDecimals: 2 })

  const setField = (field: keyof CheckoutFormData, value: string | boolean) => {
    dispatch({ type: 'SET_FIELD', field, value })
    // Clear error on change
    if (field in errors) {
      setErrors((e) => { const n = { ...e }; delete n[field as keyof FieldErrors]; return n })
    }
  }

  // Load payment methods + store config
  useEffect(() => {
    const token = getCartToken()
    void fetch(`/api/${slug}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token ?? undefined }),
    })
      .then((r) => r.json())
      .then((data: {
        paymentMethods?: PaymentMethodItem[]
        storeConfig?: {
          currencySymbol: string
          currencyPosition: 'before' | 'after'
          currencyDecimals: number
          checkoutConfig?: {
            requirePhone?: boolean
            requireCompany?: boolean
            requireAddress?: boolean
            guestCheckout?: boolean
          }
        }
      }) => {
        if (data.paymentMethods) {
          setPaymentMethods(data.paymentMethods)
          if (data.paymentMethods[0]?.id) {
            setSelectedPaymentId(data.paymentMethods[0].id)
          }
        }
        if (data.storeConfig) {
          setPriceConfig({
            currencySymbol: data.storeConfig.currencySymbol,
            currencyPosition: data.storeConfig.currencyPosition,
            currencyDecimals: data.storeConfig.currencyDecimals,
          })
          if (data.storeConfig.checkoutConfig) {
            setCheckoutConfig(data.storeConfig.checkoutConfig)
          }
        }
      })
      .catch(() => null)
  }, [slug])

  // Redirect if cart is empty
  useEffect(() => {
    if (!items.length && !isSubmitting) {
      router.replace(`/${slug}/cart`)
    }
  }, [items.length, isSubmitting, router, slug])

  const requirePhone = checkoutConfig?.requirePhone ?? false
  const requireCompany = checkoutConfig?.requireCompany ?? false
  const requireAddress = checkoutConfig?.requireAddress !== false

  const handleContactContinue = () => {
    const fieldErrors = validateContactStep(form, requirePhone)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setStep('review')
  }

  const handlePlaceOrder = async () => {
    const token = getCartToken()
    if (!token) {
      setSubmitError('Cart session expired. Please refresh the page.')
      return
    }
    if (!selectedPaymentId) {
      setSubmitError('Please select a payment method.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const shippingAddress = {
        firstName: form.firstName,
        lastName: form.lastName,
        company: form.company || undefined,
        street: form.street,
        street2: form.street2 || undefined,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country.toUpperCase(),
        phone: form.phone || undefined,
      }

      const res = await fetch(`/api/${slug}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartToken: token,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
          company: form.company || undefined,
          shippingAddress,
          billingSameAsShipping: form.billingSameAsShipping,
          paymentMethodId: selectedPaymentId,
          customerNotes: form.customerNotes || undefined,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setSubmitError(result.message ?? 'Failed to place order. Please try again.')
        setIsSubmitting(false)
        return
      }

      router.push(`/${slug}/checkout/success?orderId=${result.orderId}`)
    } catch {
      setSubmitError('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (items.length === 0 && !isSubmitting) return null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--store-text)' }}>
        Checkout
      </h1>

      <StepIndicator current={step} />

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Main form */}
        <div>
          {step === 'contact' && (
            <div className="space-y-6">
              {/* Contact */}
              <fieldset className="border rounded-xl p-6 space-y-4" style={{ borderColor: 'var(--store-border)' }}>
                <legend className="text-sm font-semibold px-1" style={{ color: 'var(--store-text)' }}>
                  Contact Information
                </legend>

                <FormField label="Email Address" required error={errors.email}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(v) => setField('email', v)}
                    placeholder="you@example.com"
                    hasError={!!errors.email}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="First Name" required error={errors.firstName}>
                    <Input
                      value={form.firstName}
                      onChange={(v) => setField('firstName', v)}
                      placeholder="First name"
                      hasError={!!errors.firstName}
                    />
                  </FormField>
                  <FormField label="Last Name" required error={errors.lastName}>
                    <Input
                      value={form.lastName}
                      onChange={(v) => setField('lastName', v)}
                      placeholder="Last name"
                      hasError={!!errors.lastName}
                    />
                  </FormField>
                </div>

                {(requirePhone || true) && (
                  <FormField label="Phone" required={requirePhone} error={errors.phone}>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(v) => setField('phone', v)}
                      placeholder="+1 (555) 000-0000"
                      hasError={!!errors.phone}
                    />
                  </FormField>
                )}

                {requireCompany && (
                  <FormField label="Company">
                    <Input
                      value={form.company}
                      onChange={(v) => setField('company', v)}
                      placeholder="Company name"
                    />
                  </FormField>
                )}
              </fieldset>

              {/* Shipping address */}
              {requireAddress && (
                <fieldset className="border rounded-xl p-6 space-y-4" style={{ borderColor: 'var(--store-border)' }}>
                  <legend className="text-sm font-semibold px-1" style={{ color: 'var(--store-text)' }}>
                    Shipping Address
                  </legend>

                  <FormField label="Street Address" required error={errors.street}>
                    <Input
                      value={form.street}
                      onChange={(v) => setField('street', v)}
                      placeholder="123 Main St"
                      hasError={!!errors.street}
                    />
                  </FormField>

                  <FormField label="Apt, Suite, etc.">
                    <Input
                      value={form.street2}
                      onChange={(v) => setField('street2', v)}
                      placeholder="Apt, suite, floor"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" required error={errors.city}>
                      <Input
                        value={form.city}
                        onChange={(v) => setField('city', v)}
                        placeholder="City"
                        hasError={!!errors.city}
                      />
                    </FormField>
                    <FormField label="State / Province" required error={errors.state}>
                      <Input
                        value={form.state}
                        onChange={(v) => setField('state', v)}
                        placeholder="State"
                        hasError={!!errors.state}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="ZIP / Postal Code" required error={errors.zip}>
                      <Input
                        value={form.zip}
                        onChange={(v) => setField('zip', v)}
                        placeholder="ZIP"
                        hasError={!!errors.zip}
                      />
                    </FormField>
                    <FormField label="Country" required error={errors.country}>
                      <Input
                        value={form.country}
                        onChange={(v) => setField('country', v.toUpperCase())}
                        placeholder="US"
                        maxLength={2}
                        hasError={!!errors.country}
                        className="uppercase"
                      />
                    </FormField>
                  </div>
                </fieldset>
              )}

              {/* Order notes */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--store-text)' }}>
                  Order Notes (optional)
                </label>
                <textarea
                  value={form.customerNotes}
                  onChange={(e) => setField('customerNotes', e.target.value)}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none"
                  style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)', backgroundColor: 'var(--store-bg)' }}
                  placeholder="Any special instructions for your order?"
                />
              </div>

              <button
                type="button"
                onClick={handleContactContinue}
                className="w-full py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--store-primary)' }}
              >
                Continue to Review
              </button>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              {/* Order items summary */}
              <div className="border rounded-xl p-6" style={{ borderColor: 'var(--store-border)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--store-text)' }}>
                  Order Items ({totals.itemCount})
                </h3>
                <div className="space-y-3">
                  {items.map((item) => (
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
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--store-text)' }}>
                          {item.productName}
                        </p>
                        {item.variantName && (
                          <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
                            {item.variantName}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: 'var(--store-text-muted)' }}>
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--store-text)' }}>
                        {formatPrice(item.totalPrice, priceConfig)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping info summary */}
              <div className="border rounded-xl p-4" style={{ borderColor: 'var(--store-border)' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--store-text-muted)' }}>
                      Shipping To
                    </p>
                    <p className="text-sm" style={{ color: 'var(--store-text)' }}>
                      {form.firstName} {form.lastName}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--store-text-muted)' }}>
                      {form.street}{form.street2 ? `, ${form.street2}` : ''}, {form.city}, {form.state} {form.zip}, {form.country}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('contact')}
                    className="text-xs font-medium hover:underline"
                    style={{ color: 'var(--store-primary)' }}
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Payment methods */}
              {paymentMethods.length > 0 && (
                <div className="border rounded-xl p-6" style={{ borderColor: 'var(--store-border)' }}>
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--store-text)' }}>
                    Payment Method
                  </h3>
                  <div className="space-y-3">
                    {paymentMethods.map((pm) => (
                      <label
                        key={pm.id}
                        className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                        style={{
                          borderColor: selectedPaymentId === pm.id ? 'var(--store-primary)' : 'var(--store-border)',
                          backgroundColor:
                            selectedPaymentId === pm.id
                              ? 'color-mix(in srgb, var(--store-primary) 5%, transparent)'
                              : 'transparent',
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={selectedPaymentId === pm.id}
                          onChange={() => setSelectedPaymentId(pm.id)}
                          className="mt-0.5"
                          style={{ accentColor: 'var(--store-primary)' }}
                        />
                        <div>
                          <p className="font-medium text-sm" style={{ color: 'var(--store-text)' }}>
                            {pm.name}
                          </p>
                          {pm.description && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--store-text-muted)' }}>
                              {pm.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('contact')}
                  className="flex-1 py-3 rounded-lg font-medium border transition-colors hover:bg-gray-50"
                  style={{ borderColor: 'var(--store-border)', color: 'var(--store-text)' }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handlePlaceOrder()}
                  disabled={isSubmitting || !selectedPaymentId}
                  className="flex-1 py-3 rounded-lg font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--store-primary)' }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Placing Order…' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order summary sidebar */}
        <div
          className="rounded-xl border p-6 space-y-4 sticky top-24"
          style={{ borderColor: 'var(--store-border)', backgroundColor: 'var(--store-surface)' }}
        >
          <h2 className="font-semibold" style={{ color: 'var(--store-text)' }}>
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: 'var(--store-text-muted)' }}>Subtotal</span>
              <span style={{ color: 'var(--store-text)' }}>
                {formatPrice(totals.subtotal, priceConfig)}
              </span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--store-text-muted)' }}>Discount</span>
                <span style={{ color: 'var(--store-price-discount)' }}>
                  −{formatPrice(totals.discountAmount, priceConfig)}
                </span>
              </div>
            )}
            {totals.shippingAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--store-text-muted)' }}>Shipping</span>
                <span style={{ color: 'var(--store-text)' }}>
                  {formatPrice(totals.shippingAmount, priceConfig)}
                </span>
              </div>
            )}
            {totals.taxAmount > 0 && (
              <div className="flex justify-between">
                <span style={{ color: 'var(--store-text-muted)' }}>Tax</span>
                <span style={{ color: 'var(--store-text)' }}>
                  {formatPrice(totals.taxAmount, priceConfig)}
                </span>
              </div>
            )}
          </div>
          <div
            className="border-t pt-4 flex justify-between font-bold"
            style={{ borderColor: 'var(--store-border)' }}
          >
            <span style={{ color: 'var(--store-text)' }}>Total</span>
            <span style={{ color: 'var(--store-text)' }}>
              {formatPrice(totals.total, priceConfig)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
