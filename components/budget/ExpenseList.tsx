'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Pencil, Trash2, Check, X, Tag } from 'lucide-react'
import { formatCHF, frequencyLabel, expenseTypeLabel, toMonthly, getEffectiveExpenseAmount, calculateYearlyWithSplit, applyDiscount, applyFactor } from '@/lib/budget'

const ICON_MAP: Record<string, string> = { home:'🏠', apartment:'🏢', furniture:'🛋️', tools:'🔧', garden:'🌱', cleaning:'🧹', electricity:'⚡', water:'💧', heating:'🔥', key:'🔑', car:'🚗', train:'🚆', bus:'🚌', bike:'🚲', fuel:'⛽', parking:'🅿️', travel:'✈️', ship:'🚢', food:'🍔', restaurant:'🍽️', coffee:'☕', grocery:'🛒', wine:'🍷', cake:'🎂', pizza:'🍕', sushi:'🍱', health:'🏥', medicine:'💊', doctor:'👨‍⚕️', dental:'🦷', glasses:'👓', gym:'💪', yoga:'🧘', spa:'💆', insurance:'🛡️', bank:'🏦', savings:'💰', investment:'📈', tax:'📋', wallet:'👛', creditcard:'💳', coins:'🪙', phone:'📱', internet:'🌐', laptop:'💻', tv:'📺', gaming:'🎮', camera:'📷', headphones:'🎧', entertainment:'🎬', music:'🎵', sport:'⚽', skiing:'⛷️', swimming:'🏊', hiking:'🥾', theater:'🎭', book:'📚', art:'🎨', concert:'🎤', shopping:'🛍️', clothes:'👕', shoes:'👟', jewelry:'💍', watch:'⌚', bag:'👜', family:'👨‍👩‍👧', baby:'🍼', school:'🏫', education:'🎓', gift:'🎁', pets:'🐾', dog:'🐶', cat:'🐱', tag:'🏷️', star:'⭐', heart:'❤️', sun:'☀️', moon:'🌙', leaf:'🍃', recycle:'♻️', charity:'🤝', church:'⛪', work:'💼' }
function getIconEmoji(icon: string) { return ICON_MAP[icon] ?? '🏷️' }
import type { Expense, Category, Frequency, ExpenseType } from '@/types'

