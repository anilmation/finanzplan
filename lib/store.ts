import { create } from 'zustand'
import type { BudgetYear, Expense, Income, Category, Transaction } from '@/types'

interface BudgetStore {
  // Current year
  currentYear: BudgetYear | null
  setCurrentYear: (year: BudgetYear) => void

  // Data
  expenses: Expense[]
  incomes: Income[]
  categories: Category[]
  transactions: Transaction[]

  setExpenses: (expenses: Expense[]) => void
  setIncomes: (incomes: Income[]) => void
  setCategories: (categories: Category[]) => void
  setTransactions: (transactions: Transaction[]) => void

  addExpense: (expense: Expense) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  removeExpense: (id: string) => void

  addIncome: (income: Income) => void
  updateIncome: (id: string, income: Partial<Income>) => void
  removeIncome: (id: string) => void

  addCategory: (category: Category) => void
  updateCategory: (id: string, category: Partial<Category>) => void
  removeCategory: (id: string) => void

  // UI state
  activeMode: 'planen' | 'realitaet'
  setActiveMode: (mode: 'planen' | 'realitaet') => void

  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export const useBudgetStore = create<BudgetStore>((set) => ({
  currentYear: null,
  setCurrentYear: (year) => set({ currentYear: year }),

  expenses: [],
  incomes: [],
  categories: [],
  transactions: [],

  setExpenses: (expenses) => set({ expenses }),
  setIncomes: (incomes) => set({ incomes }),
  setCategories: (categories) => set({ categories }),
  setTransactions: (transactions) => set({ transactions }),

  addExpense: (expense) =>
    set((state) => ({ expenses: [...state.expenses, expense] })),
  updateExpense: (id, updated) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updated } : e)),
    })),
  removeExpense: (id) =>
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

  addIncome: (income) =>
    set((state) => ({ incomes: [...state.incomes, income] })),
  updateIncome: (id, updated) =>
    set((state) => ({
      incomes: state.incomes.map((i) => (i.id === id ? { ...i, ...updated } : i)),
    })),
  removeIncome: (id) =>
    set((state) => ({ incomes: state.incomes.filter((i) => i.id !== id) })),

  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
  updateCategory: (id, updated) =>
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === id ? { ...c, ...updated } : c
      ),
    })),
  removeCategory: (id) =>
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    })),

  activeMode: 'planen',
  setActiveMode: (mode) => set({ activeMode: mode }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
