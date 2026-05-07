'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react'
import { calculateBudgetSummary, formatCHF } from '@/lib/budget'
import type { Expense, Income } from '@/types'

interface SummaryCardsProps {
  expenses: Expense[]
  incomes: Income[]
}

export function SummaryCards({ expenses, incomes }: SummaryCardsProps) {
  const summary = useMemo(
    () => calculateBudgetSummary(expenses, incomes),
    [expenses, incomes]
  )

  const cards = [
    {
      label: 'Einnahmen',
      monthly: summary.totalIncomeMonthly,
      yearly: summary.totalIncomeYearly,
      icon: TrendingUp,
      color: 'income',
      positive: true,
    },
    {
      label: 'Ausgaben',
      monthly: summary.totalExpensesMonthly,
      yearly: summary.totalExpensesYearly,
      icon: TrendingDown,
      color: 'negative',
      positive: false,
    },
    {
      label: 'Gespart',
      monthly: summary.totalSavingsMonthly,
      yearly: summary.totalSavingsYearly,
      icon: PiggyBank,
      color: 'savings',
      positive: true,
    },
    {
      label: 'Frei verfügbar',
      monthly: summary.balanceMonthly,
      yearly: summary.balanceYearly,
      icon: Wallet,
      color: summary.balanceMonthly >= 0 ? 'income' : 'negative',
      positive: summary.balanceMonthly >= 0,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className="bg-card border border-border rounded-2xl p-5 animate-in"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `hsl(var(--${card.color}-light))` }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: `hsl(var(--${card.color}))` }}
                />
              </div>
            </div>
            <p
              className="text-2xl font-medium tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {card.label === 'Frei verfügbar' ? formatCHF(card.monthly, true) : formatCHF(card.monthly)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {card.label === 'Frei verfügbar' ? formatCHF(card.yearly, true) : formatCHF(card.yearly)} / Jahr
            </p>

            {/* Visual bar */}
            {card.label === 'Frei verfügbar' && summary.totalIncomeMonthly > 0 && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, (summary.balanceMonthly / summary.totalIncomeMonthly) * 100))}%`,
                    background: `hsl(var(--${card.color}))`,
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