interface ExpenseListProps {
  expenses: Expense[]
  categories: Category[]
  onUpdate: (id: string, data: Partial<Expense>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

interface EditState {
  id: string
  name: string
  amount: string
  frequency: Frequency
  type: ExpenseType
  categoryId: string
  discountPct: string
  factor: string
  monthSplitFrom: string
  monthSplitAmount: string
  monthSplitFactor: string
}

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

export function ExpenseList({ expenses, categories, onUpdate, onDelete }: ExpenseListProps) {
  const [editId, setEditId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const grouped = new Map<string, { category?: Category; expenses: Expense[] }>()
  const uncategorized: Expense[] = []

  for (const expense of expenses) {
    if (expense.categoryId && expense.category) {
      const key = expense.category.parentId ?? expense.categoryId
      if (!grouped.has(key)) {
        const parent = expense.category.parentId
          ? categories.find((c) => c.id === expense.category?.parentId)
          : expense.category
        grouped.set(key, { category: parent ?? expense.category, expenses: [] })
      }
      grouped.get(key)!.expenses.push(expense)
    } else {
      uncategorized.push(expense)
    }
  }

  function startEdit(expense: Expense) {
    setEditId(expense.id)
    setEditState({
      id: expense.id,
      name: expense.name,
      amount: String(expense.amount),
      frequency: expense.frequency,
      type: expense.type,
      categoryId: expense.categoryId ?? '',
      discountPct: String(expense.discountPct ?? 0),
      factor: String(expense.factor ?? 1),
      monthSplitFrom: expense.monthSplitFrom ? String(expense.monthSplitFrom) : '',
      monthSplitAmount: expense.monthSplitAmount ? String(expense.monthSplitAmount) : '',
      monthSplitFactor: expense.monthSplitFactor ? String(expense.monthSplitFactor) : '',
    })
  }

  async function saveEdit() {
    if (!editState) return
    await onUpdate(editState.id, {
      name: editState.name,
      amount: parseFloat(editState.amount),
      frequency: editState.frequency,
      type: editState.type,
      categoryId: editState.categoryId || undefined,
      discountPct: parseInt(editState.discountPct) || 0,
      factor: parseFloat(editState.factor) || 1,
      monthSplitFrom: editState.monthSplitFrom ? parseInt(editState.monthSplitFrom) : undefined,
      monthSplitAmount: editState.monthSplitAmount ? parseFloat(editState.monthSplitAmount) : undefined,
      monthSplitFactor: editState.monthSplitFactor ? parseFloat(editState.monthSplitFactor) : undefined,
    })
    setEditId(null)
    setEditState(null)
  }

  const typeBadgeClass: Record<ExpenseType, string> = {
    fixed: 'badge-fixed',
    estimate: 'badge-estimate',
    savings: 'badge-savings',
  }

  function getEffectiveMonthly(expense: Expense): number {
    const effective = getEffectiveExpenseAmount(expense)
    if (expense.monthSplitFrom && expense.monthSplitAmount !== undefined) {
      const splitEffective = applyFactor(applyDiscount(expense.monthSplitAmount, expense.discountPct), expense.monthSplitFactor ?? expense.factor)
      const yearly = calculateYearlyWithSplit(effective, expense.monthSplitFrom, splitEffective, expense.frequency)
      return yearly / 12
    }
    return toMonthly(effective, expense.frequency)
  }

  function renderExpense(expense: Expense) {
    const isEditing = editId === expense.id
    const discount = expense.discountPct ?? 0
    const factor = expense.factor ?? 1
    const effectiveAmount = getEffectiveExpenseAmount(expense)
    const effectiveMonthly = getEffectiveMonthly(expense)
    const hasSplit = expense.monthSplitFrom && expense.monthSplitAmount !== undefined

    if (isEditing && editState) {
      const baseAmount = parseFloat(editState.amount) || 0
      const disc = parseInt(editState.discountPct) || 0
      const fac = parseFloat(editState.factor) || 1
      const splitFac = parseFloat(editState.monthSplitFactor) || fac
      const previewAmount = applyFactor(applyDiscount(baseAmount, disc), fac)
      const previewSplit = editState.monthSplitAmount
        ? applyFactor(applyDiscount(parseFloat(editState.monthSplitAmount) || 0, disc), splitFac)
        : null

      return (
        <div key={expense.id} className="py-3 px-3 bg-muted/40 rounded-lg space-y-3">
          {/* Row 1: Name + Type + Category + Frequency */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              value={editState.name}
              onChange={(e) => setEditState({ ...editState, name: e.target.value })}
              className="flex-1 min-w-40 bg-transparent border-b border-border text-sm focus:outline-none focus:border-primary"
              autoFocus
              placeholder="Name"
            />
            <select value={editState.type} onChange={(e) => setEditState({ ...editState, type: e.target.value as ExpenseType })} className="bg-background border border-border rounded text-xs px-1 py-1">
              <option value="fixed">Fixkosten</option>
              <option value="estimate">Prognose</option>
              <option value="savings">Sparen</option>
            </select>
            <select value={editState.categoryId} onChange={(e) => setEditState({ ...editState, categoryId: e.target.value })} className="bg-background border border-border rounded text-xs px-1 py-1 max-w-32">
              <option value="">Keine Kategorie</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={editState.frequency} onChange={(e) => setEditState({ ...editState, frequency: e.target.value as Frequency })} className="bg-background border border-border rounded text-xs px-1 py-1">
              <option value="monthly">monatlich</option>
              <option value="yearly">jährlich</option>
              <option value="once">einmalig</option>
            </select>
          </div>

          {/* Row 2: Amount + Discount + Factor */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Betrag CHF</span>
              <input type="number" value={editState.amount} onChange={(e) => setEditState({ ...editState, amount: e.target.value })} className="w-24 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Rabatt %</span>
              <input type="number" min={0} max={100} value={editState.discountPct} onChange={(e) => setEditState({ ...editState, discountPct: e.target.value })} className="w-12 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Faktor</span>
              <input type="number" min={0} max={10} step={0.1} value={editState.factor} onChange={(e) => setEditState({ ...editState, factor: e.target.value })} className="w-14 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
            </div>
            {previewAmount !== baseAmount && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">→ {formatCHF(previewAmount)}</span>
            )}
          </div>

          {/* Row 3: Month split */}
          {editState.frequency === 'monthly' && (
            <div className="bg-background/50 rounded-lg p-2 space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Unterjährige Änderung (optional)</p>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Jan –</span>
                  <select value={editState.monthSplitFrom} onChange={(e) => setEditState({ ...editState, monthSplitFrom: e.target.value })} className="bg-background border border-border rounded text-xs px-1 py-1">
                    <option value="">kein Split</option>
                    {MONTHS.slice(0, 11).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground">= {formatCHF(previewAmount)}</span>
                </div>
                {editState.monthSplitFrom && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">{MONTHS[parseInt(editState.monthSplitFrom)]} – Dez:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Betrag</span>
                      <input type="number" value={editState.monthSplitAmount} onChange={(e) => setEditState({ ...editState, monthSplitAmount: e.target.value })} className="w-20 bg-transparent border-b border-border text-xs text-right focus:outline-none tabular-nums" placeholder="CHF" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Faktor</span>
                      <input type="number" min={0} max={10} step={0.1} value={editState.monthSplitFactor || editState.factor} onChange={(e) => setEditState({ ...editState, monthSplitFactor: e.target.value })} className="w-14 bg-transparent border-b border-border text-xs text-right focus:outline-none tabular-nums" />
                    </div>
                    {previewSplit !== null && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">→ {formatCHF(previewSplit)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={saveEdit} className="flex items-center gap-1 text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-lg hover:bg-accent/90"><Check className="w-3 h-3" /> Speichern</button>
            <button onClick={() => setEditId(null)} className="text-xs text-muted-foreground px-3 py-1.5 rounded-lg hover:bg-muted">Abbrechen</button>
          </div>
        </div>
      )
    }

    return (
      <div key={expense.id} className="group flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: expense.type === 'savings' ? 'hsl(var(--income))' : expense.type === 'estimate' ? 'hsl(var(--savings))' : 'hsl(var(--negative))' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{expense.name}</p>
          {hasSplit && (
            <p className="text-xs text-muted-foreground">
              Jan–{MONTHS[(expense.monthSplitFrom ?? 1) - 1]}: {formatCHF(effectiveAmount)} · {MONTHS[expense.monthSplitFrom ?? 0]}–Dez: {formatCHF(applyFactor(applyDiscount(expense.monthSplitAmount ?? 0, discount), expense.monthSplitFactor ?? factor))}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {discount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-0.5"><Tag className="w-3 h-3" />-{discount}%</span>}
          {factor !== 1 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">×{factor}</span>}
        </div>
        <span className={typeBadgeClass[expense.type]}>{expenseTypeLabel(expense.type)}</span>
        <span className="text-xs text-muted-foreground hidden sm:block">{frequencyLabel(expense.frequency)}</span>
        <div className="text-right flex-shrink-0">
          {(discount > 0 || factor !== 1) ? (
            <>
              <span className="text-sm font-medium tabular-nums" style={{ color: expense.type === 'savings' ? 'hsl(var(--income))' : 'hsl(var(--negative))' }}>{formatCHF(effectiveAmount)}</span>
              <span className="text-xs text-muted-foreground line-through ml-1">{formatCHF(expense.amount)}</span>
            </>
          ) : (
            <span className="text-sm font-medium tabular-nums" style={{ color: expense.type === 'savings' ? 'hsl(var(--income))' : 'hsl(var(--negative))' }}>{formatCHF(expense.amount)}</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground w-24 text-right hidden md:block">{formatCHF(effectiveMonthly)} / Mo.</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => startEdit(expense)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={() => onDelete(expense.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([key, group]) => {
        const isCollapsed = collapsed.has(key)
        const groupTotal = group.expenses.reduce((sum, e) => sum + getEffectiveMonthly(e), 0)
        return (
          <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => { const next = new Set(collapsed); if (isCollapsed) next.delete(key); else next.add(key); setCollapsed(next) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
              {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              {group.category && (
                <span className="text-base">{getIconEmoji(group.category.icon ?? 'tag')}</span>
              )}
              {group.category && <span className="category-dot" style={{ background: group.category.color }} />}
              <span className="font-medium text-sm flex-1 text-left">{group.category?.name ?? 'Unkategorisiert'}</span>
              <span className="text-xs text-muted-foreground">{group.expenses.length} Posten · <span style={{ color: 'hsl(var(--negative))' }}>{formatCHF(groupTotal)} / Mo.</span></span>
            </button>
            {!isCollapsed && <div className="px-3 pb-3 space-y-0.5 border-t border-border/50">{group.expenses.map(renderExpense)}</div>}
          </div>
        )
      })}
      {uncategorized.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50"><span className="font-medium text-sm text-muted-foreground">Unkategorisiert</span></div>
          <div className="px-3 pb-3 space-y-0.5 pt-2">{uncategorized.map(renderExpense)}</div>
        </div>
      )}
      {expenses.length === 0 && <div className="text-center py-12 text-muted-foreground"><p className="text-sm">Noch keine Ausgaben erfasst.</p></div>}
    </div>
  )
}
