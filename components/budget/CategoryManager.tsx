'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Tag, Pencil, Check } from 'lucide-react'
import type { Category } from '@/types'

interface CategoryManagerProps {
  categories: Category[]
  onClose: () => void
  onCategoriesChange: (categories: Category[]) => void
  getToken: () => Promise<string | null>
}

const COLORS = [
  '#ef4444','#f97316','#f59e0b','#eab308','#84cc16',
  '#22c55e','#10b981','#14b8a6','#06b6d4','#0ea5e9',
  '#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef',
  '#ec4899','#f43f5e','#fb7185','#fbbf24','#34d399',
  '#2dd4bf','#38bdf8','#818cf8','#c084fc','#f472b6',
  '#64748b','#78716c','#6b7280','#059669','#0284c7',
  '#7c3aed','#db2777','#dc2626','#d97706','#65a30d',
  '#0891b2','#4f46e5','#7c3aed','#c026d3','#e11d48',
]

const ICONS = [
  // Wohnen
  { name: 'home', label: '🏠' },
  { name: 'apartment', label: '🏢' },
  { name: 'furniture', label: '🛋️' },
  { name: 'tools', label: '🔧' },
  { name: 'garden', label: '🌱' },
  { name: 'cleaning', label: '🧹' },
  { name: 'electricity', label: '⚡' },
  { name: 'water', label: '💧' },
  { name: 'heating', label: '🔥' },
  { name: 'key', label: '🔑' },
  // Mobilität
  { name: 'car', label: '🚗' },
  { name: 'train', label: '🚆' },
  { name: 'bus', label: '🚌' },
  { name: 'bike', label: '🚲' },
  { name: 'fuel', label: '⛽' },
  { name: 'parking', label: '🅿️' },
  { name: 'travel', label: '✈️' },
  { name: 'ship', label: '🚢' },
  // Essen & Trinken
  { name: 'food', label: '🍔' },
  { name: 'restaurant', label: '🍽️' },
  { name: 'coffee', label: '☕' },
  { name: 'grocery', label: '🛒' },
  { name: 'wine', label: '🍷' },
  { name: 'cake', label: '🎂' },
  { name: 'pizza', label: '🍕' },
  { name: 'sushi', label: '🍱' },
  // Gesundheit
  { name: 'health', label: '🏥' },
  { name: 'medicine', label: '💊' },
  { name: 'doctor', label: '👨‍⚕️' },
  { name: 'dental', label: '🦷' },
  { name: 'glasses', label: '👓' },
  { name: 'gym', label: '💪' },
  { name: 'yoga', label: '🧘' },
  { name: 'spa', label: '💆' },
  // Versicherungen & Finanzen
  { name: 'insurance', label: '🛡️' },
  { name: 'bank', label: '🏦' },
  { name: 'savings', label: '💰' },
  { name: 'investment', label: '📈' },
  { name: 'tax', label: '📋' },
  { name: 'wallet', label: '👛' },
  { name: 'creditcard', label: '💳' },
  { name: 'coins', label: '🪙' },
  // Kommunikation & Tech
  { name: 'phone', label: '📱' },
  { name: 'internet', label: '🌐' },
  { name: 'laptop', label: '💻' },
  { name: 'tv', label: '📺' },
  { name: 'gaming', label: '🎮' },
  { name: 'camera', label: '📷' },
  { name: 'headphones', label: '🎧' },
  // Freizeit & Unterhaltung
  { name: 'entertainment', label: '🎬' },
  { name: 'music', label: '🎵' },
  { name: 'sport', label: '⚽' },
  { name: 'skiing', label: '⛷️' },
  { name: 'swimming', label: '🏊' },
  { name: 'hiking', label: '🥾' },
  { name: 'theater', label: '🎭' },
  { name: 'book', label: '📚' },
  { name: 'art', label: '🎨' },
  { name: 'concert', label: '🎤' },
  // Shopping & Kleidung
  { name: 'shopping', label: '🛍️' },
  { name: 'clothes', label: '👕' },
  { name: 'shoes', label: '👟' },
  { name: 'jewelry', label: '💍' },
  { name: 'watch', label: '⌚' },
  { name: 'bag', label: '👜' },
  // Familie & Soziales
  { name: 'family', label: '👨‍👩‍👧' },
  { name: 'baby', label: '🍼' },
  { name: 'school', label: '🏫' },
  { name: 'education', label: '🎓' },
  { name: 'gift', label: '🎁' },
  { name: 'pets', label: '🐾' },
  { name: 'dog', label: '🐶' },
  { name: 'cat', label: '🐱' },
  // Verschiedenes
  { name: 'tag', label: '🏷️' },
  { name: 'star', label: '⭐' },
  { name: 'heart', label: '❤️' },
  { name: 'sun', label: '☀️' },
  { name: 'moon', label: '🌙' },
  { name: 'leaf', label: '🍃' },
  { name: 'recycle', label: '♻️' },
  { name: 'charity', label: '🤝' },
  { name: 'church', label: '⛪' },
  { name: 'work', label: '💼' },
]

export function getIconEmoji(iconName: string): string {
  return ICONS.find((i) => i.name === iconName)?.label ?? '🏷️'
}

