'use client'

import { useState, useCallback, useRef } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { formatCHF, toMonthly } from '@/lib/budget'
import { Upload, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, FileText, Loader2 } from 'lucide-react'
import type { BudgetYear, Expense, Income, Transaction, Category } from '@/types'

interface RealitaetClientProps {
  user: { id: string; email: string }
  year: BudgetYear
  expenses: Expense[]
  incomes: Income[]
  transactions: Transaction[]
  categories: Category[]
}

interface CategoryComparison {
  category: string
  planned: number
  actual: number
  difference: number
}

export function RealitaetClient({
  user,
  year,
  expenses,
  incomes,
  transactions: initialTransactions,
  categories,
}: RealitaetClientProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [lastUploadCount, setLastUploadCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function processFile(file: File) {
    if (file.type !== 'application/pdf') {
      setUploadError('Bitte nur PDF-Dateien hochladen.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Datei darf maximal 20 MB gross sein.')
      return
    }

    setUploading(true)
    setUploadError('')
    setLastUploadCount(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('yearId', year.id)

    try {
      const resp = await fetch('/api/analyse', { method: 'POST', body: formData })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Unbekannter Fehler')
      setTransactions((prev) => [...data.transactions, ...prev])
      setLastUploadCount(data.count)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  // Build category comparison
  const categoryComparison = useCallback((): CategoryComparison[] => {
    // Group planned expenses by category
    const planned = new Map<string, number>()
    for (const expense of expenses) {
      if (expense.type === 'savings') continue
      const key = expense.category?.name ?? expense.aiCategory ?? 'Sonstige'
      planned.set(key, (planned.get(key) ?? 0) + toMonthly(expense.amount, expense.frequency))
    }

    // Group actual transactions by AI category
    const actual = new Map<string, number>()
    for (const tx of transactions) {
      if (tx.isIncome) continue
      // Try to match to planned category
      let key = 'Sonstige'
      if (tx.matchedExpense?.category?.name) {
        key = tx.matchedExpense.category.name
      } else if (tx.aiCategory) {
        key = tx.aiCategory
      }
      actual.set(key, (actual.get(key) ?? 0) + Math.abs(tx.amount))
    }

    // Merge
    const allKeys = new Set([...planned.keys(), ...actual.keys()])
    return Array.from(allKeys).map((cat) => {
      const p = planned.get(cat) ?? 0
      const a = actual.get(cat) ?? 0
      return {
        category: cat,
        planned: p,
        actual: a,
        difference: a - p,
      }
    }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
  }, [expenses, transactions])

  const comparison = categoryComparison()

  const totalPlanned = comparison.reduce((s, c) => s + c.planned, 0)
  const totalActual = comparison.reduce((s, c) => s + c.actual, 0)
  const totalDiff = totalActual - totalPlanned

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        currentYear={year.year}
        years={[year.year]}
        onCreateYear={() => {}}
      />

      <main className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 overflow-auto">
        <div className="mb-6">
          <h2 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
            Realitätscheck {year.year}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Vergleich deiner Planung mit den tatsächlichen Bankbewegungen
          </p>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Geplant (monatlich)</p>
            <p className="text-2xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              {formatCHF(totalPlanned)}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Tatsächlich</p>
            <p className="text-2xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
              {formatCHF(totalActual)}
            </p>
          </div>
          <div
            className="border rounded-2xl p-5"
            style={{
              background: totalDiff > 0 ? 'hsl(var(--negative-light))' : 'hsl(var(--income-light))',
              borderColor: totalDiff > 0 ? 'hsl(var(--negative))' : 'hsl(var(--income))',
            }}
          >
            <p className="text-sm text-muted-foreground mb-1">Differenz</p>
            <div className="flex items-center gap-2">
              {totalDiff > 0
                ? <TrendingUp className="w-5 h-5" style={{ color: 'hsl(var(--negative))' }} />
                : <TrendingDown className="w-5 h-5" style={{ color: 'hsl(var(--income))' }} />
              }
              <p className="text-2xl font-medium" style={{
                fontFamily: 'var(--font-display)',
                color: totalDiff > 0 ? 'hsl(var(--negative))' : 'hsl(var(--income))',
              }}>
                {totalDiff > 0 ? '+' : ''}{formatCHF(totalDiff)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload area */}
          <div className="lg:col-span-1 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              } ${uploading ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-primary animate-spin" />
                  <p className="text-sm font-medium">Analysiere PDF...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    KI liest deine Bankbewegungen
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">Postfinance-Beleg hochladen</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF fallen lassen oder klicken
                  </p>
                  <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2">
                    Deine Bankdaten werden nur zur Analyse verwendet und nach der Verarbeitung nicht gespeichert.
                  </p>
                </>
              )}
            </div>

            {uploadError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              </div>
            )}

            {lastUploadCount !== null && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-400">
                  {lastUploadCount} Transaktionen erfolgreich importiert.
                </p>
              </div>
            )}

            {/* Transaction list */}
            {transactions.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm font-medium">
                    Importierte Transaktionen ({transactions.length})
                  </p>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-border/40">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date} · {tx.aiCategory}</p>
                      </div>
                      <span className={`text-xs tabular-nums font-medium ${tx.isIncome ? 'text-green-600' : 'text-foreground'}`}>
                        {tx.isIncome ? '+' : ''}{formatCHF(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category comparison */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50">
                <h3 className="font-medium text-sm">Plan vs. Realität nach Kategorie</h3>
              </div>

              {comparison.length === 0 ? (
                <div className="px-5 py-12 text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Noch keine Transaktionen importiert.</p>
                  <p className="text-xs mt-1">Lade einen Postfinance-Beleg hoch.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {comparison.map((item) => {
                    const maxVal = Math.max(item.planned, item.actual, 1)
                    const isOver = item.difference > 0
                    const pct = item.planned > 0
                      ? Math.round((item.actual / item.planned) * 100)
                      : null

                    return (
                      <div key={item.category} className="px-5 py-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{item.category}</span>
                          <div className="flex items-center gap-3">
                            {pct !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                isOver ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                       : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              }`}>
                                {pct}%
                              </span>
                            )}
                            <span className={`text-sm font-medium tabular-nums ${
                              isOver ? 'comparison-over' : 'comparison-under'
                            }`}>
                              {isOver ? '+' : ''}{formatCHF(item.difference)}
                            </span>
                          </div>
                        </div>

                        {/* Dual bar */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16">Geplant</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(item.planned / maxVal) * 100}%`,
                                  background: 'hsl(var(--expense))',
                                }}
                              />
                            </div>
                            <span className="text-xs tabular-nums w-24 text-right">
                              {formatCHF(item.planned)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-16">Effektiv</span>
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${(item.actual / maxVal) * 100}%`,
                                  background: isOver ? 'hsl(var(--negative))' : 'hsl(var(--income))',
                                }}
                              />
                            </div>
                            <span className="text-xs tabular-nums w-24 text-right">
                              {formatCHF(item.actual)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
