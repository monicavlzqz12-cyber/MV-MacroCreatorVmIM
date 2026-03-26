'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, Plus, Pencil, Trash2, Package, ToggleLeft, ToggleRight } from 'lucide-react'

interface Collection {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isAutomatic: boolean
  isActive: boolean
  sortOrder: number
  _count: { products: number }
}

interface Props {
  params: { storeId: string }
}

const EMPTY_FORM = { name: '', slug: '', description: '', imageUrl: '', isAutomatic: false, isActive: true }

export default function CollectionsPage({ params }: Props) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCollections = useCallback(async () => {
    const res = await fetch(`/api/stores/${params.storeId}/collections`)
    const json = await res.json()
    setCollections(json.data ?? [])
  }, [params.storeId])

  useEffect(() => {
    fetchCollections().finally(() => setLoading(false))
  }, [fetchCollections])

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    setError(null)
  }

  const openEdit = (col: Collection) => {
    setEditingId(col.id)
    setForm({
      name: col.name,
      slug: col.slug,
      description: col.description ?? '',
      imageUrl: col.imageUrl ?? '',
      isAutomatic: col.isAutomatic,
      isActive: col.isActive,
    })
    setShowForm(true)
    setError(null)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    setError(null)
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        imageUrl: form.imageUrl || null,
        isAutomatic: form.isAutomatic,
        isActive: form.isActive,
      }
      const url = editingId
        ? `/api/stores/${params.storeId}/collections/${editingId}`
        : `/api/stores/${params.storeId}/collections`
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to save'); return }
      setShowForm(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      await fetchCollections()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Products will not be deleted.')) return
    await fetch(`/api/stores/${params.storeId}/collections/${id}`, { method: 'DELETE' })
    await fetchCollections()
  }

  const handleToggleActive = async (col: Collection) => {
    await fetch(`/api/stores/${params.storeId}/collections/${col.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !col.isActive }),
    })
    await fetchCollections()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Collections</h3>
          <p className="text-sm text-muted-foreground">{collections.length} total</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-4">
          <h4 className="text-sm font-semibold">{editingId ? 'Edit Collection' : 'New Collection'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })}
                placeholder="Summer Sale"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="summer-sale"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Optional description shown on the collection page"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Image URL</label>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAutomatic}
                  onChange={(e) => setForm({ ...form, isAutomatic: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">Automatic (rule-based)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-input"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.slug.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {editingId ? 'Save Changes' : 'Create Collection'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
              className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collections table */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        {collections.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Package className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No collections yet. Create one to group products.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {collections.map((col) => (
              <div key={col.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                {col.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={col.imageUrl} alt={col.name} className="w-10 h-10 rounded-lg object-cover bg-muted flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{col.name}</span>
                    {col.isAutomatic && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Auto</span>
                    )}
                    {!col.isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{col.slug}</p>
                  {col.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">{col.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="w-3 h-3" />
                  <span>{col._count.products} products</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(col)}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground"
                    title={col.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {col.isActive
                      ? <ToggleRight className="w-4 h-4 text-green-600" />
                      : <ToggleLeft className="w-4 h-4" />
                    }
                  </button>
                  <button onClick={() => openEdit(col)} className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(col.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