export function CategoryManager({ categories, onClose, onCategoriesChange, getToken }: CategoryManagerProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [icon, setIcon] = useState('tag')
  const [parentId, setParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editIcon, setEditIcon] = useState('')

  const topLevel = categories.filter((c) => !c.parentId)

  async function authFetch(url: string, options: RequestInit = {}) {
    const token = await getToken()
    return fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    })
  }

  function getNextAvailableColor(): string {
    const usedColors = new Set(categories.map((c) => c.color))
    return COLORS.find((c) => !usedColors.has(c)) ?? COLORS[categories.length % COLORS.length]
  }

  async function handleRecolor() {
    setLoading(true)
    try {
      const resp = await authFetch('/api/budget/categories/recolor', { method: 'POST' })
      if (!resp.ok) throw new Error('Fehler')
      const updated = await resp.json()
      onCategoriesChange(updated)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!name.trim()) { setError('Name eingeben'); return }
    // Auto-assign unique color if current color is taken
    const usedColors = new Set(categories.map((c) => c.color))
    const finalColor = usedColors.has(color) ? getNextAvailableColor() : color
    setLoading(true); setError('')
    try {
      const resp = await authFetch('/api/budget/categories', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), color: finalColor, icon, parentId: parentId || null }),
      })
      if (!resp.ok) throw new Error('Fehler')
      const newCat = await resp.json()
      onCategoriesChange([...categories, newCat])
      setName(''); setParentId('')
    } catch { setError('Kategorie konnte nicht erstellt werden.') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    try {
      await authFetch('/api/budget/categories', { method: 'DELETE', body: JSON.stringify({ id }) })
      onCategoriesChange(categories.filter((c) => c.id !== id && c.parentId !== id))
    } finally { setLoading(false) }
  }

  async function handleSaveEdit(id: string) {
    setLoading(true)
    try {
      const resp = await authFetch(`/api/budget/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, color: editColor, icon: editIcon }),
      })
      if (!resp.ok) throw new Error('Fehler')
      const updated = await resp.json()
      onCategoriesChange(categories.map((c) => c.id === id ? { ...c, ...updated } : c))
      setEditId(null)
    } finally { setLoading(false) }
  }

  function startEdit(cat: Category) {
    setEditId(cat.id); setEditName(cat.name); setEditColor(cat.color); setEditIcon(cat.icon || 'tag')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}><Tag className="w-5 h-5" /> Kategorien</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Add new */}
        <div className="bg-muted/40 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Neue Kategorie</p>
          <button onClick={handleRecolor} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 hover:bg-muted transition-all disabled:opacity-50">
            🎨 Farben neu zuweisen
          </button>
        </div>
          <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} placeholder="Name" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" autoFocus />
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Icon</p>
            <div className="max-h-32 overflow-y-auto bg-background/50 rounded-lg p-2">
              <div className="flex gap-1 flex-wrap">
                {ICONS.map((ic) => (
                  <button key={ic.name} onClick={() => setIcon(ic.name)} title={ic.name} className={`w-8 h-8 rounded-lg text-lg transition-all hover:scale-110 flex items-center justify-center ${icon === ic.name ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-muted'}`}>{ic.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Farbe</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => {
                const isUsed = categories.some((cat) => cat.color === c)
                return (
                  <button key={c} onClick={() => setColor(c)} title={isUsed ? 'Bereits verwendet' : ''} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${isUsed ? 'opacity-30 cursor-not-allowed' : ''}`} style={{ background: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }} />
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ausgegraut = bereits vergeben</p>
          </div>
          {topLevel.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Untergruppe von (optional)</p>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Keine (Hauptkategorie)</option>
                {topLevel.map((c) => <option key={c.id} value={c.id}>{getIconEmoji(c.icon)} {c.name}</option>)}
              </select>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={handleAdd} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </div>

        {/* Category list */}
        <div className="space-y-1">
          {topLevel.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Noch keine Kategorien.</p>}
          {topLevel.map((cat) => {
            const children = categories.filter((c) => c.parentId === cat.id)
            const isEditing = editId === cat.id
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/40 group">
                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 bg-transparent border-b border-border text-sm focus:outline-none" />
                      <div className="max-h-24 overflow-y-auto bg-background/50 rounded p-1">
                        <div className="flex gap-1 flex-wrap">
                          {ICONS.map((ic) => <button key={ic.name} onClick={() => setEditIcon(ic.name)} title={ic.name} className={`w-7 h-7 rounded text-base flex items-center justify-center ${editIcon === ic.name ? 'bg-primary/20 ring-1 ring-primary' : 'hover:bg-muted'}`}>{ic.label}</button>)}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLORS.map((c) => <button key={c} onClick={() => setEditColor(c)} className="w-5 h-5 rounded-full" style={{ background: c, outline: editColor === c ? `2px solid ${c}` : 'none', outlineOffset: '1px' }} />)}
                      </div>
                      <button onClick={() => handleSaveEdit(cat.id)} className="text-accent p-1"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="text-muted-foreground p-1"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-base">{getIconEmoji(cat.icon)}</span>
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="flex-1 text-sm font-medium">{cat.name}</span>
                      <button onClick={() => startEdit(cat)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
                {children.map((child) => (
                  <div key={child.id} className="flex items-center gap-3 py-1.5 px-2 pl-8 rounded-lg hover:bg-muted/40 group">
                    <span className="text-sm">{getIconEmoji(child.icon)}</span>
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: child.color }} />
                    <span className="flex-1 text-sm text-muted-foreground">{child.name}</span>
                    <button onClick={() => handleDelete(child.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
