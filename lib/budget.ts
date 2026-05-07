import type { Expense, Income, BudgetSummary } from '@/types'

export function applyDiscount(amount: number, discountPct: number): number {
  return amount * (1 - (discountPct || 0) / 100)
}

export function applyFactor(amount: number, factor: number): number {
  return amount * (factor || 1)
}

// Calculate yearly amount considering month split
// monthSplitFrom = last month of first period (e.g. 6 = Jan-Jun first amount, Jul-Dec second)
export function calculateYearlyWithSplit(
  amount: number,
  monthSplitFrom: number | undefined,
  monthSplitAmount: number | undefined,
  frequency: string,
  splitFactor?: number
): number {
  if (frequency === 'once') return amount
  if (frequency === 'yearly') return amount
  if (monthSplitFrom && monthSplitAmount !== undefined) {
    const months1 = monthSplitFrom
    const months2 = 12 - monthSplitFrom
    const effectiveSplitAmount = applyFactor(monthSplitAmount, splitFactor ?? 1)
    return amount * months1 + effectiveSplitAmount * months2
  }
  return amount * 12
}

export function getEffectiveExpenseAmount(expense: Expense): number {
  const base = applyDiscount(expense.amount, expense.discountPct)
  return applyFactor(base, expense.factor)
}

export function getEffectiveIncomeAmount(income: Income): number {
  const base = (income.amount100Pct * income.employmentPct) / 100
  return applyFactor(base, income.factor)
}

export function toMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'monthly': return amount
    case 'yearly': return amount / 12
    case 'once': return 0
    default: return amount
  }
}

export function toYearly(amount: number, frequency: string): number {
  switch (frequency) {
    case 'monthly': return amount * 12
    case 'yearly': return amount
    case 'once': return amount
    default: return amount
  }
}

export function calculateBudgetSummary(expenses: Expense[], incomes: Income[]): BudgetSummary {
  let totalIncomeMonthly = 0
  let totalIncomeYearly = 0

  for (const income of incomes) {
    const effective = getEffectiveIncomeAmount(income)
    const splitEmploymentPct = income.monthSplitEmploymentPct ?? income.employmentPct
    const splitEffectiveIncome = income.monthSplitAmount !== undefined
      ? applyFactor(income.monthSplitAmount * splitEmploymentPct / 100, income.monthSplitFactor ?? income.factor)
      : undefined
    const yearly = income.monthSplitFrom && splitEffectiveIncome !== undefined
      ? calculateYearlyWithSplit(effective, income.monthSplitFrom, splitEffectiveIncome, income.frequency)
      : toYearly(effective, income.frequency)
    totalIncomeYearly += yearly
    totalIncomeMonthly += yearly / 12
  }

  let totalExpensesMonthly = 0
  let totalExpensesYearly = 0
  let totalSavingsMonthly = 0
  let totalSavingsYearly = 0

  for (const expense of expenses) {
    const effective = getEffectiveExpenseAmount(expense)
    const splitEffective = expense.monthSplitAmount !== undefined
      ? applyFactor(applyDiscount(expense.monthSplitAmount, expense.discountPct), expense.monthSplitFactor ?? expense.factor)
      : undefined
    const yearly = expense.monthSplitFrom && splitEffective !== undefined
      ? calculateYearlyWithSplit(effective, expense.monthSplitFrom, splitEffective, expense.frequency)
      : toYearly(effective, expense.frequency)

    if (expense.type === 'savings') {
      totalSavingsYearly += yearly
      totalSavingsMonthly += yearly / 12
    } else {
      totalExpensesYearly += yearly
      totalExpensesMonthly += yearly / 12
    }
  }

  const balanceYearly = totalIncomeYearly - totalExpensesYearly - totalSavingsYearly
  const balanceMonthly = balanceYearly / 12
  const netBalanceYearly = totalIncomeYearly - totalExpensesYearly
  const netBalanceMonthly = netBalanceYearly / 12

  return {
    totalIncomeMonthly,
    totalIncomeYearly,
    totalExpensesMonthly,
    totalExpensesYearly,
    totalSavingsMonthly,
    totalSavingsYearly,
    balanceMonthly,
    balanceYearly,
    netBalanceMonthly,
    netBalanceYearly,
  }
}

export function formatCHF(amount: number, showSign = false): string {
  const formatted = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  if (showSign) {
    if (amount > 0) return `+${formatted}`
    if (amount < 0) return `-${formatted}`
    return formatted
  }
  return amount < 0 ? `-${formatted}` : formatted
}

export function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case 'monthly': return 'monatlich'
    case 'yearly': return 'jährlich'
    case 'once': return 'einmalig'
    default: return frequency
  }
}

export function expenseTypeLabel(type: string): string {
  switch (type) {
    case 'fixed': return 'Fixkosten'
    case 'estimate': return 'Prognose'
    case 'savings': return 'Sparen'
    default: return type
  }
}

// 10-year projection
export interface YearProjection {
  year: number
  income: number
  expenses: number
  savings: number
  balance: number
  cumulativeSavings: number
}

export function calculateProjection(summary: BudgetSummary, currentYear: number, years = 10): YearProjection[] {
  const result: YearProjection[] = []
  let cumulativeSavings = 0

  for (let i = 0; i < years; i++) {
    const balance = summary.balanceYearly
    const savings = summary.totalSavingsYearly
    cumulativeSavings += savings + Math.max(0, balance)
    result.push({
      year: currentYear + i,
      income: summary.totalIncomeYearly,
      expenses: summary.totalExpensesYearly,
      savings: summary.totalSavingsYearly,
      balance: summary.balanceYearly,
      cumulativeSavings,
    })
  }
  return result
}
