'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'

interface VariantRow {
  name: string
  sku: string
  price: number
  compareAtPrice?: number
  inventoryCount?: number
  isDefault: boolean
}

interface ProductFormData {
  name: string
  slug: string
  description?: string
  shortDescription?: string
  status: string
  featured: boolean
  basePrice: number
  compareAtPrice?: number
  costPrice?: number
  sku?: string
  barcode?: string
  trackInventory: boolean
  inventoryCount?: number
  lowStockThreshold?: number
  allowBackorder: boolean
  isDigital: boolean
  imageUrls: string
  tags: string
  metaTitle?: string
  metaDescription?: string
  variants: VariantRow[]
}

interface Props {
  params: { storeId: string }
}

const TABS = ['General', 'Pricing', 'Inventory', 'Images', 'Variants', 'SEO']

export default function NewProductPage({ params }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('General')
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, control, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: {
      status: 'DRAFT',
      featured: false,
      trackInventory: false,
      allowBackorder: false,
      isDigital: false,
      basePrice: 0,
      variants: [],
    },
  })

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  })

  const nameValue = watch('name')
  const handleNameBlur = () => {
    const s = slugify(nameValue ?? '')
    if (s) setValue('slug', s)
  }

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null)
    try {
      const payload = {
        ...data,
        basePrice: Number(data.basePrice),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        inventoryCount: data.inventoryCount ? Number(data.inventoryCount) : undefined,
        lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined,
        images: data.imageUrls
          ? data.imageUrls.split('\n').map((url, i) => ({ url: url.trim(), sortOrder: i })).filter((img) => img.url)
          : [],
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        variants: data.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          inventoryCount: v.inventoryCount ? Number(v.inventoryCount) : undefined,
        })),
      }

      const res = await fetch(`/api/stores/${params.storeId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Failed to create product')
        return
      }
      router.push(`/stores/${params.storeId}/catalog/products/${json.data.id}`)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  const inp = 'w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white'
  const lbl = 'block text-sm font-medium mb-1.5'

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
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            {serverError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
                {serverError}
              </div>
            )}

            {/* GENERAL */}
            {activeTab === 'General' && (
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Product Name</label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    onBlur={handleNameBlur}
                    placeholder="My Product"
                    className={cn(inp, errors.name ? 'border-destructive' : '')}
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={lbl}>Slug</label>
                  <input
                    {...register('slug', { required: 'Slug is required' })}
                    placeholder="my-product"
                    className={cn(inp, 'font-mono text-xs', errors.slug ? 'border-destructive' : '')}
                  />
                </div>
                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Full product description..."
                    className={cn(inp, 'resize-none')}
                  />
                </div>
                <div>
                  <label className={lbl}>Short Description</label>
                  <textarea
                    {...register('shortDescription')}
                    rows={2}
                    placeholder="Brief summary..."
                    className={cn(inp, 'resize-none')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>Status</label>
                    <select {...register('status')} className={inp}>
                      <option value="DRAFT">Draft</option>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register('featured')} className="w-4 h-4 rounded" />
                  Featured product
                </label>
                <div>
                  <label className={lbl}>Tags (comma-separated)</label>
                  <input {...register('tags')} placeholder="summer, sale, new" className={inp} />
                </div>
              </div>
            )}

            {/* PRICING */}
            {activeTab === 'Pricing' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={lbl}>Base Price</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('basePrice', { required: true, valueAsNumber: true })}
                    className={cn(inp, errors.basePrice ? 'border-destructive' : '')}
                  />
                </div>
                <div>
                  <label className={lbl}>Compare At Price</label>
                  <input type="number" step="0.01" {...register('compareAtPrice', { valueAsNumber: true })} placeholder="0.00" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Cost Price</label>
                  <input type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} placeholder="0.00" className={inp} />
                </div>
              </div>
            )}

            {/* INVENTORY */}
            {activeTab === 'Inventory' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>SKU</label>
                    <input {...register('sku')} placeholder="PROD-001" className={cn(inp, 'font-mono text-xs')} />
                  </div>
                  <div>
                    <label className={lbl}>Barcode</label>
                    <input {...register('barcode')} placeholder="123456789" className={cn(inp, 'font-mono text-xs')} />
                  </div>
                  <div>
                    <label className={lbl}>Inventory Count</label>
                    <input type="number" {...register('inventoryCount', { valueAsNumber: true })} className={inp} />
                  </div>
                  <div>
                    <label className={lbl}>Low Stock Threshold</label>
                    <input type="number" {...register('lowStockThreshold', { valueAsNumber: true })} className={inp} />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register('trackInventory')} className="w-4 h-4 rounded" />
                    Track inventory
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register('allowBackorder')} className="w-4 h-4 rounded" />
                    Allow backorder
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" {...register('isDigital')} className="w-4 h-4 rounded" />
                    Digital product
                  </label>
                </div>
              </div>
            )}

            {/* IMAGES */}
            {activeTab === 'Images' && (
              <div>
                <label className={lbl}>Image URLs (one per line)</label>
                <textarea
                  {...register('imageUrls')}
                  rows={6}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  className={cn(inp, 'resize-y font-mono text-xs')}
                />
                <p className="text-xs text-muted-foreground mt-1">Each URL on a new line. First image is used as primary.</p>
              </div>
            )}

            {/* VARIANTS */}
            {activeTab === 'Variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Variants</h4>
                  <button
                    type="button"
                    onClick={() => appendVariant({ name: '', sku: '', price: 0, isDefault: variantFields.length === 0 })}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add variant
                  </button>
                </div>
                {variantFields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variants. Product uses base price.</p>
                )}
                <div className="space-y-3">
                  {variantFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-end p-3 border border-border rounded-xl">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Name</label>
                        <input {...register(`variants.${index}.name`)} placeholder="e.g. Red / L" className={inp} />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-medium mb-1">SKU</label>
                        <input {...register(`variants.${index}.sku`)} className={inp} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium mb-1">Price</label>
                        <input type="number" step="0.01" {...register(`variants.${index}.price`, { valueAsNumber: true })} className={inp} />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium mb-1">Stock</label>
                        <input type="number" {...register(`variants.${index}.inventoryCount`, { valueAsNumber: true })} className={inp} />
                      </div>
                      <label className="flex items-center gap-1 text-xs pb-2 whitespace-nowrap">
                        <input type="checkbox" {...register(`variants.${index}.isDefault`)} className="w-3 h-3" />
                        Default
                      </label>
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="pb-2 text-destructive hover:text-destructive/70"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO */}
            {activeTab === 'SEO' && (
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Meta Title</label>
                  <input {...register('metaTitle')} placeholder="Product title for search engines" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Meta Description</label>
                  <textarea {...register('metaDescription')} rows={3} placeholder="Product description for search engines" className={cn(inp, 'resize-none')} />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Product
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
