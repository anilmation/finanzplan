'use client'

import { useState } from 'react'
import { X, Copy, Plus } from 'lucide-react'
import type { BudgetYear } from '@/types'

interface NewYearModalProps {
  existingYears: BudgetYear[]
  onConfirm: (year: number, copyFromId?: string) => Promise<void>
  onClose: () => void
}

export function NewYearModal({ existingYears, onConfirm, onClose }: NewYearModalProps) {
  const currentYear = new Date().getFullYear()
  const existingYearNumbers = new Set(existingYears.map((y) => y.year))
  const nextYear = existingYearNumbers.has(currentYear) ? currentYear + 1 : currentYear

  const [selectedYear, setSelectedYear] = useState(nextYear)
  const [copyFromId, setCopyFromId] = useState<string>('none')
  const [loading, setLoading] = useState(false)

  const yearOptions = Array.from({ length: 5 }, (_, i) => nextYear + i).filter(
    (y) => !existingYearNumbers.has(y)
  )

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(selectedYear, copyFromId === 'none' ? undefined : copyFromId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl animate-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl" style={{ fontFamily: 'var(--font-display)' }}>
            Neues Jahr erstellen
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Year selection */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Jahr</label>
            <div className="flex gap-2 flex-wrap">
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    selectedYear === y
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Copy from previous year */}
          {existingYears.length > 0 && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Ausgaben aus Vorjahr übernehmen?
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="copyFrom"
                    value="none"
                    checked={copyFromId === 'none'}
                    onChange={() => setCopyFromId('none')}
                    className="accent-primary"
                  />
                  <span className="flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                    Leeres Jahr starten
                  </span>
                </label>
                {existingYears.map((y) => (
                  <label key={y.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="copyFrom"
                      value={y.id}
                      checked={copyFromId === y.id}
                      onChange={() => setCopyFromId(y.id)}
                      className="accent-primary"
                    />
                    <span className="flex items-center gap-2 text-sm">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                      Aus {y.year} kopieren
                    </span>
                  </label>
                ))}
              </div>

              {copyFromId !== 'none' && (
                <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-3 py-2">
                  Alle Ausgaben und Einnahmen werden als Vorlage kopiert.
                  Beträge und Häufigkeiten bleiben erhalten — du kannst sie danach anpassen.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Erstelle...' : `${selectedYear} erstellen`}
          </button>
        </div>
      </div>
    </div>
  )
}
