// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DashboardClient } from '@/components/budget/DashboardClient'
import type { BudgetYear, Expense, Income, Category } from '@/types'

export default function DashboardPage() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [data, setData] = useState<{
    user: { id: string; email: string }
    budgetYears: BudgetYear[]
    activeYear: BudgetYear | null
    expenses: Expense[]
    incomes: Income[]
    categories: Category[]
  } | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        window.location.href = '/auth/login'
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const resp = await fetch('/api/dashboard/load', {
          headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
        })
        if (!resp.ok) throw new Error('Load failed')
        const json = await resp.json()
        setData({ user: { id: user.id, email: user.email! }, ...json })
        setState('ready')
      } catch {
        setState('error')
      }
    }
    load()
  }, [])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Fehler beim Laden. Bitte Seite neu laden.</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <DashboardClient
      user={data.user}
      budgetYears={data.budgetYears}
      activeYear={data.activeYear}
      expenses={data.expenses}
      incomes={data.incomes}
      categories={data.categories}
    />
  )
}
