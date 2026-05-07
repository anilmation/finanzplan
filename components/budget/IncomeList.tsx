'use client'

import { useState } from 'react'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { formatCHF, frequencyLabel, getEffectiveIncomeAmount, toMonthly, applyFactor, calculateYearlyWithSplit } from '@/lib/budget'
import type { Income, Frequency, IncomeType } from '@/types'

interface IncomeListProps {
  incomes: Income[]
  onUpdate: (id: string, data: Partial<Income>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const MONTHS = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

export function IncomeList({ incomes, onUpdate, onDelete }: IncomeListProps) {
  const [editId, setEditId] = useState<string | null>(null)
  const [editState, setEditState] = useState<Partial<Income> & { monthSplitFromStr?: string; monthSplitAmountStr?: string; monthSplitFactorStr?: string; monthSplitEmploymentPctStr?: string; factorStr?: string } | null>(null)

  function startEdit(income: Income) {
    setEditId(income.id)
    setEditState({
      ...income,
      factorStr: String(income.factor ?? 1),
      monthSplitFromStr: income.monthSplitFrom ? String(income.monthSplitFrom) : '',
      monthSplitAmountStr: income.monthSplitAmount ? String(income.monthSplitAmount) : '',
      monthSplitFactorStr: income.monthSplitFactor ? String(income.monthSplitFactor) : '',
      monthSplitEmploymentPctStr: income.monthSplitEmploymentPct ? String(income.monthSplitEmploymentPct) : '',
    })
  }

  async function saveEdit() {
    if (!editState || !editId) return
    await onUpdate(editId, {
      name: editState.name,
      amount100Pct: editState.amount100Pct,
      employmentPct: editState.employmentPct,
      factor: parseFloat(editState.factorStr ?? '1') || 1,
      frequency: editState.frequency,
      type: editState.type,
      notes: editState.notes,
      monthSplitFrom: editState.monthSplitFromStr ? parseInt(editState.monthSplitFromStr) : undefined,
      monthSplitAmount: editState.monthSplitAmountStr ? parseFloat(editState.monthSplitAmountStr) : undefined,
      monthSplitFactor: editState.monthSplitFactorStr ? parseFloat(editState.monthSplitFactorStr) : undefined,
      monthSplitEmploymentPct: editState.monthSplitEmploymentPctStr ? parseInt(editState.monthSplitEmploymentPctStr) : undefined,
    })
    setEditId(null)
    setEditState(null)
  }

  function getEffectiveMonthly(income: Income): number {
    const effective = getEffectiveIncomeAmount(income)
    if (income.monthSplitFrom && income.monthSplitAmount !== undefined) {
      const splitEmployPct = income.monthSplitEmploymentPct ?? income.employmentPct
      const splitEffective = applyFactor(income.monthSplitAmount * splitEmployPct / 100, income.monthSplitFactor ?? income.factor)
      const yearly = calculateYearlyWithSplit(effective, income.monthSplitFrom, splitEffective, income.frequency)
      return yearly / 12
    }
    return toMonthly(effective, income.frequency)
  }

  const totalMonthly = incomes.reduce((s, i) => s + getEffectiveMonthly(i), 0)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <span className="font-medium text-sm">Einnahmen</span>
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--income))' }}>{formatCHF(totalMonthly)} / Mo.</span>
      </div>

