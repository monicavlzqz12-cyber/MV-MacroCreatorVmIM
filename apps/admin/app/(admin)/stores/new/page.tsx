'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { cn, slugify } from '@/lib/utils'

const createStoreSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  domain: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE']).default('DRAFT'),
})

type CreateStoreFormData = z.infer<typeof createStoreSchema>

export default function NewStorePage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: { status: 'DRAFT' },
  })

  const nameValue = watch('name')

  const handleNameBlur = () => {
    const slug = slugify(nameValue ?? '')
    if (slug) setValue('slug', slug, { shouldValidate: true })
  }

  const onSubmit = async (data: CreateStoreFormData) => {
    setServerError(null)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        setServerError(json.error ?? 'Failed to create store')
        return
      }
      router.push(`/stores/${json.data.id}`)
    } catch {
      setServerError('Network error. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Create New Store</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Store Name</label>
            <input
              {...register('name')}
              onBlur={handleNameBlur}
              placeholder="My Awesome Store"
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                errors.name ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Slug</label>
            <input
              {...register('slug')}
              placeholder="my-awesome-store"
              className={cn(
                'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono',
                errors.slug ? 'border-destructive' : 'border-input',
              )}
            />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Custom Domain <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              {...register('domain')}
              placeholder="store.example.com"
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Brief description of this store..."
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Status</label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
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
              Create Store
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
