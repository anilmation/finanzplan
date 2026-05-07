'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid, ReferenceLine
} from 'recharts'
import { calculateBudgetSummary, formatCHF, getEffectiveExpenseAmount, toMonthly, calculateProjection, getEffectiveIncomeAmount, calculateYearlyWithSplit, applyFactor } from '@/lib/budget'
import type { Expense, Income, Category } from '@/types'
import { TrendingUp, PiggyBank } from 'lucide-react'

interface BudgetChartsProps {
  expenses: Expense[]
  incomes: Income[]
  categories: Category[]
  currentYear: number
}

export function BudgetCharts({ expenses, incomes, categories, currentYear }: BudgetChartsProps) {
  const summary = useMemo(() => calculateBudgetSummary(expenses, incomes), [expenses, incomes])
  const projection = useMemo(() => calculateProjection(summary, currentYear, 10), [summary, currentYear])

  const barData = [
    { name: 'Einnahmen', value: Math.round(summary.totalIncomeMonthly), fill: 'hsl(142, 50%, 38%)' },
    { name: 'Ausgaben', value: Math.round(summary.totalExpensesMonthly), fill: 'hsl(0, 60%, 52%)' },
    { name: 'Sparen', value: Math.round(summary.totalSavingsMonthly), fill: 'hsl(38, 80%, 48%)' },
    { name: 'Frei', value: Math.round(Math.max(0, summary.balanceMonthly)), fill: summary.balanceMonthly >= 0 ? 'hsl(142, 50%, 65%)' : 'hsl(0, 70%, 60%)' },
  ]

  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const catTotals = new Map<string, { name: string; value: number; color: string }>()
  for (const expense of expenses) {
    if (expense.type === 'savings') continue
    const catId = expense.categoryId
    const cat = catId ? categoryMap.get(catId) : null
    const key = cat?.parentId ?? catId ?? '__none'
    const parentCat = cat?.parentId ? categoryMap.get(cat.parentId) : cat
    const label = parentCat?.name ?? 'Sonstige'
    const color = parentCat?.color ?? '#888'
    const monthly = toMonthly(getEffectiveExpenseAmount(expense), expense.frequency)
    if (!catTotals.has(key)) catTotals.set(key, { name: label, value: 0, color })
    catTotals.get(key)!.value += monthly
  }
  const pieData = Array.from(catTotals.values()).filter((d) => d.value > 0).sort((a, b) => b.value - a.value)

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey?: string }> }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-sm">
        <p className="font-medium">{payload[0].name}</p>
        <p className="tabular-nums">{formatCHF(payload[0].value)}</p>
      </div>
    )
  }

  const ProjectionTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; dataKey: string }> ; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-sm space-y-1">
        <p className="font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className="tabular-nums text-xs">{p.name}: {formatCHF(p.value)}</p>
        ))}
      </div>
    )
  }

  const maxProjection = Math.max(...projection.map((p) => p.cumulativeSavings))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium mb-4">Monatliche Übersicht</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barCategoryGap="30%">
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-medium mb-4">Ausgaben nach Kategorie</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">Noch keine kategorisierten Ausgaben.</div>
          )}
        </div>
      </div>

      {/* 10-year projection */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> 10-Jahres Prognose</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Wenn du so weitermachst wie geplant</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
              <PiggyBank className="w-4 h-4" />
              <span className="text-sm font-medium">{formatCHF(maxProjection)} in 10 Jahren</span>
            </div>
            <p className="text-xs text-muted-foreground">Gespart + frei verfügbar</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={projection} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip content={<ProjectionTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Line type="monotone" dataKey="cumulativeSavings" name="Kumuliert gespart" stroke="hsl(142, 50%, 45%)" strokeWidth={2.5} dot={{ fill: 'hsl(142, 50%, 45%)', r: 4 }} />
            <Line type="monotone" dataKey="income" name="Einnahmen/Jahr" stroke="hsl(220, 70%, 55%)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="expenses" name="Ausgaben/Jahr" stroke="hsl(0, 60%, 55%)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>

        {/* Year summary table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-1.5 pr-4">Jahr</th>
                <th className="text-right py-1.5 pr-4">Einnahmen</th>
                <th className="text-right py-1.5 pr-4">Ausgaben</th>
                <th className="text-right py-1.5 pr-4">Gespart</th>
                <th className="text-right py-1.5 pr-4">Saldo</th>
                <th className="text-right py-1.5">Kumuliert</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((p) => (
                <tr key={p.year} className="border-b border-border/40 hover:bg-muted/30">
                  <td className="py-1.5 pr-4 font-medium">{p.year}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums" style={{ color: 'hsl(var(--income))' }}>{formatCHF(p.income)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums" style={{ color: 'hsl(var(--negative))' }}>{formatCHF(p.expenses)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums" style={{ color: 'hsl(var(--savings))' }}>{formatCHF(p.savings)}</td>
                  <td className="py-1.5 pr-4 text-right tabular-nums" style={{ color: p.balance >= 0 ? 'hsl(var(--income))' : 'hsl(var(--negative))' }}>{formatCHF(p.balance, true)}</td>
                  <td className="py-1.5 text-right tabular-nums font-medium" style={{ color: 'hsl(var(--income))' }}>{formatCHF(p.cumulativeSavings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
