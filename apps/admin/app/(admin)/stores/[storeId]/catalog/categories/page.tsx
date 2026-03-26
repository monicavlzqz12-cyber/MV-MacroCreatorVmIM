'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryNode {
  id: string
  name: string
  slug: string
  parentId?: string | null
  sortOrder: number
  children: CategoryNode[]
}

interface Props {
  params: { storeId: string }
}

export default function CategoriesPage({ params }: Props) {
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formParentId, setFormParentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    const res = await fetch(`/api/stores/${params.storeId}/categories`)
    const json = await res.json()
    setCategories(json.data ?? [])
  }

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false))
  }, [params.storeId])

  const slugify = (text: string) =>
    text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const handleSaveNew = async () => {
    if (!formName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/stores/${params.storeId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, slug: formSlug || slugify(formName), parentId: formParentId || null }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Failed to create'); return }
      setShowNewForm(false)
      setFormName('')
      setFormSlug('')
      setFormParentId('')
      await fetchCategories()
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEdit = async (id: string, name: string, slug: string) => {
    setSaving(true)
    try {
      await fetch(`/api/stores/${params.storeId}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      setEditingId(null)
      await fetchCategories()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    await fetch(`/api/stores/${params.storeId}/categories/${id}`, { method: 'DELETE' })
    await fetchCategories()
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    await fetch(`/api/stores/${params.storeId}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move: direction }),
    })
    await fetchCategories()
  }

  const flatList: CategoryNode[] = []
  const flatten = (nodes: CategoryNode[], depth = 0) => {
    for (const node of nodes) {
      flatList.push({ ...node, sortOrder: depth })
      flatten(node.children, depth + 1)
    }
  }
  flatten(categories)

  if (loading) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Categories</h3>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* New Category Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
          <h4 className="text-sm font-semibold">New Category</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Name</label>
              <input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value)
                  setFormSlug(slugify(e.target.value))
                }}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Slug</label>
              <input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Parent (optional)</label>
              <select
                value={formParentId}
                onChange={(e) => setFormParentId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
              >
                <option value="">— No parent —</option>
                {flatList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveNew}
              disabled={saving || !formName.trim()}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
            <button
              onClick={() => { setShowNewForm(false); setFormName(''); setFormSlug('') }}
              className="px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category Tree */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        {flatList.length === 0 ? (
          <p className="px-5 py-6 text-sm text-center text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {flatList.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                depth={cat.sortOrder}
                isEditing={editingId === cat.id}
                onEdit={() => setEditingId(cat.id)}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={handleSaveEdit}
                onDelete={handleDelete}
                onMove={handleMove}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({
  category,
  depth,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onMove,
  saving,
}: {
  category: CategoryNode
  depth: number
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: (id: string, name: string, slug: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, direction: 'up' | 'down') => void
  saving: boolean
}) {
  const [editName, setEditName] = useState(category.name)
  const [editSlug, setEditSlug] = useState(category.slug)

  useEffect(() => {
    setEditName(category.name)
    setEditSlug(category.slug)
  }, [category])

  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors')} style={{ paddingLeft: `${depth * 24 + 16}px` }}>
      {isEditing ? (
        <>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            className="w-40 px-2 py-1 border border-input rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => onSaveEdit(category.id, editName, editSlug)}
            disabled={saving}
            className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={onCancelEdit} className="text-xs px-2 py-1 border border-border rounded hover:bg-muted">
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{category.name}</span>
          <span className="text-xs text-muted-foreground font-mono">{category.slug}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onMove(category.id, 'up')} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronUp className="w-3 h-3" /></button>
            <button onClick={() => onMove(category.id, 'down')} className="p-1 hover:bg-muted rounded text-muted-foreground"><ChevronDown className="w-3 h-3" /></button>
            <button onClick={onEdit} className="p-1 hover:bg-muted rounded text-muted-foreground"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDelete(category.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3 h-3" /></button>
          </div>
        </>
      )}
    </div>
  )
}
