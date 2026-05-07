export type Frequency = 'monthly' | 'yearly' | 'once'
export type ExpenseType = 'fixed' | 'estimate' | 'savings'
export type IncomeType = 'salary' | 'other'

export interface User {
  id: string
  email: string
  createdAt: string
}

export interface BudgetYear {
  id: string
  userId: string
  year: number
  createdAt: string
  copiedFromYearId?: string
  expenses?: Expense[]
  incomes?: Income[]
}

export interface Category {
  id: string
  userId: string
  name: string
  color: string
  icon: string
  parentId?: string
  sortOrder: number
  children?: Category[]
  expenses?: Expense[]
}

export interface Expense {
  id: string
  yearId: string
  categoryId?: string
  name: string
  amount: number
  frequency: Frequency
  type: ExpenseType
  notes?: string
  discountPct: number
  factor: number
  monthSplitFrom?: number
  monthSplitAmount?: number
  monthSplitFactor?: number
  sortOrder: number
  createdAt: string
  category?: Category
}

export interface Income {
  id: string
  yearId: string
  name: string
  amount100Pct: number
  employmentPct: number
  factor: number
  monthSplitFrom?: number
  monthSplitAmount?: number
  monthSplitFactor?: number
  monthSplitEmploymentPct?: number
  frequency: Frequency
  type: IncomeType
  notes?: string
  sortOrder: number
  createdAt: string
}

export interface Transaction {
  id: string
  yearId: string
  date: string
  description: string
  amount: number
  matchedExpenseId?: string
  aiCategory?: string
  aiConfidence?: number
  isIncome: boolean
  createdAt: string
  matchedExpense?: Expense
}

export interface BudgetSummary {
  totalIncomeMonthly: number
  totalIncomeYearly: number
  totalExpensesMonthly: number
  totalExpensesYearly: number
  totalSavingsMonthly: number
  totalSavingsYearly: number
  balanceMonthly: number
  balanceYearly: number
  netBalanceMonthly: number
  netBalanceYearly: number
}

export interface ComparisonResult {
  categoryName: string
  planned: number
  actual: number
  difference: number
  percentageUsed: number
}
