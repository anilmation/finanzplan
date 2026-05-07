import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  })

  const currentYear = new Date().getFullYear()
  const budgetYears = await prisma.budgetYear.findMany({
    where: { userId: user.id },
    orderBy: { year: 'desc' },
  })

  const activeYear = budgetYears.find((y) => y.year === currentYear) ?? budgetYears[0] ?? null

  if (!activeYear) {
    return NextResponse.json({
      budgetYears: budgetYears.map((y) => ({
        id: y.id, userId: y.userId, year: y.year,
        createdAt: y.createdAt.toISOString(),
        copiedFromYearId: y.copiedFromYearId ?? undefined,
      })),
      activeYear: null,
      expenses: [],
      incomes: [],
      categories: [],
    })
  }

  const [expenses, incomes, categories] = await Promise.all([
    prisma.expense.findMany({
      where: { yearId: activeYear.id },
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.income.findMany({
      where: { yearId: activeYear.id },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.category.findMany({
      where: { userId: user.id },
      include: { children: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    }),
  ])

  return NextResponse.json({
    budgetYears: budgetYears.map((y) => ({
      id: y.id, userId: y.userId, year: y.year,
      createdAt: y.createdAt.toISOString(),
      copiedFromYearId: y.copiedFromYearId ?? undefined,
    })),
    activeYear: {
      id: activeYear.id, userId: activeYear.userId, year: activeYear.year,
      createdAt: activeYear.createdAt.toISOString(),
      copiedFromYearId: activeYear.copiedFromYearId ?? undefined,
    },
    expenses: expenses.map((e) => ({
      id: e.id, yearId: e.yearId, name: e.name,
      amount: Number(e.amount),
      frequency: e.frequency, type: e.type,
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
        id: e.category.id, userId: e.category.userId,
        name: e.category.name, color: e.category.color,
        icon: e.category.icon ?? 'tag',
        parentId: e.category.parentId ?? undefined,
        sortOrder: e.category.sortOrder, children: [],
      } : undefined,
    })),
    incomes: incomes.map((i) => ({
      id: i.id, yearId: i.yearId, name: i.name,
      amount100Pct: Number(i.amount100Pct),
      employmentPct: i.employmentPct,
      factor: Number(i.factor ?? 1),
      monthSplitFrom: i.monthSplitFrom ?? undefined,
      monthSplitAmount: i.monthSplitAmount ? Number(i.monthSplitAmount) : undefined,
      monthSplitFactor: i.monthSplitFactor ? Number(i.monthSplitFactor) : undefined,
      monthSplitEmploymentPct: i.monthSplitEmploymentPct ?? undefined,
      frequency: i.frequency, type: i.type,
      notes: i.notes ?? undefined,
      sortOrder: i.sortOrder,
      createdAt: i.createdAt.toISOString(),
    })),
    categories: categories.map((c) => ({
      id: c.id, userId: c.userId, name: c.name,
      color: c.color, icon: c.icon ?? 'tag',
      parentId: c.parentId ?? undefined,
      sortOrder: c.sortOrder,
      children: c.children.map((ch) => ({
        id: ch.id, userId: ch.userId, name: ch.name,
        color: ch.color, icon: ch.icon ?? 'tag',
        parentId: ch.parentId ?? undefined,
        sortOrder: ch.sortOrder, children: [],
      })),
    })),
  })
}
