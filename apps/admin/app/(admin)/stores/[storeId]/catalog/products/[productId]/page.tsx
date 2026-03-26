'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'

interface VariantRow {
  id?: string
  name: string
  sku: string
  price: number
  compareAtPrice?: number
  inventoryCount?: number
  isDefault: boolean
  isActive: boolean
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
  relatedProductIds: string
  publishedAt?: string
  variants: VariantRow[]
}

const TABS = ['General', 'Pricing', 'Inventory', 'Images', 'Variants', 'SEO', 'Relations']

interface Props {
  params: { storeId: string; productId: string }
}

export default function EditProductPage({ params }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('General')
  const [loading, setLoading] = useState(true)
  const [serverError, setServerError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
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

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: 'variants' })
  const nameValue = watch('name')

  useEffect(() => {
    fetch(`/api/stores/${params.storeId}/products/${params.productId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const p = json.data
          reset({
            name: p.name,
            slug: p.slug,
            description: p.description ?? '',
            shortDescription: p.shortDescription ?? '',
            status: p.status,
            featured: p.featured,
            basePrice: p.basePrice,
            compareAtPrice: p.compareAtPrice ?? undefined,
            sku: p.sku ?? '',
            barcode: p.barcode ?? '',
            trackInventory: p.trackInventory,
            inventoryCount: p.inventoryCount ?? undefined,
            allowBackorder: p.allowBackorder,
            isDigital: p.isDigital,
            imageUrls: (p.images ?? []).map((img: { url: string }) => img.url).join('\n'),
            tags: (p.tags ?? []).join(', '),
            metaTitle: p.metaTitle ?? '',
            metaDescription: p.metaDescription ?? '',
            relatedProductIds: (p.relatedProductIds ?? []).join(', '),
            publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString().split('T')[0] : '',
            variants: (p.variants ?? []).map((v: VariantRow) => ({
              id: v.id,
              name: v.name,
              sku: v.sku ?? '',
              price: v.price,
              compareAtPrice: v.compareAtPrice,
              inventoryCount: v.inventoryCount,
              isDefault: v.isDefault,
              isActive: v.isActive ?? true,
            })),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [params, reset])

  const handleNameBlur = () => {
    const s = slugify(nameValue ?? '')
    if (s) setValue('slug', s)
  }

  const onSubmit = async (data: ProductFormData) => {
    setServerError(null)
    setSaveSuccess(false)
    try {
      const payload = {
        ...data,
        basePrice: Number(data.basePrice),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        inventoryCount: data.inventoryCount ? Number(data.inventoryCount) : undefined,
        images: data.imageUrls
          ? data.imageUrls.split('\n').map((url, i) => ({ url: url.trim(), sortOrder: i })).filter((img) => img.url)
          : [],
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        relatedProductIds: data.relatedProductIds ? data.relatedProductIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
        variants: data.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : undefined,
          inventoryCount: v.inventoryCount ? Number(v.inventoryCount) : undefined,
        })),
      }

      const res = await fetch(`/api/stores/${params.storeId}/products/${params.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Failed to save')
      } else {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch {
      setServerError('Network error.')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Archive this product? It will no longer be visible.')) return
    setDeleting(true)
    try {
      await fetch(`/api/stores/${params.storeId}/products/${params.productId}`, { method: 'DELETE' })
      router.push(`/stores/${params.storeId}/catalog/products`)
    } finally {
      setDeleting(false)
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
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">{serverError}</div>
            )}

            {/* GENERAL */}
            {activeTab === 'General' && (
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Product Name</label>
                  <input {...register('name', { required: true })} onBlur={handleNameBlur} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Slug</label>
                  <input {...register('slug', { required: true })} className={cn(inp, 'font-mono text-xs')} />
                </div>
                <div>
                  <label className={lbl}>Description</label>
                  <textarea {...register('description')} rows={5} className={cn(inp, 'resize-none')} />
                </div>
                <div>
                  <label className={lbl}>Short Description</label>
                  <textarea {...register('shortDescription')} rows={2} className={cn(inp, 'resize-none')} />
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
                  <div>
                    <label className={lbl}>Published At</label>
                    <input type="date" {...register('publishedAt')} className={inp} />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...register('featured')} className="w-4 h-4 rounded" />
                  Featured product
                </label>
                <div>
                  <label className={lbl}>Tags</label>
                  <input {...register('tags')} placeholder="summer, sale, new" className={inp} />
                </div>
              </div>
            )}

            {/* PRICING */}
            {activeTab === 'Pricing' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={lbl}>Base Price</label>
                  <input type="number" step="0.01" {...register('basePrice', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Compare At Price</label>
                  <input type="number" step="0.01" {...register('compareAtPrice', { valueAsNumber: true })} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Cost Price</label>
                  <input type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} className={inp} />
                </div>
              </div>
            )}

            {/* INVENTORY */}
            {activeTab === 'Inventory' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={lbl}>SKU</label>
                    <input {...register('sku')} className={cn(inp, 'font-mono text-xs')} />
                  </div>
                  <div>
                    <label className={lbl}>Barcode</label>
                    <input {...register('barcode')} className={cn(inp, 'font-mono text-xs')} />
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
                <textarea {...register('imageUrls')} rows={6} className={cn(inp, 'resize-y font-mono text-xs')} />
              </div>
            )}

            {/* VARIANTS */}
            {activeTab === 'Variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Variants</h4>
                  <button
                    type="button"
                    onClick={() => appendVariant({ name: '', sku: '', price: 0, isDefault: variantFields.length === 0, isActive: true })}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add variant
                  </button>
                </div>
                <div className="space-y-3">
                  {variantFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-end p-3 border border-border rounded-xl">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Name</label>
                        <input {...register(`variants.${index}.name`)} className={inp} />
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
                      <label className="flex items-center gap-1 text-xs pb-2 whitespace-nowrap">
                        <input type="checkbox" {...register(`variants.${index}.isActive`)} className="w-3 h-3" />
                        Active
                      </label>
                      <button type="button" onClick={() => removeVariant(index)} className="pb-2 text-destructive hover:text-destructive/70">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {variantFields.length === 0 && <p className="text-sm text-muted-foreground">No variants. Product uses base price.</p>}
                </div>
              </div>
            )}

            {/* SEO */}
            {activeTab === 'SEO' && (
              <div className="space-y-5">
                <div>
                  <label className={lbl}>Meta Title</label>
                  <input {...register('metaTitle')} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Meta Description</label>
                  <textarea {...register('metaDescription')} rows={3} className={cn(inp, 'resize-none')} />
                </div>
              </div>
            )}

            {/* RELATIONS */}
            {activeTab === 'Relations' && (
              <div>
                <label className={lbl}>Related Product IDs (comma-separated)</label>
                <input {...register('relatedProductIds')} placeholder="id1, id2, id3" className={inp} />
                <p className="text-xs text-muted-foreground mt-1">Product IDs to show as related on the product page.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
            <div>
              {saveSuccess && <p className="text-sm text-green-600">Saved successfully!</p>}
              {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-destructive/30 shadow-sm p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-destructive">Danger Zone</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Archiving a product removes it from the storefront. This action can be reversed by changing the status back.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="mt-3 flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive hover:text-white disabled:opacity-50 transition-colors"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Archive Product
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
