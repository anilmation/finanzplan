// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RealitaetClient } from '@/components/budget/RealitaetClient'

export default async function RealitaetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const currentYear = new Date().getFullYear()
  const budgetYear = await prisma.budgetYear.findFirst({
    where: { userId: user.id, year: currentYear },
  })

  if (!budgetYear) redirect('/dashboard')

  const [expenses, incomes, transactions, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { yearId: budgetYear.id },
      include: { category: true },
    }),
    prisma.income.findMany({ where: { yearId: budgetYear.id } }),
    prisma.transaction.findMany({
      where: { yearId: budgetYear.id },
      orderBy: { date: 'desc' },
      include: { matchedExpense: true },
    }),
    prisma.category.findMany({ where: { userId: user.id } }),
  ])

  return (
    <RealitaetClient
      user={{ id: user.id, email: user.email }}
      year={{
        id: budgetYear.id,
        userId: budgetYear.userId,
        year: budgetYear.year,
        createdAt: budgetYear.createdAt.toISOString(),
        copiedFromYearId: budgetYear.copiedFromYearId ?? undefined,
      }}
      expenses={expenses.map((e) => ({
        id: e.id,
        yearId: e.yearId,
        name: e.name,
        amount: Number(e.amount),
        frequency: e.frequency,
        type: e.type,
        notes: e.notes ?? undefined,
        discountPct: e.discountPct ?? 0,
        factor: Number(e.factor ?? 1),
        monthSplitFrom: e.monthSplitFrom ?? undefined,
        monthSplitAmount: e.monthSplitAmount ? Number(e.monthSplitAmount) : undefined,
        monthSplitFactor: e.monthSplitFactor ? Number(e.monthSplitFactor) : undefined,
        categoryId: e.categoryId ?? undefined,
        sortOrder: e.sortOrder,
        createdAt: e.createdAt.toISOString(),
        category: e.category ? {
          id: e.category.id,
          userId: e.category.userId,
          name: e.category.name,
          color: e.category.color,
          icon: e.category.icon ?? 'tag',
          parentId: e.category.parentId ?? undefined,
          sortOrder: e.category.sortOrder,
          children: [],
        } : undefined,
      }))}
      incomes={incomes.map((i) => ({
        id: i.id,
        yearId: i.yearId,
        name: i.name,
        amount100Pct: Number(i.amount100Pct),
        employmentPct: i.employmentPct,
        factor: Number(i.factor ?? 1),
        monthSplitFrom: i.monthSplitFrom ?? undefined,
        monthSplitAmount: i.monthSplitAmount ? Number(i.monthSplitAmount) : undefined,
        monthSplitFactor: i.monthSplitFactor ? Number(i.monthSplitFactor) : undefined,
        monthSplitEmploymentPct: i.monthSplitEmploymentPct ?? undefined,
        frequency: i.frequency,
        type: i.type,
        notes: i.notes ?? undefined,
        sortOrder: i.sortOrder,
        createdAt: i.createdAt.toISOString(),
      }))}
      transactions={transactions.map((t) => ({
        id: t.id,
        yearId: t.yearId,
        date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: Number(t.amount),
        matchedExpenseId: t.matchedExpenseId ?? undefined,
        aiCategory: t.aiCategory ?? undefined,
        aiConfidence: t.aiConfidence ?? undefined,
        isIncome: t.isIncome,
        createdAt: t.createdAt.toISOString(),
        matchedExpense: t.matchedExpense ? {
          id: t.matchedExpense.id,
          yearId: t.matchedExpense.yearId,
          name: t.matchedExpense.name,
          amount: Number(t.matchedExpense.amount),
          frequency: t.matchedExpense.frequency,
          type: t.matchedExpense.type,
          notes: t.matchedExpense.notes ?? undefined,
          discountPct: t.matchedExpense.discountPct ?? 0,
          factor: Number(t.matchedExpense.factor ?? 1),
          monthSplitFrom: t.matchedExpense.monthSplitFrom ?? undefined,
          monthSplitAmount: t.matchedExpense.monthSplitAmount ? Number(t.matchedExpense.monthSplitAmount) : undefined,
          monthSplitFactor: t.matchedExpense.monthSplitFactor ? Number(t.matchedExpense.monthSplitFactor) : undefined,
          categoryId: t.matchedExpense.categoryId ?? undefined,
          sortOrder: t.matchedExpense.sortOrder,
          createdAt: t.matchedExpense.createdAt.toISOString(),
        } : undefined,
      }))}
      categories={categories.map((c) => ({
        id: c.id,
        userId: c.userId,
        name: c.name,
        color: c.color,
        icon: c.icon ?? 'tag',
        parentId: c.parentId ?? undefined,
        sortOrder: c.sortOrder,
        children: [],
      }))}
    />
  )
}
