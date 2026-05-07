'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, ArrowRight } from 'lucide-react'
import type { ExpenseType, Frequency } from '@/types'

interface QuickEntryProps {
  yearId: string
  onExpenseAdded: (expense: {
    name: string
    amount: number
    frequency: Frequency
    type: ExpenseType
  }) => Promise<void>
  onIncomeAdded: (income: {
    name: string
    amount: number
    frequency: Frequency
    employmentPct: number
  }) => Promise<void>
  mode: 'expense' | 'income'
}

type Step = 'name' | 'amount' | 'frequency' | 'type'

const FREQUENCY_SHORTCUTS: Record<string, Frequency> = {
  'm': 'monthly', 'monatlich': 'monthly', 'monthly': 'monthly',
  'j': 'yearly', 'jährlich': 'yearly', 'yearly': 'yearly',
  'e': 'once', 'einmalig': 'once', 'once': 'once',
}

const TYPE_SHORTCUTS: Record<string, ExpenseType> = {
  'f': 'fixed', 'fix': 'fixed', 'fixkosten': 'fixed',
  'p': 'estimate', 'prognose': 'estimate',
  's': 'savings', 'sparen': 'savings', 'spar': 'savings',
}

export function QuickEntry({ yearId, onExpenseAdded, onIncomeAdded, mode }: QuickEntryProps) {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [type, setType] = useState<ExpenseType>('fixed')
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const stepConfig = {
    name: {
      placeholder: mode === 'expense' ? 'Ausgabe eingeben (z.B. Miete)' : 'Einnahme eingeben (z.B. Lohn)',
      hint: 'Drücke Enter zum Fortfahren',
    },
    amount: {
      placeholder: 'Betrag in CHF',
      hint: 'Drücke Enter zum Fortfahren',
    },
    frequency: {
      placeholder: 'm = monatlich · j = jährlich · e = einmalig',
      hint: '',
    },
    type: {
      placeholder: 'f = Fixkosten · p = Prognose · s = Sparen',
      hint: '',
    },
  }

  const reset = useCallback(() => {
    setStep('name')
    setName('')
    setAmount('')
    setFrequency('monthly')
    setType('fixed')
    setHint('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { reset(); return }

    if (e.key === 'Enter') {
      const val = (e.target as HTMLInputElement).value.trim()

      if (step === 'name') {
        if (!val) return
        setName(val)
        setStep('amount')
        ;(e.target as HTMLInputElement).value = ''
        return
      }

      if (step === 'amount') {
        const num = parseFloat(val.replace(',', '.').replace(/[^0-9.]/g, ''))
        if (isNaN(num) || num <= 0) { setHint('Ungültiger Betrag'); return }
        setAmount(String(num))
        if (mode === 'expense') {
          setStep('frequency')
        } else {
          // For income, skip type step
          setStep('frequency')
        }
        ;(e.target as HTMLInputElement).value = ''
        setHint('')
        return
      }

      if (step === 'frequency') {
        const freq = FREQUENCY_SHORTCUTS[val.toLowerCase()]
        if (!freq) { setHint('m / j / e'); return }
        setFrequency(freq)
        if (mode === 'income') {
          // Submit income
          ;(e.target as HTMLInputElement).value = ''
          setLoading(true)
          try {
            await onIncomeAdded({
              name,
              amount: parseFloat(amount),
              frequency: freq,
              employmentPct: 100,
            })
            reset()
          } finally {
            setLoading(false)
          }
        } else {
          setStep('type')
          ;(e.target as HTMLInputElement).value = ''
        }
        setHint('')
        return
      }

      if (step === 'type') {
        const t = TYPE_SHORTCUTS[val.toLowerCase()]
        if (!t) { setHint('f / p / s'); return }
        setType(t)
        ;(e.target as HTMLInputElement).value = ''
        setLoading(true)
        try {
          await onExpenseAdded({
            name,
            amount: parseFloat(amount),
            frequency,
            type: t,
          })
          reset()
        } finally {
          setLoading(false)
        }
        return
      }
    }
  }

  const stepLabels: Record<Step, string> = {
    name: '1 Name',
    amount: '2 Betrag',
    frequency: '3 Häufigkeit',
    type: '4 Typ',
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4">
        {(['name', 'amount', 'frequency', ...(mode === 'expense' ? ['type'] : [])] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className={`w-5 h-5 rounded-full text-xs flex items-center justify-center transition-all ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : step > s || (step === 'frequency' && s === 'amount')
                  ? 'bg-accent/20 text-accent'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {stepLabels[s].charAt(0)}
            </div>
            <span className={`text-xs hidden sm:inline ${s === step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {stepLabels[s].slice(2)}
            </span>
            {s !== (mode === 'expense' ? 'type' : 'frequency') && (
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        ))}

        {/* Summary so far */}
        {name && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{name}</span>
            {amount && <span className="text-sm font-medium tabular-nums">CHF {amount}</span>}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          autoFocus
          type={step === 'amount' ? 'number' : 'text'}
          min={step === 'amount' ? '0' : undefined}
          step={step === 'amount' ? '0.05' : undefined}
          onKeyDown={handleKeyDown}
          placeholder={stepConfig[step].placeholder}
          disabled={loading}
          className="w-full bg-transparent border-0 border-b-2 border-border focus:border-primary outline-none py-3 text-base transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
          style={{ fontFamily: step === 'amount' ? 'var(--font-sans)' : undefined }}
        />
        {loading && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {hint && (
        <p className="text-xs text-destructive mt-1.5">{hint}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1.5">
        {stepConfig[step].hint}
        {step !== 'name' && (
          <button onClick={reset} className="ml-3 text-primary hover:underline">
            Abbrechen
          </button>
        )}
      </p>
    </div>
  )
}
