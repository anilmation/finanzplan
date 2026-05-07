'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { SummaryCards } from '@/components/budget/SummaryCards'
import { QuickEntry } from '@/components/budget/QuickEntry'
import { ExpenseList } from '@/components/budget/ExpenseList'
import { IncomeList } from '@/components/budget/IncomeList'
import { BudgetCharts } from '@/components/charts/BudgetCharts'
import { NewYearModal } from '@/components/budget/NewYearModal'
import { CategoryManager } from '@/components/budget/CategoryManager'
import { ExportImport } from '@/components/budget/ExportImport'
import type { BudgetYear, Expense, Income, Category, Frequency, ExpenseType } from '@/types'

interface DashboardClientProps {
  user: { id: string; email: string }
  budgetYears: BudgetYear[]
  activeYear: BudgetYear | null
  expenses: Expense[]
  incomes: Income[]
  categories: Category[]
}

export function DashboardClient({
  user,
  budgetYears: initialYears,
  activeYear: initialYear,
  expenses: initialExpenses,
  incomes: initialIncomes,
  categories: initialCategories,
}: DashboardClientProps) {
  const [budgetYears, setBudgetYears] = useState(initialYears)
  const [activeYear, setActiveYear] = useState(initialYear)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [incomes, setIncomes] = useState(initialIncomes)
  const [activeTab, setActiveTab] = useState<'uebersicht' | 'ausgaben' | 'einnahmen'>('uebersicht')
  const [showNewYear, setShowNewYear] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const [entryMode, setEntryMode] = useState<'expense' | 'income'>('expense')

  async function loadYear(year: number) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const resp = await fetch(`/api/budget/year?year=${year}`, {
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    })
    if (!resp.ok) return
    const data = await resp.json()
    setActiveYear(data.year)
    setExpenses(data.expenses)
    setIncomes(data.incomes)
  }

  async function getToken(): Promise<string | null> {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  async function authFetch(url: string, options: RequestInit = {}) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options.headers || {}),
      },
    })
  }

  const handleAddExpense = useCallback(async (data: {
    name: string; amount: number; frequency: Frequency; type: ExpenseType
  }) => {
    if (!activeYear) return
    const resp = await authFetch('/api/budget/expenses', {
      method: 'POST',
      body: JSON.stringify({ yearId: activeYear.id, ...data }),
    })
    if (resp.ok) {
      const expense = await resp.json()
      setExpenses((prev) => [...prev, expense])
    }
  }, [activeYear])

  const handleAddIncome = useCallback(async (data: {
    name: string; amount: number; frequency: Frequency; employmentPct: number
  }) => {
    if (!activeYear) return
    const resp = await authFetch('/api/budget/incomes', {
      method: 'POST',
      body: JSON.stringify({
        yearId: activeYear.id,
        name: data.name,
        amount100Pct: data.amount,
        employmentPct: data.employmentPct,
        frequency: data.frequency,
        type: 'other',
      }),
    })
    if (resp.ok) {
      const income = await resp.json()
      setIncomes((prev) => [...prev, income])
    }
  }, [activeYear])

  const handleUpdateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    const resp = await authFetch(`/api/budget/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (resp.ok) {
      const updated = await resp.json()
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
    }
  }, [])

  const handleDeleteExpense = useCallback(async (id: string) => {
    await authFetch(`/api/budget/expenses/${id}`, { method: 'DELETE' })
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const handleUpdateIncome = useCallback(async (id: string, data: Partial<Income>) => {
    const resp = await authFetch(`/api/budget/incomes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (resp.ok) {
      const updated = await resp.json()
      setIncomes((prev) => prev.map((i) => (i.id === id ? updated : i)))
    }
  }, [])

  const handleDeleteIncome = useCallback(async (id: string) => {
    await authFetch(`/api/budget/incomes/${id}`, { method: 'DELETE' })
    setIncomes((prev) => prev.filter((i) => i.id !== id))
  }, [])

  async function handleCreateYear(year: number, copyFromId?: string) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const resp = await fetch('/api/budget/years', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ year, copyFromId }),
    })
    if (resp.ok) {
      const data = await resp.json()
      setBudgetYears((prev) => [data.year, ...prev])
      setActiveYear(data.year)
      setExpenses(data.expenses ?? [])
      setIncomes(data.incomes ?? [])
      setShowNewYear(false)
    }
  }

  const years = budgetYears.map((y) => y.year)

  if (!activeYear) {
    return (
      <div className="flex min-h-screen">
        <Sidebar
          user={user}
          currentYear={null}
          years={years}
          onYearChange={loadYear}
          onCreateYear={() => setShowNewYear(true)}
        />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl mb-3" style={{ fontFamily: 'var(--font-display)' }}>
              Willkommen bei Finanzplan
            </h2>
            <p className="text-muted-foreground mb-6">
              Erstelle dein erstes Budget-Jahr, um loszulegen.
            </p>
            <button
              onClick={() => setShowNewYear(true)}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Jahr {new Date().getFullYear()} erstellen
            </button>
          </div>
        </main>
        {showCategories && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategories(false)}
          onCategoriesChange={setCategories}
          getToken={getToken}
        />
      )}

      {showNewYear && (
          <NewYearModal
            existingYears={budgetYears}
            onConfirm={handleCreateYear}
            onClose={() => setShowNewYear(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        currentYear={activeYear.year}
        years={years}
        onYearChange={loadYear}
        onCreateYear={() => setShowNewYear(true)}
      />

      <main className="flex-1 p-4 pt-16 lg:pt-8 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-3xl" style={{ fontFamily: 'var(--font-display)' }}>
              Budget {activeYear.year}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {expenses.length} Ausgaben · {incomes.length} Einnahmen
            </p>
          </div>

          <div className="flex items-center gap-2 mr-2">
            <ExportImport
              yearId={activeYear.id}
              yearNumber={activeYear.year}
              getToken={getToken}
              onImported={() => loadYear(activeYear.year)}
            />
            <button
              onClick={() => setShowCategories(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-all"
            >
              Kategorien
            </button>
          </div>
          {/* Tab navigation */}
          <div className="flex bg-muted rounded-xl p-1 gap-1 overflow-x-auto">
            {[
              { key: 'uebersicht', label: 'Übersicht' },
              { key: 'ausgaben', label: 'Ausgaben' },
              { key: 'einnahmen', label: 'Einnahmen' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards (always visible) */}
        <div className="mb-6">
          <SummaryCards expenses={expenses} incomes={incomes} />
        </div>

        {/* Tab content */}
        {activeTab === 'uebersicht' && (
          <BudgetCharts expenses={expenses} incomes={incomes} categories={categories} currentYear={activeYear.year} />
        )}

        {activeTab === 'ausgaben' && (
          <div className="space-y-6">
            {/* Mode toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Schnelleingabe für:</span>
              <div className="flex bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setEntryMode('expense')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${entryMode === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Ausgabe
                </button>
                <button
                  onClick={() => setEntryMode('income')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${entryMode === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
                >
                  Einnahme
                </button>
              </div>
            </div>

            <QuickEntry
              yearId={activeYear.id}
              onExpenseAdded={handleAddExpense}
              onIncomeAdded={handleAddIncome}
              mode={entryMode}
            />

            <ExpenseList
              expenses={expenses}
              categories={categories}
              onUpdate={handleUpdateExpense}
              onDelete={handleDeleteExpense}
            />
          </div>
        )}

        {activeTab === 'einnahmen' && (
          <div className="space-y-6">
            <QuickEntry
              yearId={activeYear.id}
              onExpenseAdded={handleAddExpense}
              onIncomeAdded={handleAddIncome}
              mode="income"
            />
            <IncomeList
              incomes={incomes}
              onUpdate={handleUpdateIncome}
              onDelete={handleDeleteIncome}
            />
          </div>
        )}
      </main>

      {showCategories && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategories(false)}
          onCategoriesChange={setCategories}
          getToken={getToken}
        />
      )}

      {showNewYear && (
        <NewYearModal
          existingYears={budgetYears}
          onConfirm={handleCreateYear}
          onClose={() => setShowNewYear(false)}
        />
      )}
    </div>
  )
}