      <div className="divide-y divide-border/40">
        {incomes.map((income) => {
          const isEditing = editId === income.id
          const effective = getEffectiveIncomeAmount(income)
          const effectiveMonthly = getEffectiveMonthly(income)
          const factor = income.factor ?? 1
          const hasSplit = income.monthSplitFrom && income.monthSplitAmount !== undefined

          if (isEditing && editState) {
            return (
              <div key={income.id} className="p-3 space-y-3 bg-muted/40">
                <div className="flex flex-wrap gap-2 items-center">
                  <input value={editState.name} onChange={(e) => setEditState({ ...editState, name: e.target.value })} className="flex-1 min-w-32 bg-transparent border-b border-border text-sm focus:outline-none" autoFocus placeholder="Name" />
                  <select value={editState.type} onChange={(e) => setEditState({ ...editState, type: e.target.value as IncomeType })} className="bg-background border border-border rounded text-xs px-1 py-1">
                    <option value="salary">Lohn</option>
                    <option value="other">Andere</option>
                  </select>
                  <select value={editState.frequency} onChange={(e) => setEditState({ ...editState, frequency: e.target.value as Frequency })} className="bg-background border border-border rounded text-xs px-1 py-1">
                    <option value="monthly">monatlich</option>
                    <option value="yearly">jährlich</option>
                    <option value="once">einmalig</option>
                  </select>
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">100% Betrag</span>
                    <input type="number" value={editState.amount100Pct} onChange={(e) => setEditState({ ...editState, amount100Pct: parseFloat(e.target.value) })} className="w-24 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Anstellung %</span>
                    <input type="number" min={0} max={100} value={editState.employmentPct} onChange={(e) => setEditState({ ...editState, employmentPct: parseInt(e.target.value) })} className="w-14 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Faktor</span>
                    <input type="number" min={0} max={10} step={0.1} value={editState.factorStr} onChange={(e) => setEditState({ ...editState, factorStr: e.target.value })} className="w-14 bg-transparent border-b border-border text-sm text-right focus:outline-none tabular-nums" />
                  </div>
                </div>
                {editState.frequency === 'monthly' && (
                  <div className="flex flex-wrap gap-4 items-center bg-background/50 rounded-lg p-2">
                    <span className="text-xs text-muted-foreground font-medium">Unterjährige Änderung:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Jan bis</span>
                      <select value={editState.monthSplitFromStr} onChange={(e) => setEditState({ ...editState, monthSplitFromStr: e.target.value })} className="bg-background border border-border rounded text-xs px-1 py-1">
                        <option value="">kein Split</option>
                        {MONTHS.slice(0, 11).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                      </select>
                    </div>
                    {editState.monthSplitFromStr && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">{MONTHS[parseInt(editState.monthSplitFromStr)]} – Dez:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">100% Betrag</span>
                          <input type="number" value={editState.monthSplitAmountStr ?? editState.amount100Pct} onChange={(e) => setEditState({ ...editState, monthSplitAmountStr: e.target.value })} className="w-24 bg-transparent border-b border-border text-xs text-right focus:outline-none tabular-nums" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Anstellung %</span>
                          <input type="number" min={0} max={100} value={editState.monthSplitEmploymentPctStr ?? editState.employmentPct} onChange={(e) => setEditState({ ...editState, monthSplitEmploymentPctStr: e.target.value })} className="w-14 bg-transparent border-b border-border text-xs text-right focus:outline-none tabular-nums" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Faktor</span>
                          <input type="number" min={0} max={10} step={0.1} value={editState.monthSplitFactorStr ?? editState.factorStr} onChange={(e) => setEditState({ ...editState, monthSplitFactorStr: e.target.value })} className="w-14 bg-transparent border-b border-border text-xs text-right focus:outline-none tabular-nums" />
                        </div>
                        {editState.monthSplitAmountStr && editState.monthSplitEmploymentPctStr && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            → CHF {(parseFloat(editState.monthSplitAmountStr) * parseInt(editState.monthSplitEmploymentPctStr) / 100 * parseFloat(editState.monthSplitFactorStr || editState.factorStr || '1')).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
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
            <div key={income.id} className="group flex items-center gap-3 py-3 px-4 hover:bg-muted/40 transition-colors">
              <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: 'hsl(var(--income))' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{income.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {income.type === 'salary' && income.employmentPct < 100 && (
                    <p className="text-xs text-muted-foreground">{income.employmentPct}% · 100%: {formatCHF(income.amount100Pct)}</p>
                  )}
                  {factor !== 1 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">×{factor}</span>}
                  {hasSplit && <span className="text-xs text-muted-foreground">Jan–{MONTHS[(income.monthSplitFrom ?? 1) - 1]}: {formatCHF(effective)} · {MONTHS[income.monthSplitFrom ?? 0]}–Dez: {formatCHF(applyFactor((income.monthSplitAmount ?? 0) * (income.monthSplitEmploymentPct ?? income.employmentPct) / 100, income.monthSplitFactor ?? factor))}</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{frequencyLabel(income.frequency)}</span>
              <span className="text-sm font-medium tabular-nums" style={{ color: 'hsl(var(--income))' }}>{formatCHF(effective)}</span>
              <span className="text-xs text-muted-foreground w-24 text-right hidden md:block">{formatCHF(effectiveMonthly)} / Mo.</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(income)} className="p-1.5 rounded hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(income.id)} className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )
        })}
        {incomes.length === 0 && <p className="text-sm text-muted-foreground px-4 py-6 text-center">Noch keine Einnahmen erfasst.</p>}
      </div>
    </div>
  )
}
